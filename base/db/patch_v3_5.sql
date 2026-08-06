-- ============================================================
-- GUYDE 스키마 패치 v3.5 (2026-08-06) — 투표 종료
--
-- 전제: patch_v3_4.sql 까지 적용된 DB.
--
-- 왜 종료가 필요한가
--   지금은 투표가 영원히 열려 있어서 "이게 최종 결과인가"를 알 수 없다.
--   도서관 무난템 서가도 아직 표가 들어오는 중인 글을 올려버린다.
--   글쓴이가 "이만 됐다"고 닫을 수 있어야 그 시점의 숫자가 결론이 된다.
--
-- 되돌릴 수 없다
--   닫았다 다시 열 수 있으면, 닫아서 결과를 본 다음 열어두는 것만으로
--   "투표해야 결과가 보인다"는 규칙이 무력해진다. 그래서 한 방향이다.
--
-- 무엇을 바꾸나
--   1) posts.closed_at 추가 (null = 진행 중)
--   2) posts_feed 뷰에 closed_at 노출
--
-- 결과 공개 규칙은 API가 정한다(내가 투표했거나 || 종료됐거나).
-- 뷰에는 넣지 않는다 — 뷰는 보는 사람이 누구인지 모른다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

alter table posts add column if not exists closed_at timestamptz;

-- ------------------------------------------------------------
-- posts_feed 재정의 (patch_v3_4의 정의 + closed_at)
-- ⚠️ security_invoker = on 을 빠뜨리면 뷰가 정의자 권한으로 돌아
--    밑에 깔린 테이블의 RLS를 통째로 우회한다.
-- ------------------------------------------------------------
drop view if exists posts_feed cascade;
create view posts_feed with (security_invoker = on) as
select
  p.id, p.category, p.post_type, p.title, p.body, p.created_at, p.device_id,
  p.edited_at,
  p.closed_at,
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

-- ------------------------------------------------------------
-- 종료된 글에는 표를 더 받지 않는다.
--
-- 화면에서 버튼을 감추는 것만으로는 부족하다 — 종료 직전에 열어둔 화면이
-- 남아 있으면 그 버튼이 여전히 눌린다. 규칙은 DB에 둔다.
-- ------------------------------------------------------------
create or replace function block_vote_on_closed() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from posts p where p.id = new.post_id and p.closed_at is not null) then
    raise exception 'POLL_CLOSED';
  end if;
  return new;
end $$;

drop trigger if exists poll_votes_closed on poll_votes;
create trigger poll_votes_closed
  before insert or update on poll_votes
  for each row execute function block_vote_on_closed();

drop trigger if exists nanhan_votes_closed on nanhan_votes;
create trigger nanhan_votes_closed
  before insert or update on nanhan_votes
  for each row execute function block_vote_on_closed();

commit;
