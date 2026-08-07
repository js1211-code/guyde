-- ============================================================
-- GUYDE 스키마 패치 v3.2 (2026-08-05) — 답글 + 고수 표시
--
-- 전제: patch_v3_1.sql 까지 적용된 DB.
--
-- 1) 답글(대댓글). v2에서는 스코프 밖이었는데 채택했다.
--    인스타처럼 **1단계까지만** 허용한다 — 답글에 답글을 달면 화면이
--    무한히 안으로 밀려서 모바일 폭에서 읽을 수 없게 된다.
--    깊이 제한은 트리거로 강제한다. 화면에서만 막으면 API로 우회된다.
--
-- 2) 고수 여부를 뷰가 직접 알려준다.
--    ⚠️ 온도 42.0을 넘겼다고 고수가 아니다. 고수는 `experts`에 행이 있는
--    사람이다. 온도는 자격 조건일 뿐이고 실제 임명은 별개다.
--    화면에서 온도로 고수를 판별하면 42도 넘긴 일반 유저에게 고수 뱃지가
--    붙는다 — 이 서비스에서 제일 하면 안 되는 거짓 표시다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. 답글
-- ------------------------------------------------------------
alter table comments add column if not exists parent_id uuid
  references comments(id) on delete cascade;

create index if not exists comments_parent_idx on comments (parent_id, created_at);

-- 답글의 답글 차단. 부모가 이미 부모를 갖고 있으면 거부한다.
create or replace function block_nested_reply() returns trigger
language plpgsql as $$
declare
  parent_parent uuid;
  parent_post   uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id, post_id into parent_parent, parent_post
    from comments where id = new.parent_id;

  if not found then
    raise exception 'PARENT_COMMENT_NOT_FOUND';
  end if;

  if parent_parent is not null then
    raise exception 'REPLY_DEPTH_EXCEEDED';
  end if;

  -- 다른 글의 댓글에 답글을 달 수 없다. 이게 뚫리면 댓글이 엉뚱한 글에 붙는다.
  if parent_post <> new.post_id then
    raise exception 'PARENT_POST_MISMATCH';
  end if;

  return new;
end $$;

drop trigger if exists comments_block_nested_reply on comments;
create trigger comments_block_nested_reply
  before insert or update on comments
  for each row execute function block_nested_reply();

-- ------------------------------------------------------------
-- 2. comments_view — parent_id + is_expert
--    security_invoker = on 이 없으면 뷰가 RLS를 우회한다.
-- ------------------------------------------------------------
drop view if exists comments_view cascade;
create view comments_view with (security_invoker = on) as
select
  c.id, c.post_id, c.device_id, c.body, c.likes, c.created_at,
  c.parent_id,
  u.nickname,
  calc_temperature(c.device_id)                                as temperature,
  exists (select 1 from experts e where e.device_id = c.device_id) as is_expert
from comments c
join users u on u.device_id = c.device_id;

-- ------------------------------------------------------------
-- 3. posts_feed — 글쓴이도 고수면 표시해야 앞뒤가 맞는다.
--    댓글에만 뱃지가 붙으면 "이 사람 고수인데 글에는 표시가 없네"가 된다.
-- ------------------------------------------------------------
drop view if exists posts_feed cascade;
create view posts_feed with (security_invoker = on) as
select
  p.id, p.category, p.post_type, p.title, p.body, p.created_at, p.device_id,
  u.nickname,
  calc_temperature(p.device_id)                            as temperature,
  exists (select 1 from experts e where e.device_id = p.device_id) as is_expert,
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

commit;
