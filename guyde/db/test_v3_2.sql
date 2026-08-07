-- ============================================================
-- patch_v3_2.sql 검증 — 답글 깊이와 고수 판별.
-- 로컬에서:  psql -d <db> -f db/test_v3_2.sql
-- 전부 PASS 여야 한다. 롤백하므로 데이터는 남지 않는다.
-- ============================================================

begin;

\set QUIET on
\set ON_ERROR_STOP off

create or replace function must_fail(sql text, label text) returns text as $$
begin
  execute sql;
  return '❌ FAIL — ' || label || ' (거부됐어야 하는데 통과함)';
exception when others then
  return '✅ PASS — ' || label;
end $$ language plpgsql;

create or replace function must_pass(sql text, label text) returns text as $$
begin
  execute sql;
  return '✅ PASS — ' || label;
exception when others then
  return '❌ FAIL — ' || label || ' :: ' || sqlerrm;
end $$ language plpgsql;

-- 픽스처 ------------------------------------------------------
insert into users (device_id, nickname) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '검증 글쓴이'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '검증 댓글러'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '검증 고수'),
  ('aaaaaaaa-0000-4000-8000-000000000004', '검증 뜨거운 일반인');

-- 추천을 눌러줄 사람들. 온도 42를 넘기려면 추천 12개가 필요한데
-- 픽스처 유저만으로는 모자라서 여기서 따로 만든다.
insert into users (device_id, nickname)
select ('eeeeeeee-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
       '검증 추천인 ' || i
  from generate_series(1, 15) i;

insert into posts (id, device_id, category, post_type, title, body) values
  ('bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001',
   '옷','일반질문','검증용 글','본문'),
  ('bbbbbbbb-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000001',
   '옷','일반질문','검증용 다른 글','본문');

insert into experts (id, device_id, specialty, intro, price) values
  ('cccccccc-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000003',
   '옷','검증용 고수', 14900);

insert into comments (id, post_id, device_id, body) values
  ('dddddddd-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000002','원댓글');

\set QUIET off
\echo ''
\echo '=== 답글 깊이 ==='

select must_pass($$
  insert into comments (id, post_id, device_id, body, parent_id)
  values ('dddddddd-0000-4000-8000-000000000002','bbbbbbbb-0000-4000-8000-000000000001',
          'aaaaaaaa-0000-4000-8000-000000000003','1단계 답글',
          'dddddddd-0000-4000-8000-000000000001')
$$, '원댓글에 답글을 달 수 있다');

select must_fail($$
  insert into comments (post_id, device_id, body, parent_id)
  values ('bbbbbbbb-0000-4000-8000-000000000001',
          'aaaaaaaa-0000-4000-8000-000000000002','답글의 답글',
          'dddddddd-0000-4000-8000-000000000002')
$$, '답글에는 답글을 못 단다 (모바일 폭에서 무한히 밀린다)');

select must_fail($$
  insert into comments (post_id, device_id, body, parent_id)
  values ('bbbbbbbb-0000-4000-8000-000000000002',
          'aaaaaaaa-0000-4000-8000-000000000002','다른 글에 답글',
          'dddddddd-0000-4000-8000-000000000001')
$$, '다른 글의 댓글에는 답글을 못 단다');

select must_fail($$
  insert into comments (post_id, device_id, body, parent_id)
  values ('bbbbbbbb-0000-4000-8000-000000000001',
          'aaaaaaaa-0000-4000-8000-000000000002','없는 부모',
          '00000000-0000-4000-8000-999999999999')
$$, '없는 댓글에는 답글을 못 단다');

select must_pass($$
  update comments set body = '수정된 원댓글'
   where id = 'dddddddd-0000-4000-8000-000000000001'
$$, '트리거가 일반 수정을 막지 않는다');

\echo ''
\echo '=== 고수 판별 — 온도가 아니라 experts 소속 ==='

-- 검증 뜨거운 일반인의 온도를 42도 위로 올린다.
insert into comments (id, post_id, device_id, body)
values ('dddddddd-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000001',
        'aaaaaaaa-0000-4000-8000-000000000004','온도만 높은 댓글');
insert into comment_likes (comment_id, device_id)
select 'dddddddd-0000-4000-8000-000000000003', device_id
  from users where device_id::text like 'eeeeeeee-%' limit 12;

-- 이 검증의 핵심. 전제(42도 초과)가 안 잡히면 판별이 맞는지 알 수 없으므로
-- 전제 미달과 오판별을 구분해서 말한다.
select case
  when temperature < 42.0
  then '⚠️ 검증 불가 — 전제인 42도를 못 넘겼다 (' || temperature || '도). 추천 수를 늘려라'
  when not is_expert
  then '✅ PASS — ' || temperature || '도를 넘겨도 experts에 없으면 고수가 아니다'
  else '❌ FAIL — 온도로 고수를 판별하고 있다'
end
from comments_view where device_id = 'aaaaaaaa-0000-4000-8000-000000000004' limit 1;

select case
  when is_expert then '✅ PASS — experts에 있으면 고수다'
  else '❌ FAIL — 고수인데 is_expert가 false'
end
from comments_view where device_id = 'aaaaaaaa-0000-4000-8000-000000000003' limit 1;

select case
  when not is_expert then '✅ PASS — 평범한 사람은 고수가 아니다'
  else '❌ FAIL'
end
from comments_view where device_id = 'aaaaaaaa-0000-4000-8000-000000000002' limit 1;

\echo ''
\echo '=== 글쓴이 고수 표시 (posts_feed) ==='

select case
  when (select bool_or(is_expert) from posts_feed
         where device_id = 'aaaaaaaa-0000-4000-8000-000000000001') = false
  then '✅ PASS — posts_feed도 experts 소속으로 판별한다'
  else '❌ FAIL'
end;

\echo ''
\echo '=== 뷰가 RLS를 우회하지 않는지 ==='

select case
  when (select reloptions::text from pg_class where relname = 'comments_view')
       like '%security_invoker=on%'
   and (select reloptions::text from pg_class where relname = 'posts_feed')
       like '%security_invoker=on%'
  then '✅ PASS — 두 뷰 모두 security_invoker가 켜져 있다'
  else '❌ FAIL — 뷰가 RLS를 우회한다'
end;

\echo ''
\echo '=== 부모 삭제 시 답글도 사라지는지 ==='

delete from comments where id = 'dddddddd-0000-4000-8000-000000000001';
select case
  when not exists (select 1 from comments
                    where id = 'dddddddd-0000-4000-8000-000000000002')
  then '✅ PASS — 원댓글을 지우면 답글도 같이 사라진다'
  else '❌ FAIL — 부모 없는 답글이 남았다'
end;

rollback;
