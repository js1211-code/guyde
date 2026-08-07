-- ============================================================
-- patch_v3.sql 검증 — 제약이 "있는지"가 아니라 "무는지"를 본다.
-- 로컬에서:  psql -d <db> -f db/test_v3.sql
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
  ('11111111-1111-4111-8111-111111111111', '테스트고객'),
  ('22222222-2222-4222-8222-222222222222', '테스트고수');

insert into experts (id, device_id, specialty, intro, price) values
  ('33333333-3333-4333-8333-333333333333',
   '22222222-2222-4222-8222-222222222222', '옷', '테스트 고수', 14900);

insert into bookings (id, device_id, expert_id, purpose, budget_min, budget_max,
                      price, due_at)
values ('44444444-4444-4444-8444-444444444444',
        '11111111-1111-4111-8111-111111111111',
        '33333333-3333-4333-8333-333333333333',
        '소개팅', 150000, 300000, 14900, now() + interval '48 hours');

insert into consulting_answers (id, booking_id, round, diagnosis, avoid)
values ('55555555-5555-4555-8555-555555555555',
        '44444444-4444-4444-8444-444444444444', 1,
        '어깨가 넓어 상체가 부해 보입니다.', array['오버핏 후드','밝은 카고팬츠']);

\set QUIET off
\echo ''
\echo '=== 착장 아이템 ==='

select must_fail($$
  insert into outfit_items (answer_id, slot, url, name, price, reason)
  values ('55555555-5555-4555-8555-555555555555','상의','http://a','셔츠',59000,'짧은이유')
$$, '이유가 20자 미만이면 거부한다');

select must_fail($$
  insert into outfit_items (answer_id, slot, url, name, price, reason)
  values ('55555555-5555-4555-8555-555555555555','모자','http://a','모자',10000,
          '스무 자가 넘는 충분히 긴 설명을 여기에 적는다')
$$, '상의/하의/신발이 아닌 슬롯은 거부한다');

select must_pass($$
  insert into outfit_items (answer_id, slot, url, name, price, reason)
  values ('55555555-5555-4555-8555-555555555555','상의','http://a','셔츠',59000,
          '어깨선이 넓어 세미오버핏이 유리하고 네이비가 무난합니다')
$$, '정상 아이템은 들어간다');

select must_fail($$
  insert into outfit_items (answer_id, slot, url, name, price, reason)
  values ('55555555-5555-4555-8555-555555555555','상의','http://b','셔츠2',49000,
          '같은 슬롯을 두 번 채우려는 시도라서 막혀야 정상이다')
$$, '한 답변에 같은 슬롯이 두 개일 수 없다');

\echo ''
\echo '=== 답변 회차 ==='

select must_fail($$
  insert into consulting_answers (booking_id, round, diagnosis)
  values ('44444444-4444-4444-8444-444444444444', 3, '3회차는 없다')
$$, 'round는 1~2만 허용한다');

select must_fail($$
  insert into consulting_answers (booking_id, round, diagnosis)
  values ('44444444-4444-4444-8444-444444444444', 1, '같은 회차 중복')
$$, '같은 건에 같은 회차 답변이 두 개일 수 없다');

\echo ''
\echo '=== 예약 상태 / 수정 횟수 ==='

select must_fail($$
  update bookings set status = '진행중'
   where id = '44444444-4444-4444-8444-444444444444'
$$, '정의되지 않은 상태는 거부한다');

select must_pass($$
  update bookings set status = '답변 도착'
   where id = '44444444-4444-4444-8444-444444444444'
$$, '신청 접수 → 답변 도착은 된다');

select must_fail($$
  update bookings set revision_count = 2
   where id = '44444444-4444-4444-8444-444444444444'
$$, '수정 요청은 1회를 넘을 수 없다');

select must_fail($$
  insert into bookings (device_id, expert_id, purpose, budget_min, budget_max, price, due_at)
  values ('11111111-1111-4111-8111-111111111111',
          '33333333-3333-4333-8333-333333333333',
          '데이트', 300000, 150000, 14900, now())
$$, '예산 상한이 하한보다 작으면 거부한다');

\echo ''
\echo '=== 피드백 ==='

select must_fail($$
  insert into feedbacks (booking_id, answer_id, kind)
  values ('44444444-4444-4444-8444-444444444444',
          '55555555-5555-4555-8555-555555555555', '수정요청')
$$, '수정 요청인데 사유가 없으면 거부한다');

select must_pass($$
  insert into feedbacks (booking_id, answer_id, kind, reason)
  values ('44444444-4444-4444-8444-444444444444',
          '55555555-5555-4555-8555-555555555555', '수정요청',
          '상의 색이 제 피부톤과 안 맞는 것 같아요')
$$, '사유가 있으면 수정 요청이 된다');

\echo ''
\echo '=== 사진 종류 ==='

select must_fail($$
  insert into booking_images (booking_id, kind, url)
  values ('44444444-4444-4444-8444-444444444444','셀카','http://x')
$$, '전신/착장 외의 사진 종류는 거부한다');

\echo ''
\echo '=== 착장 합계 뷰 ==='

-- 상의 59,000 하나만 넣은 상태. 예산 상한 300,000의 20%.
select case
  when (select total from outfit_totals
         where answer_id = '55555555-5555-4555-8555-555555555555') = 59000
   and (select pct_of_budget from outfit_totals
         where answer_id = '55555555-5555-4555-8555-555555555555') = 20
  then '✅ PASS — outfit_totals가 합계와 예산 비율을 맞게 낸다'
  else '❌ FAIL — outfit_totals 계산이 틀림'
end;

-- 뷰가 RLS를 우회하지 않는지 (v2에서 실제로 뚫렸던 지점)
select case
  when (select reloptions::text from pg_class where relname = 'outfit_totals')
       like '%security_invoker=on%'
  then '✅ PASS — outfit_totals에 security_invoker가 켜져 있다'
  else '❌ FAIL — 뷰가 RLS를 우회한다'
end;

\echo ''
\echo '=== 폐기 확인 ==='

select case
  when not exists (select 1 from information_schema.tables
                    where table_name = 'expert_slots')
  then '✅ PASS — expert_slots가 폐기됐다'
  else '❌ FAIL — expert_slots가 남아 있다'
end;

select case
  when not exists (select 1 from information_schema.columns
                    where table_name = 'experts' and column_name in ('price_chat','price_video'))
  then '✅ PASS — 채팅/화상 2가격이 단일가로 합쳐졌다'
  else '❌ FAIL — 옛 가격 컬럼이 남아 있다'
end;

rollback;
