-- ============================================================
-- 스키마 v2.1 동작 검증 — 빈 DB에 schema_v2.sql + patch_v2_1.sql 적용 후 실행한다.
--   createdb base_test
--   psql -d base_test -f db/schema_v2.sql -f db/patch_v2_1.sql -f db/test_v2_1.sql
-- 각 줄이 PASS/FAIL로 나온다. 데이터를 남기므로 검증 전용 DB에서만 돌릴 것.
-- ============================================================
\set QUIET on
\pset tuples_only on
\pset format unaligned

-- ---------- 준비 ----------
insert into users (device_id, nickname) values
  ('00000000-0000-4000-8000-000000000001', '글쓴이'),
  ('00000000-0000-4000-8000-000000000002', '댓글만20개'),
  ('00000000-0000-4000-8000-000000000003', '추천20개받음'),
  ('00000000-0000-4000-8000-000000000004', '자유탭만활동');
-- 추천을 눌러줄 더미 20명 (자기 추천 금지라 별도 유저가 필요 — D-06)
insert into users (device_id, nickname)
select ('00000000-0000-4000-9000-' || lpad(i::text, 12, '0'))::uuid, '추천이' || i
from generate_series(1, 20) i;

-- 글 4종 + 자유 카테고리 글
select create_post('00000000-0000-4000-8000-000000000001','옷','일반질문','질문','본문')      as p_ask   \gset
select create_post('00000000-0000-4000-8000-000000000001','옷','정보공유','정보','본문')      as p_info  \gset
select create_post('00000000-0000-4000-8000-000000000001','옷','선택지투표','투표','본문',
                   array['A안','B안'])                                                        as p_poll  \gset
select create_post('00000000-0000-4000-8000-000000000001','옷','무난함판정','판정','본문')    as p_nan   \gset
select create_post('00000000-0000-4000-8000-000000000001','자유','일반질문','잡담','본문')    as p_free  \gset

-- ---------- F-80 하트 ----------
-- 시작 5 → 질문글 4개(일반질문·선택지투표·무난함판정·자유 일반질문) 차감, 정보공유는 면제
select case when hearts = 1 then 'PASS' else 'FAIL(' || hearts || ')' end
       || ' — F-80 질문글만 하트 차감, 정보 공유는 면제'
from users where device_id = '00000000-0000-4000-8000-000000000001';

select case when count(*) = 4 then 'PASS' else 'FAIL(' || count(*) || ')' end
       || ' — F-80 하트 원장에 질문글 4건만 기록'
from heart_transactions where reason = 'post_spend';

-- ---------- F-24 선택지 규칙 ----------
do $$ begin
  perform create_post('00000000-0000-4000-8000-000000000002','옷','선택지투표','x','y', array['하나']);
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%POLL_OPTIONS_OUT_OF_RANGE%' then raise notice 'PASS — F-24 선택지 1개 차단';
  else raise notice 'FAIL — F-24 선택지 1개: %', sqlerrm; end if;
end $$;

do $$ begin
  perform create_post('00000000-0000-4000-8000-000000000002','옷','무난함판정','x','y', array['가','나']);
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%POLL_OPTIONS_NOT_ALLOWED%' then raise notice 'PASS — F-24 무난함 판정글에 선택지 금지';
  else raise notice 'FAIL — F-24 무난함+선택지: %', sqlerrm; end if;
end $$;

-- ---------- F-33 선택지 투표: 1기기 1표 + 표 이동 ----------
select id as opt_a from poll_options where post_id = :'p_poll' and sort_order = 0 \gset
select id as opt_b from poll_options where post_id = :'p_poll' and sort_order = 1 \gset

select cast_poll_vote(:'p_poll', :'opt_a', '00000000-0000-4000-8000-000000000002');
select cast_poll_vote(:'p_poll', :'opt_b', '00000000-0000-4000-8000-000000000002');  -- 표 이동
select case when count(*) = 1 and max(option_id::text) = :'opt_b'
            then 'PASS' else 'FAIL' end
       || ' — F-33 1기기 1표, 다른 선택지 누르면 표가 이동'
from poll_votes where post_id = :'p_poll';

-- ---------- F-36 무난함 판정: 1기기 1표 + 반대편 이동 ----------
select cast_nanhan_vote(:'p_nan', '무난해요', '00000000-0000-4000-8000-000000000002');
select cast_nanhan_vote(:'p_nan', '애매해요', '00000000-0000-4000-8000-000000000002');
select case when count(*) = 1 and max(choice) = '애매해요' then 'PASS' else 'FAIL' end
       || ' — F-36 판정 1기기 1표, 반대편 누르면 이동'
from nanhan_votes where post_id = :'p_nan';

-- ---------- F-35 무난함 % ----------
insert into nanhan_votes (post_id, device_id, choice)
select :'p_nan', ('00000000-0000-4000-9000-' || lpad(i::text, 12, '0'))::uuid,
       case when i <= 8 then '무난해요' else '애매해요' end
from generate_series(1, 10) i;
-- 무난해요 8 / 애매해요 3(위 1건 포함) = 8/11 = 73%
select case when nanhan_percent = round(8 * 100.0 / 11) then 'PASS'
            else 'FAIL(' || coalesce(nanhan_percent::text,'null') || ')' end
       || ' — F-35 무난함 % = 무난해요 ÷ 전체'
from posts_feed where id = :'p_nan';

select case when nanhan_percent is null then 'PASS' else 'FAIL' end
       || ' — F-35 0표면 % 없음(배지 숨김)'
from posts_feed where id = :'p_ask';

select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || ' — F-16 일반질문·정보공유·선택지투표에는 % 배지 없음'
from posts_feed where post_type <> '무난함판정' and nanhan_percent is not null;

-- ---------- F-14 반응 수가 글 유형별로 다름 ----------
select case when (select reaction_count from posts_feed where id = :'p_poll') = 1
             and (select reaction_count from posts_feed where id = :'p_nan')  = 11
             and (select reaction_count from posts_feed where id = :'p_ask')  = 0
            then 'PASS' else 'FAIL' end
       || ' — F-14 반응 수: 투표글=투표수 / 판정글=판정수 / 일반질문=0';

-- ---------- F-38 정보 공유 글 좋아요 ----------
do $$ begin
  insert into post_likes (post_id, device_id)
  values ((select id from posts where post_type='일반질문' and category='옷'),
          '00000000-0000-4000-8000-000000000002');
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%LIKE_NOT_ALLOWED_FOR_POST_TYPE%' then raise notice 'PASS — F-38 질문글에는 좋아요를 붙일 수 없음';
  else raise notice 'FAIL — F-38 질문글 좋아요: %', sqlerrm; end if;
end $$;

do $$ begin
  insert into post_likes (post_id, device_id)
  values ((select id from posts where post_type='정보공유'),
          '00000000-0000-4000-8000-000000000001');   -- 작성자 본인
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%SELF_LIKE_NOT_ALLOWED%' then raise notice 'PASS — F-38 자기 글 좋아요 차단';
  else raise notice 'FAIL — F-38 자기 글 좋아요: %', sqlerrm; end if;
end $$;

-- ---------- F-42 자기 댓글 추천 차단 ----------
insert into comments (id, post_id, device_id, body)
values ('00000000-0000-4000-a000-000000000001', :'p_ask',
        '00000000-0000-4000-8000-000000000001', '내 댓글');
do $$ begin
  insert into comment_likes (comment_id, device_id)
  values ('00000000-0000-4000-a000-000000000001','00000000-0000-4000-8000-000000000001');
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%SELF_LIKE_NOT_ALLOWED%' then raise notice 'PASS — F-42 자기 댓글 추천 차단';
  else raise notice 'FAIL — F-42 자기 댓글 추천: %', sqlerrm; end if;
end $$;

-- ---------- likes 트리거 ----------
insert into comment_likes (comment_id, device_id)
select '00000000-0000-4000-a000-000000000001',
       ('00000000-0000-4000-9000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 3) i;
select case when likes = 3 then 'PASS' else 'FAIL(' || likes || ')' end
       || ' — 댓글 추천 +1 자동 반영'
from comments where id = '00000000-0000-4000-a000-000000000001';

delete from comment_likes where comment_id = '00000000-0000-4000-a000-000000000001'
  and device_id = '00000000-0000-4000-9000-000000000001';
select case when likes = 2 then 'PASS' else 'FAIL(' || likes || ')' end
       || ' — 댓글 추천 취소 -1 자동 반영'
from comments where id = '00000000-0000-4000-a000-000000000001';

-- ---------- F-06 온도 산출 ----------
-- (1) 댓글만 20개 단 유저 → 36.5 + 20×0.1 = 38.5
insert into comments (post_id, device_id, body)
select :'p_ask', '00000000-0000-4000-8000-000000000002', '댓글 ' || i
from generate_series(1, 20) i;

-- (2) 댓글 1개로 추천 20개 받은 유저 → 36.5 + 0.1 + 20×0.5 = 46.6
insert into comments (id, post_id, device_id, body)
values ('00000000-0000-4000-a000-000000000002', :'p_ask',
        '00000000-0000-4000-8000-000000000003', '추천 많이 받는 댓글');
insert into comment_likes (comment_id, device_id)
select '00000000-0000-4000-a000-000000000002',
       ('00000000-0000-4000-9000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 20) i;

select case when calc_temperature('00000000-0000-4000-8000-000000000002') = 38.5
            then 'PASS' else 'FAIL(' || calc_temperature('00000000-0000-4000-8000-000000000002') || ')' end
       || ' — F-06 댓글 20개 → 38.5';

select case when calc_temperature('00000000-0000-4000-8000-000000000003') = 46.6
            then 'PASS' else 'FAIL(' || calc_temperature('00000000-0000-4000-8000-000000000003') || ')' end
       || ' — F-06 추천 20개 → 46.6';

-- 증가분이 5배로 벌어지는가 (2.0 vs 10.1)
select case when round((calc_temperature('00000000-0000-4000-8000-000000000003') - 36.5)
                     / (calc_temperature('00000000-0000-4000-8000-000000000002') - 36.5), 1) = 5.1
            then 'PASS' else 'FAIL' end
       || ' — F-06 추천이 댓글보다 약 5배 무겁다';

-- (3) 자유 탭 활동은 온도에 반영되지 않는다
insert into comments (post_id, device_id, body)
select :'p_free', '00000000-0000-4000-8000-000000000004', '자유 댓글 ' || i
from generate_series(1, 10) i;
select case when calc_temperature('00000000-0000-4000-8000-000000000004') = 36.5
            then 'PASS' else 'FAIL(' || calc_temperature('00000000-0000-4000-8000-000000000004') || ')' end
       || ' — F-06 자유 카테고리 활동은 온도를 바꾸지 않는다';

-- (4) 정보 공유 글 좋아요가 온도를 올린다
insert into post_likes (post_id, device_id)
select :'p_info', ('00000000-0000-4000-9000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 5) i;
-- 글쓴이: 댓글 1개(0.1) + 그 댓글 추천 2개(1.0) + 정보공유 좋아요 5개(1.0) = 38.6
select case when calc_temperature('00000000-0000-4000-8000-000000000001') = 38.6
            then 'PASS' else 'FAIL(' || calc_temperature('00000000-0000-4000-8000-000000000001') || ')' end
       || ' — F-06 정보 공유 좋아요가 온도에 반영(×0.2)';

-- ---------- 뷰가 계산 온도를 쓰는가 ----------
select case when (select temperature from posts_feed where id = :'p_ask')
                 = calc_temperature('00000000-0000-4000-8000-000000000001')
            then 'PASS' else 'FAIL' end
       || ' — posts_feed 온도가 저장값이 아니라 계산값';

select case when (select temperature from comments_view
                   where id = '00000000-0000-4000-a000-000000000002')
                 = 46.6
            then 'PASS' else 'FAIL' end
       || ' — comments_view가 작성자 온도를 계산해서 붙임';

-- ---------- 두 축 분리 ----------
do $$ begin
  insert into posts (device_id, category, post_type, title, body)
  values ('00000000-0000-4000-8000-000000000001','무난무난','일반질문','x','y');
  raise exception 'SHOULD_HAVE_FAILED';
exception when others then
  if sqlerrm like '%posts_category_check%' then raise notice 'PASS — category에 ''무난무난'' 넣기 차단';
  else raise notice 'FAIL — 두 축 분리: %', sqlerrm; end if;
end $$;
