-- ============================================================
-- BASE 스키마 패치 v2.3 (2026-08-03) — 카테고리에 '헤어' 추가
-- schema_v2.sql + patch_v2_1.sql 이 적용된 DB 위에 실행한다.
--
-- 카테고리는 CHECK 제약으로 4곳에 박혀 있다. 한 군데라도 빠뜨리면
-- 화면에는 탭이 생기는데 저장은 거부되는 상태가 된다.
--   posts.category / articles.category / quizzes.category / experts.specialty
--
-- specialty에도 넣는 이유: 전문분야 = 온도가 쌓이는 카테고리(자유 제외)라서
-- 헤어를 주제로 열어두면 헤어 고수도 있어야 앞뒤가 맞는다.
--
-- 재실행해도 안전하다(drop if exists → add).
-- ============================================================

alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category in ('헤어','옷','스킨케어','바디&향수','자유'));

alter table articles drop constraint if exists articles_category_check;
alter table articles add constraint articles_category_check
  check (category in ('헤어','옷','스킨케어','바디&향수','자유'));

alter table quizzes drop constraint if exists quizzes_category_check;
alter table quizzes add constraint quizzes_category_check
  check (category in ('헤어','옷','스킨케어','바디&향수','자유'));

alter table experts drop constraint if exists experts_specialty_check;
alter table experts add constraint experts_specialty_check
  check (specialty in ('헤어','옷','스킨케어','바디&향수'));
