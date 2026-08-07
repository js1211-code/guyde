-- ============================================================
-- GUYDE 스키마 패치 v3.1 (2026-08-04) — 예산을 구간에서 단일값으로
--
-- 전제: patch_v3.sql 까지 적용된 DB.
--
-- 왜 바꾸나
--   설문에서 예산을 15 / 20 / 25 / 30만원 중 하나로 고르게 바뀌었다.
--   구간(budget_min~budget_max)은 "15~30만원" 같은 범위를 받던 시절의 모델이라,
--   단일 선택이 되면 min과 max가 항상 같아져서 두 컬럼을 들고 있을 이유가 없다.
--   착장 합계 대비 % 계산도 어느 쪽을 기준으로 삼을지 매번 헷갈린다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. budget 단일 컬럼
-- ------------------------------------------------------------
alter table bookings add column if not exists budget integer;

-- 구간이 남아 있으면 상한을 승계한다(예산 대비 %의 기준이 상한이었다).
-- 재실행 때는 컬럼이 이미 없으므로 동적 SQL로 감싼다 —
-- 직접 참조하면 두 번째 실행에서 파싱 단계에서 터진다.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'bookings' and column_name = 'budget_max'
  ) then
    execute 'update bookings set budget = coalesce(budget, budget_max) where budget is null';
  end if;
end $$;

update bookings set budget = 200000 where budget is null;

alter table bookings alter column budget set not null;
alter table bookings drop constraint if exists bookings_budget_positive;
alter table bookings add constraint bookings_budget_positive check (budget > 0);

-- outfit_totals가 budget_max를 참조하므로 컬럼을 떼기 전에 뷰를 내린다.
drop view if exists outfit_totals cascade;

alter table bookings drop constraint if exists bookings_budget_check;
alter table bookings drop column if exists budget_min;
alter table bookings drop column if exists budget_max;

-- ------------------------------------------------------------
-- 2. outfit_totals 재정의
--    security_invoker = on 이 없으면 뷰가 RLS를 우회한다.
-- ------------------------------------------------------------
create view outfit_totals with (security_invoker = on) as
select a.id                              as answer_id,
       a.booking_id,
       coalesce(sum(i.price), 0)::int    as total,
       count(i.id)::int                  as item_count,
       b.budget,
       case when b.budget > 0
            then round(coalesce(sum(i.price), 0) * 100.0 / b.budget)::int
       end                               as pct_of_budget
  from consulting_answers a
  join bookings b on b.id = a.booking_id
  left join outfit_items i on i.answer_id = a.id
 group by a.id, a.booking_id, b.budget;

commit;
