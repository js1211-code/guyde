-- ============================================================
-- GUYDE 스키마 패치 v3.7 (2026-08-06) — 사진만 있는 댓글 허용
--
-- 전제: patch_v3_6.sql 까지 적용된 DB.
--
-- 무엇을 바꾸나
--   comments.body 의 "빈 값 금지" 체크를 "본문이나 사진 중 하나는 있어야 한다"로
--   바꾼다. 사진 한 장이 곧 대답인 경우가 많다 — "이런 느낌이요?" 하고 사진만
--   올리는 게 자연스럽다.
--
--   body는 not null 그대로 두고 빈 문자열을 허용한다. null 을 허용하면
--   화면·API 곳곳에서 body가 없을 수 있는 경우를 새로 다뤄야 하는데,
--   빈 문자열이면 지금 코드가 그대로 돈다.
--
-- 여전히 막는 것
--   본문도 없고 사진도 없는 댓글. 아무것도 없는 줄이 목록에 쌓이면
--   읽는 쪽에서는 고장으로 보인다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

alter table comments drop constraint if exists comments_body_check;

alter table comments
  add constraint comments_body_or_image
  check (length(btrim(body)) > 0 or image_url is not null);

commit;
