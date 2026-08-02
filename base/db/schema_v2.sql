-- ============================================================
-- BASE 스키마 v2.0 (2026-08-02) — featurelist CSV 기준 전면 재설계
-- 변경 요지: 로그인 삭제(기기 UUID 인증) · post_type 3종 · 무난함 판정 ·
--            매거진 신설 · 예약 슬롯 · 익명/실명 비대칭 제거
-- 실행: Supabase SQL Editor에 통째로 붙여넣기 (v1 테이블은 아래 DROP으로 정리)
-- ============================================================

-- ---------- 0) v1 정리 (해커톤 단계라 데이터 보존 불필요) ----------
drop view if exists posts_feed cascade;
drop view if exists profiles_public cascade;
drop function if exists spend_hearts(uuid,int,text,uuid) cascade;
drop function if exists earn_hearts(uuid,int,text,uuid) cascade;
drop function if exists current_user_id() cascade;
drop function if exists sync_comment_upvotes() cascade;
drop table if exists reports, reviews, bookings, expert_services,
  quiz_results, reputation_events, heart_transactions,
  comment_votes, comments, votes, poll_options, post_images, posts, users cascade;

-- ---------- 1) 유저 (기기 UUID = 신원) ----------
-- 세션·JWT·쿠키·비밀번호 없음. X-Device-Id 헤더의 UUID가 유일한 신원.
create table users (
  device_id   uuid primary key,                      -- 클라이언트 생성 UUID v4
  nickname    text not null unique,                  -- "부지런한 판다 #3901"
  temperature numeric(4,1) not null default 36.5,
  hearts      integer not null default 5 check (hearts >= 0),
  created_at  timestamptz not null default now()
);

-- ---------- 2) 글 ----------
-- ★ category(주제)와 post_type(물어보는 방식)은 완전히 다른 축이다.
--   '무난무난'은 카테고리가 아니라 post_type='무난함판정' 필터다 — category에 넣지 말 것.
create table posts (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references users(device_id) on delete cascade,
  category   text not null check (category in ('옷','스킨케어','바디&향수','자유')),
  post_type  text not null check (post_type in ('일반글','선택지투표','무난함판정')),
  title      text not null check (length(btrim(title)) > 0),
  body       text not null check (length(btrim(body))  > 0),
  created_at timestamptz not null default now()
);
create index idx_posts_recent   on posts (created_at desc);              -- 전체 탭 최신순
create index idx_posts_category on posts (category, created_at desc);    -- 카테고리 탭
create index idx_posts_type     on posts (post_type, created_at desc);   -- 무난무난 탭
create index idx_posts_mine     on posts (device_id, created_at desc);   -- 내 글

create table post_images (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  url        text not null,
  sort_order int not null default 0
);
create index idx_post_images on post_images (post_id, sort_order);

-- ---------- 3) 선택지 투표 (post_type='선택지투표'일 때만) ----------
create table poll_options (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  text       text not null,
  sort_order int not null default 0,
  unique (id, post_id)                                   -- 교차 글 투표 차단용
);

create table poll_votes (
  post_id   uuid not null references posts(id) on delete cascade,
  option_id uuid not null,
  device_id uuid not null references users(device_id) on delete cascade,
  voted_at  timestamptz not null default now(),
  primary key (post_id, device_id),                      -- 1기기 1표 + 선택지 이동(upsert)
  foreign key (option_id, post_id)
    references poll_options (id, post_id) on delete cascade
);
create index idx_poll_votes_option on poll_votes (option_id);

-- ---------- 4) 무난함 판정 (post_type='무난함판정'일 때만) ----------
-- 작성자가 선택지를 못 만든다. 고정 2종만.
create table nanhan_votes (
  post_id   uuid not null references posts(id) on delete cascade,
  device_id uuid not null references users(device_id) on delete cascade,
  choice    text not null check (choice in ('무난해요','애매해요')),
  voted_at  timestamptz not null default now(),
  primary key (post_id, device_id)                       -- 1기기 1표 + 반대편으로 이동
);
create index idx_nanhan_post on nanhan_votes (post_id);

-- ---------- 5) 댓글 (1단계만 — parent_id 없음) ----------
create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  device_id  uuid not null references users(device_id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0),
  likes      integer not null default 0,                 -- 트리거가 자동 관리
  created_at timestamptz not null default now()
);
create index idx_comments_post on comments (post_id, likes desc, created_at desc);
create index idx_comments_mine on comments (device_id, created_at desc);

create table comment_likes (
  comment_id uuid not null references comments(id) on delete cascade,
  device_id  uuid not null references users(device_id) on delete cascade,
  primary key (comment_id, device_id)                    -- 1인 1회, 재클릭 시 삭제=취소
);

-- 자기 댓글 추천 차단 (DB 레벨)
create or replace function block_self_like() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from comments c
             where c.id = new.comment_id and c.device_id = new.device_id) then
    raise exception 'SELF_LIKE_NOT_ALLOWED';
  end if;
  return new;
end $$;
create trigger trg_block_self_like
  before insert on comment_likes
  for each row execute function block_self_like();

-- likes 캐시 자동 동기화
create or replace function sync_comment_likes() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update comments set likes = likes + 1 where id = new.comment_id;
    return new;
  else
    update comments set likes = greatest(likes - 1, 0) where id = old.comment_id;
    return old;
  end if;
end $$;
create trigger trg_sync_comment_likes
  after insert or delete on comment_likes
  for each row execute function sync_comment_likes();

-- ---------- 6) 매거진 ----------
create table articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  lead         text,                                     -- 리드문
  body         text not null,                            -- 마크다운
  category     text not null check (category in ('옷','스킨케어','바디&향수','자유')),
  cover_url    text,
  read_minutes int not null default 3,
  is_hero      boolean not null default false,           -- 매거진 상단 히어로
  published_at timestamptz not null default now()
);
create index idx_articles_recent on articles (published_at desc);
ㄴ
create table quizzes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  category    text not null check (category in ('옷','스킨케어','바디&향수','자유')),
  questions   jsonb not null,                            -- [{q, options:[...]}]
  results     jsonb not null                             -- {타입: {name, desc, actions:[...]}}
);

create table quiz_results (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  device_id   uuid references users(device_id) on delete set null,
  result_type text not null,
  answers     jsonb not null,
  created_at  timestamptz not null default now()
);
create index idx_quiz_results on quiz_results (quiz_id, result_type);

-- ---------- 7) 컨설팅 (시드 고정) ----------
create table experts (
  id          uuid primary key default gen_random_uuid(),
  device_id   uuid not null unique references users(device_id) on delete cascade,
  specialty   text not null check (specialty in ('옷','스킨케어','바디&향수')),
  intro       text not null,
  price_chat  integer not null,
  price_video integer not null,
  created_at  timestamptz not null default now(),
  unique (id, device_id)                                 -- 예약 정합성용
);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  expert_id  uuid not null references experts(id) on delete cascade,
  device_id  uuid references users(device_id) on delete set null,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now()
);
create index idx_reviews_expert on reviews (expert_id);

create table expert_slots (
  id        uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  slot_at   timestamptz not null,
  is_open   boolean not null default true,
  unique (expert_id, slot_at)
);
create index idx_slots_expert on expert_slots (expert_id, slot_at);

create table bookings (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references users(device_id) on delete cascade,
  expert_id  uuid not null references experts(id) on delete cascade,
  slot_id    uuid not null unique references expert_slots(id),  -- 슬롯 중복 예약 차단
  concerns   text[] not null default '{}',
  memo       text,
  status     text not null default '신청 접수' check (status in ('신청 접수')),
  created_at timestamptz not null default now()
);
create index idx_bookings_mine on bookings (device_id, created_at desc);

-- ---------- 8) 하트 원장 (최하위 우선순위, 배지+차감만) ----------
create table heart_transactions (
  id            uuid primary key default gen_random_uuid(),
  device_id     uuid not null references users(device_id) on delete cascade,
  delta         integer not null,
  reason        text not null,                           -- signup|post_spend
  ref_id        uuid,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index idx_hearts_mine on heart_transactions (device_id, created_at desc);

-- ---------- 9) 신고 (버튼 자리만 — 정책 미결정) ----------
create table reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post','comment')),
  target_id   uuid not null,
  device_id   uuid not null references users(device_id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 10) 피드 뷰 — 카드에 필요한 집계를 한 번에 (N+1 방지)
--     ★무난함 %는 여기서만 계산한다. 피드 배지와 상세가 같은 값을 쓰도록 단일 소스.
-- ============================================================
create view posts_feed as
select
  p.id, p.category, p.post_type, p.title, p.body, p.created_at, p.device_id,
  u.nickname, u.temperature,
  (select url from post_images pi where pi.post_id = p.id
    order by pi.sort_order limit 1)                       as thumbnail_url,
  (select count(*) from comments c where c.post_id = p.id) as comment_count,
  case p.post_type
    when '선택지투표' then (select count(*) from poll_votes  v where v.post_id = p.id)
    when '무난함판정' then (select count(*) from nanhan_votes n where n.post_id = p.id)
    else 0
  end                                                      as vote_count,
  case when p.post_type = '무난함판정' then (
    select case when count(*) = 0 then null           -- 0표면 배지 숨김
             else round(count(*) filter (where n.choice = '무난해요') * 100.0 / count(*))
           end
    from nanhan_votes n where n.post_id = p.id
  ) end                                                    as nanhan_percent
from posts p
join users u on u.device_id = p.device_id;

-- ============================================================
-- 11) 원자적 동작 함수 (서버 Route Handler에서만 호출)
-- ============================================================

-- 글 작성 = 하트 차감 + 글 insert 를 한 트랜잭션으로
create or replace function create_post(
  p_device uuid, p_category text, p_type text, p_title text, p_body text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_balance int; v_post uuid;
begin
  update users set hearts = hearts - 1
   where device_id = p_device and hearts >= 1
   returning hearts into v_balance;
  if v_balance is null then raise exception 'INSUFFICIENT_HEARTS'; end if;

  insert into posts (device_id, category, post_type, title, body)
  values (p_device, p_category, p_type, p_title, p_body)
  returning id into v_post;

  insert into heart_transactions (device_id, delta, reason, ref_id, balance_after)
  values (p_device, -1, 'post_spend', v_post, v_balance);
  return v_post;
end $$;

-- 선택지 투표 (1기기 1표, 다른 선택지 누르면 이동)
create or replace function cast_poll_vote(
  p_post uuid, p_option uuid, p_device uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into poll_votes (post_id, option_id, device_id)
  values (p_post, p_option, p_device)
  on conflict (post_id, device_id)
  do update set option_id = excluded.option_id, voted_at = now();
end $$;

-- 무난함 판정 (1기기 1표, 반대편 누르면 이동)
create or replace function cast_nanhan_vote(
  p_post uuid, p_choice text, p_device uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into nanhan_votes (post_id, device_id, choice)
  values (p_post, p_device, p_choice)
  on conflict (post_id, device_id)
  do update set choice = excluded.choice, voted_at = now();
end $$;

-- ============================================================
-- 12) 보안: RLS 전면 차단
--     기기 UUID는 Supabase가 검증할 수 없으므로(=auth.uid() 없음)
--     클라이언트 직접 접근을 전부 막고 서버 Route Handler(secret key)만 통과시킨다.
-- ============================================================
alter table users              enable row level security;
alter table posts              enable row level security;
alter table post_images        enable row level security;
alter table poll_options       enable row level security;
alter table poll_votes         enable row level security;
alter table nanhan_votes       enable row level security;
alter table comments           enable row level security;
alter table comment_likes      enable row level security;
alter table articles           enable row level security;
alter table quizzes            enable row level security;
alter table quiz_results       enable row level security;
alter table experts            enable row level security;
alter table reviews            enable row level security;
alter table expert_slots       enable row level security;
alter table bookings           enable row level security;
alter table heart_transactions enable row level security;
alter table reports            enable row level security;
-- 정책을 만들지 않는다 = anon/authenticated는 0행. (의도된 설계)
