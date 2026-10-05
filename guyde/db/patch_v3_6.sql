-- ============================================================
-- GUYDE 스키마 패치 v3.6 (2026-08-06) — 댓글 사진
--
-- 전제: patch_v3_5.sql 까지 적용된 DB.
--
-- 왜 필요한가
--   이 앱의 댓글은 "그 바지는 이런 느낌이에요" 같은 대답이 많다. 글로만
--   답하면 결국 "사진 있으세요?"가 한 번 더 오간다. 답하는 쪽이 바로 보여줄
--   수 있어야 한 번에 끝난다.
--
-- 한 장만 받는다
--   여러 장을 받으려면 별도 테이블(comment_images)이 필요한데, 댓글은 글이
--   아니라 대답이라 여러 장이 필요한 경우가 드물다. 컬럼 하나로 둔다 —
--   나중에 여러 장이 필요해지면 그때 테이블로 옮기면 된다.
--
-- 본문 없이 사진만 남기는 건 막는다
--   comments.body 에 이미 `length(btrim(body)) > 0` 체크가 걸려 있다.
--   그대로 둔다 — 사진만 덩그러니 달리면 무슨 뜻인지 읽는 쪽이 알 수 없다.
--
-- 무엇을 바꾸나
--   1) comments.image_url 추가 (null = 사진 없음)
--   2) comments_view 에 image_url 노출
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

alter table comments add column if not exists image_url text;

-- ------------------------------------------------------------
-- comments_view 재정의 (patch_v3_2의 정의 + image_url)
-- ⚠️ security_invoker = on 을 빠뜨리면 뷰가 정의자 권한으로 돌아
--    밑에 깔린 테이블의 RLS를 통째로 우회한다.
-- ------------------------------------------------------------
drop view if exists comments_view cascade;
create view comments_view with (security_invoker = on) as
select
  c.id, c.post_id, c.device_id, c.body, c.likes, c.created_at,
  c.parent_id,
  c.image_url,
  u.nickname,
  calc_temperature(c.device_id)                                as temperature,
  exists (select 1 from experts e where e.device_id = c.device_id) as is_expert
from comments c
join users u on u.device_id = c.device_id;

commit;
