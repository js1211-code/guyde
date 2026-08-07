-- ============================================================
-- GUYDE 스키마 패치 v3.3 (2026-08-05) — 하트 폐기
--
-- 전제: patch_v3_2.sql 까지 적용된 DB.
--
-- 왜 없애나
--   하트는 "글 하나에 하트 하나"로 남발을 막는 장치였다. 그런데 실제로는
--   쓰려는 사람 앞에 관문만 하나 더 놓는 꼴이라, 답을 받으려고 온 사람이
--   글을 못 쓰는 상황이 생겼다. 스팸 방지보다 첫 글을 쓰게 하는 게 먼저다.
--
-- 무엇을 남기나
--   users.hearts 컬럼과 heart_transactions 테이블은 **지우지 않는다.**
--   컬럼을 떨어뜨리면 되돌릴 때 데이터가 없고, 지금 화면에서 안 보이는 것만으로
--   목적은 달성된다. 나중에 되살릴 수도 있다.
--
-- 무엇을 바꾸나
--   create_post()에서 차감과 INSUFFICIENT_HEARTS 예외만 걷어낸다.
--   이걸 안 하면 화면에서 하트를 지워도 DB가 계속 막아서,
--   "하트를 없앴는데 글이 안 올라간다"가 된다.
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

drop function if exists create_post(uuid, text, text, text, text, text[]) cascade;

create function create_post(
  p_device   uuid,
  p_category text,
  p_type     text,
  p_title    text,
  p_body     text,
  p_options  text[] default null
) returns uuid
language plpgsql security definer as $$
declare
  v_post uuid;
  v_i    int;
begin
  -- 하트 차감은 없앴다(patch_v3_3). 유형과 상관없이 그냥 쓸 수 있다.

  if p_type = '선택지투표' then
    if p_options is null or array_length(p_options, 1) not between 2 and 5 then
      raise exception 'POLL_OPTIONS_OUT_OF_RANGE';
    end if;
  elsif p_options is not null then
    -- 투표글이 아닌데 선택지가 오면 화면과 DB가 어긋난 것이다.
    raise exception 'POLL_OPTIONS_NOT_ALLOWED';
  end if;

  insert into posts (device_id, category, post_type, title, body)
  values (p_device, p_category, p_type, p_title, p_body)
  returning id into v_post;

  if p_type = '선택지투표' then
    for v_i in 1 .. array_length(p_options, 1) loop
      insert into poll_options (post_id, text, sort_order)
      values (v_post, p_options[v_i], v_i - 1);
    end loop;
  end if;

  return v_post;
end $$;

commit;
