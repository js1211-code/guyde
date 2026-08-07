-- ============================================================
-- GUYDE 스키마 패치 v3 (2026-08-04) — 컨설팅 전면 재설계
--
-- 전제: schema_v2.sql → patch_v2_1.sql → patch_v2_3.sql 순으로 적용된 DB.
-- patch_v2_3(헤어 카테고리)을 아직 안 돌렸다면 이것보다 먼저 돌려야 한다.
--
-- 무엇이 바뀌나
--   v2 컨설팅 = 고수 목록 → 달력 → 시간 슬롯 → 예약 신청 (일정 잡기)
--   v3 컨설팅 = 사전 설문 → 선결제 → 고수 답변 → 피드백(수정 1회) → 완료
--
-- 즉 "언제 만날지"를 잡는 서비스가 아니라 "무엇을 살지"를 문서로 받는
-- 서비스가 됐다. 그래서 expert_slots는 통째로 사라지고, bookings는
-- 설문 답변 + 진행 상태를 담는 주문서가 된다.
--
-- 재실행해도 안전하게 썼다(if exists / if not exists / drop constraint 선행).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. experts — 채팅/화상 2가격 → 단일가
--    상담 방식 선택이 사라졌으므로 가격도 하나다.
-- ------------------------------------------------------------
alter table experts add column if not exists price integer;

-- 기존 행이 있으면 채팅가를 승계한다. 둘 다 비어 있으면 기본 단가.
-- price_chat은 이 패치가 아래에서 지우므로, 재실행 때는 이미 없다.
-- 컬럼을 직접 참조하면 두 번째 실행에서 파싱 단계에서 터진다 —
-- 존재할 때만 도는 동적 SQL로 감싼다.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'experts' and column_name = 'price_chat'
  ) then
    execute 'update experts set price = coalesce(price, price_chat, 14900) where price is null';
  end if;
end $$;

update experts set price = 14900 where price is null;

alter table experts alter column price set not null;
alter table experts drop constraint if exists experts_price_positive;
alter table experts add constraint experts_price_positive check (price > 0);

alter table experts drop column if exists price_chat;
alter table experts drop column if exists price_video;

-- ------------------------------------------------------------
-- 2. expert_slots 폐기
--    bookings.slot_id가 이걸 참조하므로 컬럼을 먼저 떼고 테이블을 지운다.
-- ------------------------------------------------------------
alter table bookings drop column if exists slot_id;
drop table if exists expert_slots;

-- ------------------------------------------------------------
-- 3. bookings — 주문서로 재정의
--
-- status 4단계는 화면 ⑰의 스테퍼와 1:1로 맞춘다.
--   신청 접수 → 답변 도착 → 수정 요청됨 → 완료
-- '수정 요청됨'은 '답변 도착'에서만 갈 수 있고 딱 1회다(revision_count).
-- ------------------------------------------------------------
alter table bookings add column if not exists purpose      text;
alter table bookings add column if not exists budget_min   integer;
alter table bookings add column if not exists budget_max   integer;
alter table bookings add column if not exists body_note    text;      -- 신경 쓰이는 부위 자유 서술
alter table bookings add column if not exists style_note   text;      -- 원하는 스타일
alter table bookings add column if not exists price        integer;   -- 결제액 스냅샷
alter table bookings add column if not exists due_at       timestamptz;
alter table bookings add column if not exists answered_at  timestamptz;
alter table bookings add column if not exists closed_at    timestamptz;
alter table bookings add column if not exists revision_count integer not null default 0;

-- 기존 데모 행이 있을 때만 채워 넣는다. 새 DB면 아무것도 안 걸린다.
update bookings set purpose    = coalesce(purpose, '기타'),
                    budget_min = coalesce(budget_min, 150000),
                    budget_max = coalesce(budget_max, 300000),
                    price      = coalesce(price, 14900),
                    due_at     = coalesce(due_at, created_at + interval '48 hours')
 where purpose is null or budget_min is null or price is null or due_at is null;

alter table bookings alter column purpose    set not null;
alter table bookings alter column budget_min set not null;
alter table bookings alter column budget_max set not null;
alter table bookings alter column price      set not null;
alter table bookings alter column due_at     set not null;

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('신청 접수','답변 도착','수정 요청됨','완료'));
alter table bookings alter column status set default '신청 접수';

alter table bookings drop constraint if exists bookings_budget_check;
alter table bookings add constraint bookings_budget_check
  check (budget_min > 0 and budget_max >= budget_min);

-- 수정 요청은 1회 한정(F: "수정 요청 사유 · 1회 한정").
alter table bookings drop constraint if exists bookings_revision_check;
alter table bookings add constraint bookings_revision_check
  check (revision_count between 0 and 1);

create index if not exists bookings_device_idx on bookings (device_id, created_at desc);
create index if not exists bookings_expert_idx on bookings (expert_id, status);

-- ------------------------------------------------------------
-- 4. booking_images — 전신 사진(필수) + 자주 입는 옷 사진(선택)
--    "얼굴은 가려도 괜찮아요" 안내가 붙는 그 사진들.
--    전신 사진 최소 1장은 API에서 검사한다(설문 제출이 한 트랜잭션이라
--    DB 제약으로 걸면 insert 순서에 묶여서 오히려 다루기 나쁘다).
-- ------------------------------------------------------------
create table if not exists booking_images (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  kind       text not null check (kind in ('전신','착장')),
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists booking_images_booking_idx
  on booking_images (booking_id, kind, sort_order);

-- ------------------------------------------------------------
-- 5. consulting_answers — 고수가 쓰는 답변 본문
--    round 1 = 최초 답변, round 2 = 수정 요청에 대한 확정안.
--    avoid는 "피해야 할 것" 칩 배열.
-- ------------------------------------------------------------
create table if not exists consulting_answers (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  round      integer not null default 1 check (round between 1 and 2),
  diagnosis  text not null,
  avoid      text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (booking_id, round)
);

-- ------------------------------------------------------------
-- 6. outfit_items — 착장 1세트. 상의/하의/신발 3칸 모두 필수.
--    reason은 "왜 이 아이템인가요?" — 최소 20자를 DB에서도 막는다.
--    링크만 던지고 끝나는 답변을 구조적으로 불가능하게 만드는 게 목적이다.
-- ------------------------------------------------------------
create table if not exists outfit_items (
  id        uuid primary key default gen_random_uuid(),
  answer_id uuid not null references consulting_answers(id) on delete cascade,
  slot      text not null check (slot in ('상의','하의','신발')),
  url       text not null,
  alt_url   text,                                     -- 품절 대비 대체 링크(선택)
  brand     text,
  name      text not null,
  price     integer not null check (price >= 0),
  reason    text not null check (char_length(reason) >= 20),
  unique (answer_id, slot)
);

-- ------------------------------------------------------------
-- 7. feedbacks — [이대로 좋아요] / [수정을 요청해요]
--    수정 요청일 때만 reason이 필요하다.
-- ------------------------------------------------------------
create table if not exists feedbacks (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  answer_id  uuid not null references consulting_answers(id) on delete cascade,
  kind       text not null check (kind in ('만족','수정요청')),
  reason     text,
  created_at timestamptz not null default now(),
  unique (booking_id, answer_id),
  constraint feedbacks_reason_required
    check (kind <> '수정요청' or char_length(coalesce(reason,'')) >= 10)
);

-- ------------------------------------------------------------
-- 8. refunds — "답변이 불만족스러우면 100% 환불돼요"
--    데모에선 실제 PG 연동이 없으므로 신청 기록만 남긴다.
-- ------------------------------------------------------------
create table if not exists refunds (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  amount     integer not null check (amount >= 0),
  reason     text,
  status     text not null default '접수' check (status in ('접수','완료')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. reviews — 컨설팅 완료 후 후기라서 booking에 붙는다.
--    한 건당 한 번만 쓸 수 있게 unique를 건다.
-- ------------------------------------------------------------
alter table reviews add column if not exists booking_id uuid
  references bookings(id) on delete cascade;

create unique index if not exists reviews_booking_uniq
  on reviews (booking_id) where booking_id is not null;

-- ------------------------------------------------------------
-- 10. RLS — 새 테이블도 정책 없이 켠다.
--     정책이 하나도 없으면 anon/authenticated는 0행을 본다.
--     모든 접근은 SUPABASE_SECRET_KEY를 쓰는 Route Handler를 통한다.
--     (켜지 않으면 device_id가 그대로 공개된다 — v2에서 실제로 뚫렸던 지점)
-- ------------------------------------------------------------
alter table booking_images     enable row level security;
alter table consulting_answers enable row level security;
alter table outfit_items       enable row level security;
alter table feedbacks          enable row level security;
alter table refunds            enable row level security;

-- ------------------------------------------------------------
-- 11. 착장 합계를 매번 세지 않도록 뷰로 뺀다.
--     예산 대비 80~100%면 초록, 벗어나면 주황/빨강 배지를 다는데
--     그 판정 기준을 화면마다 재구현하지 않게 pct까지 여기서 준다.
--     security_invoker = on 이 없으면 뷰가 RLS를 우회한다.
-- ------------------------------------------------------------
drop view if exists outfit_totals cascade;
create view outfit_totals with (security_invoker = on) as
select a.id                              as answer_id,
       a.booking_id,
       coalesce(sum(i.price), 0)::int    as total,
       count(i.id)::int                  as item_count,
       b.budget_max,
       case when b.budget_max > 0
            then round(coalesce(sum(i.price), 0) * 100.0 / b.budget_max)::int
       end                               as pct_of_budget
  from consulting_answers a
  join bookings b on b.id = a.booking_id
  left join outfit_items i on i.answer_id = a.id
 group by a.id, a.booking_id, b.budget_max;

commit;
