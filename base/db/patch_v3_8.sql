-- ============================================================
-- GUYDE 스키마 패치 v3.8 (2026-08-07) — 무난템 카드
--
-- 전제: patch_v3_7.sql 까지 적용된 DB.
--
-- ── 왜 필요한가 ──────────────────────────────────────────────
-- 도서관 '무난템' 서가는 지금까지 판정글을 그대로 다시 보여줬다. 그런데
-- 판정글은 "이거 무난해요?"라는 **질문**이다. 서가에 오는 사람은 답을
-- 찾으러 오는데 질문 목록을 받는 셈이었다. 제목이 '반바지 길이 이 정도면
-- 무난하지'인 카드를 보고 뭘 사야 하는지 알 수가 없다.
--
-- 그래서 판정이 끝난 글을 **아이템 카드**로 정리한다.
--   무엇을 / 얼마에 / 왜 무난한가 / 몇 명이 그렇다고 했나
--
-- ── 🚨 추천수를 컬럼으로 저장하지 않는다 ──────────────────────
-- 카드마다 `추천 312명` 같은 숫자를 박아넣고 싶은 유혹이 있는데, 그러면
-- 아무도 누를 수 없는 숫자가 화면에 뜬다. 이 서비스는 "판단자는 대중"이
-- 전부라서 그 숫자가 가짜면 서가 전체가 가짜가 된다.
--
-- 대신 **모든 카드는 실제 판정글에 매여 있다**(`post_id` not null).
-- 추천수는 그 글의 '무난해요' 표를 그대로 센다 — 지금 이 순간 누가 표를
-- 하나 더 던지면 카드 숫자도 같이 오른다. 카드가 얹는 건 사람이 정리한
-- 부분(아이템명·가격대·왜 무난한가)뿐이다.
--
-- 글 하나당 카드 하나다(`unique`). 같은 글에서 카드가 둘 나오면 같은 표를
-- 두 번 세게 된다.
--
-- ── 서가 조건은 그대로다 ─────────────────────────────────────
-- 60% 이상 · 종료된 글 · 10표 이상. 카드를 만들었다고 해서 통과시키지
-- 않는다 — 뷰에서 매번 확인하므로, 나중에 표가 뒤집히면 카드가 저절로
-- 서가에서 빠진다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

create table if not exists nanhan_picks (
  id          uuid primary key default gen_random_uuid(),

  -- 판정의 근거가 된 글. 지워지면 카드도 같이 지운다 — 근거 없는 카드는
  -- 그냥 광고다.
  post_id     uuid not null unique references posts(id) on delete cascade,

  -- 사람이 정리해 붙이는 부분
  name        text not null check (length(btrim(name)) > 0),
  price_band  text not null check (length(btrim(price_band)) > 0),
  one_liner   text not null check (length(btrim(one_liner)) > 0),
  -- 왜 무난한지는 한 줄로 안 된다. 이 서가의 존재 이유라 길이를 강제한다.
  why         text not null check (length(btrim(why)) >= 30),
  thumb_url   text not null,
  tags        text[] not null default '{}',

  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_nanhan_picks_order on nanhan_picks (sort_order, created_at desc);

alter table nanhan_picks enable row level security;   -- 정책 없음 = anon 0행

-- ------------------------------------------------------------
-- nanhan_picks_view — 카드 + 그 글의 실제 판정 결과
--
-- ⚠️ security_invoker = on 을 빠뜨리면 뷰가 정의자 권한으로 돌아 밑에 깔린
--    테이블의 RLS를 통째로 우회한다.
--
-- 서가 조건(60% · 종료 · 10표)은 여기서 걸지 않고 컬럼으로 내보낸다.
-- 뷰가 미리 걸러버리면 "조건을 놓친 카드"가 어디에도 안 보여서, 왜 서가에
-- 없는지 확인할 방법이 사라진다. 거르는 건 API가 한다.
-- ------------------------------------------------------------
drop view if exists nanhan_picks_view cascade;
create view nanhan_picks_view with (security_invoker = on) as
select
  k.id, k.post_id, k.name, k.price_band, k.one_liner, k.why,
  k.thumb_url, k.tags, k.sort_order, k.created_at,
  p.category,
  p.title                                            as post_title,
  -- 추천수 = 그 글에서 '무난해요'를 누른 사람 수. 저장값이 아니다.
  count(*) filter (where nv.choice = '무난해요')     as vouch_count,
  count(nv.device_id)                                as vote_count,
  case when count(nv.device_id) = 0 then null
       else round(100.0 * count(*) filter (where nv.choice = '무난해요')
                        / count(nv.device_id))
  end                                                as nanhan_percent,
  (p.closed_at is not null
   or now() >= p.created_at + interval '72 hours')    as is_closed
from nanhan_picks k
join posts p        on p.id = k.post_id
left join nanhan_votes nv on nv.post_id = k.post_id
group by k.id, p.category, p.title, p.closed_at, p.created_at;

commit;
