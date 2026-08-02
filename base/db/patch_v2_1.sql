-- ============================================================
-- BASE 스키마 패치 v2.1 (2026-08-02) — Updated Feature List 반영
-- schema_v2.sql이 이미 적용된 DB 위에 실행한다.
--
-- 변경 요지
--  1) 글 유형 3택 → 4택 ('정보공유' 신설, '일반글' → '일반질문')      F-23
--  2) post_likes 신설 — 정보 공유 글 좋아요 (자기 글 좋아요 차단)      F-38
--  3) 온도를 저장값이 아니라 계산값으로 (calc_temperature)             F-06
--  4) create_post — 정보 공유 글은 하트를 차감하지 않는다              F-80
--  5) posts_feed — 반응 수를 글 유형별로 다르게, 온도는 계산값으로     F-14/F-16
--
-- ※ 카테고리 표기: 피처리스트 CSV는 '위생', Notion/schema_v2는 '자유'.
--    Notion이 원본이라 '자유'로 간다. 바꾸려면 이 파일과 schema_v2.sql을 같이 고칠 것.
-- ============================================================

-- ---------- 1) 글 유형 4택 ----------
alter table posts drop constraint if exists posts_post_type_check;
update posts set post_type = '일반질문' where post_type = '일반글';
alter table posts add constraint posts_post_type_check
  check (post_type in ('정보공유','일반질문','선택지투표','무난함판정'));

-- ---------- 2) 정보 공유 글 좋아요 ----------
create table if not exists post_likes (
  post_id   uuid not null references posts(id) on delete cascade,
  device_id uuid not null references users(device_id) on delete cascade,
  liked_at  timestamptz not null default now(),
  primary key (post_id, device_id)          -- 1기기 1회, 재클릭 시 삭제=취소
);
create index if not exists idx_post_likes_post on post_likes (post_id);

-- 자기 글 좋아요 차단 + 정보 공유 글이 아니면 아예 거부
-- (질문글에 좋아요가 붙으면 질문으로 온도가 오르는 경로가 생긴다 — F-06/F-38)
create or replace function block_invalid_post_like() returns trigger
language plpgsql as $$
declare v_author uuid; v_type text;
begin
  select device_id, post_type into v_author, v_type
    from posts where id = new.post_id;

  if v_type is distinct from '정보공유' then
    raise exception 'LIKE_NOT_ALLOWED_FOR_POST_TYPE';
  end if;
  if v_author = new.device_id then
    raise exception 'SELF_LIKE_NOT_ALLOWED';
  end if;
  return new;
end $$;

drop trigger if exists trg_block_invalid_post_like on post_likes;
create trigger trg_block_invalid_post_like
  before insert on post_likes
  for each row execute function block_invalid_post_like();

alter table post_likes enable row level security;   -- 정책 없음 = anon 0행

-- ---------- 3) 온도 계산 (F-06) ----------
-- 저장하지 않고 조회할 때마다 집계한다.
--   36.5
--   + 내가 쓴 댓글 수            × 0.1
--   + 내 댓글이 받은 추천 수     × 0.5
--   + 내 정보공유 글이 받은 좋아요 수 × 0.2
-- category='자유' 글에서의 활동은 전부 제외(잡담방은 온도에 반영하지 않음).
-- 질문글은 기여 0 — 애초에 좋아요 UI가 없고, 질문으로 오르는 경로를 두면 안 된다.
create or replace function calc_temperature(p_device uuid)
returns numeric
language sql stable as $$
  select round(
      36.5
    + (select count(*) * 0.1
         from comments c
         join posts p on p.id = c.post_id
        where c.device_id = p_device
          and p.category <> '자유')
    + (select count(*) * 0.5
         from comment_likes cl
         join comments c on c.id = cl.comment_id
         join posts p    on p.id = c.post_id
        where c.device_id = p_device
          and p.category <> '자유')
    + (select count(*) * 0.2
         from post_likes pl
         join posts p on p.id = pl.post_id
        where p.device_id = p_device
          and p.post_type = '정보공유'
          and p.category <> '자유')
  , 1);
$$;

comment on column users.temperature is
  '캐시 전용. 진짜 값은 calc_temperature(device_id)로 계산한다 — F-06';

-- ---------- 4) 글 작성 (정보 공유는 하트 차감 없음) ----------
-- 선택지까지 한 트랜잭션에서 만든다.
drop function if exists create_post(uuid,text,text,text,text) cascade;

create or replace function create_post(
  p_device   uuid,
  p_category text,
  p_type     text,
  p_title    text,
  p_body     text,
  p_options  text[] default null      -- 선택지투표일 때만
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_balance int; v_post uuid; v_opt text; i int := 0;
begin
  -- 선택지는 선택지투표 글에만, 2~5개
  if p_type = '선택지투표' then
    if p_options is null or array_length(p_options,1) not between 2 and 5 then
      raise exception 'POLL_OPTIONS_OUT_OF_RANGE';
    end if;
  elsif p_options is not null and array_length(p_options,1) > 0 then
    raise exception 'POLL_OPTIONS_NOT_ALLOWED';
  end if;

  -- 하트는 '물어보는 값'이라 질문글에만 든다. 정보 공유는 무료 (F-80)
  if p_type = '정보공유' then
    select hearts into v_balance from users where device_id = p_device;
    if v_balance is null then raise exception 'USER_NOT_FOUND'; end if;
  else
    update users set hearts = hearts - 1
     where device_id = p_device and hearts >= 1
     returning hearts into v_balance;
    if v_balance is null then raise exception 'INSUFFICIENT_HEARTS'; end if;
  end if;

  insert into posts (device_id, category, post_type, title, body)
  values (p_device, p_category, p_type, p_title, p_body)
  returning id into v_post;

  if p_type = '선택지투표' then
    foreach v_opt in array p_options loop
      insert into poll_options (post_id, text, sort_order)
      values (v_post, v_opt, i);
      i := i + 1;
    end loop;
  end if;

  if p_type <> '정보공유' then
    insert into heart_transactions (device_id, delta, reason, ref_id, balance_after)
    values (p_device, -1, 'post_spend', v_post, v_balance);
  end if;

  return v_post;
end $$;

-- ---------- 5) 피드 뷰 재정의 ----------
-- 반응 수는 글 유형마다 다르다 (F-14):
--   선택지투표·무난함판정 → 투표 수 / 정보공유 → 좋아요 수 / 일반질문 → 반응 없음(0)
-- 무난함 %는 여기서만 계산한다 — 피드 배지와 상세가 같은 값을 쓰도록 단일 소스 (F-16/F-35)
create or replace view posts_feed as
select
  p.id, p.category, p.post_type, p.title, p.body, p.created_at, p.device_id,
  u.nickname,
  calc_temperature(p.device_id)                            as temperature,
  (select url from post_images pi where pi.post_id = p.id
    order by pi.sort_order limit 1)                        as thumbnail_url,
  (select count(*) from comments c where c.post_id = p.id) as comment_count,
  case p.post_type
    when '선택지투표' then (select count(*) from poll_votes   v  where v.post_id  = p.id)
    when '무난함판정' then (select count(*) from nanhan_votes n  where n.post_id  = p.id)
    when '정보공유'   then (select count(*) from post_likes   pl where pl.post_id = p.id)
    else 0
  end                                                      as reaction_count,
  case when p.post_type = '무난함판정' then (
    select case when count(*) = 0 then null                -- 0표면 %를 빼고 [무난함]만
             else round(count(*) filter (where n.choice = '무난해요') * 100.0 / count(*))
           end
    from nanhan_votes n where n.post_id = p.id
  ) end                                                    as nanhan_percent
from posts p
join users u on u.device_id = p.device_id;

-- ---------- 6) 댓글 뷰 ----------
-- 댓글마다 작성자 온도를 계산하면 N+1이 되므로 뷰에서 한 번에 붙인다 (F-41).
create or replace view comments_view as
select
  c.id, c.post_id, c.device_id, c.body, c.likes, c.created_at,
  u.nickname,
  calc_temperature(c.device_id) as temperature
from comments c
join users u on u.device_id = c.device_id;
