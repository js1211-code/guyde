-- ============================================================
-- GUYDE 스키마 패치 v3.4 (2026-08-05) — 글 수정 · 투표 선택지 사진
--
-- 전제: patch_v3_3.sql 까지 적용된 DB.
--
-- 왜 수정 표시가 필요한가
--   이 앱은 남이 올린 글을 보고 무난한지 투표하는 곳이다. 투표가 쌓인 뒤에
--   글쓴이가 내용을 바꿔버리면, 화면에 보이는 글과 사람들이 실제로 판단한
--   글이 달라진다. "82% 무난"이 지금 글에 대한 숫자가 아니게 된다.
--   그래서 수정 자체는 막지 않되 **수정됐다는 사실은 남긴다.**
--
--   컬럼을 안 두고 updated_at 하나로 때울 수도 있지만, 그러면 "한 번도 안 고친
--   글"과 "고친 글"을 구분할 수 없다(생성 시각으로 채워지므로). null이
--   기본값이어야 화면에서 그냥 있고 없음으로 판별된다.
--
-- 왜 선택지에 사진이 필요한가
--   "A안 B안 중에 뭐가 나아요?"는 이 앱에서 제일 많이 올라오는 질문인데,
--   글자로 "검정 후드"와 "네이비 후드"를 적어놓으면 고르는 쪽이 실물을
--   본 적이 없다. 사진을 본문에 몰아 올리면 몇 번째 사진이 어느 선택지인지
--   본문에 따로 적어야 한다 — 선택지에 직접 붙어야 짝이 맞는다.
--
--   사진은 선택이다. 필수로 하면 "월세 vs 전세" 같은 사진 없는 투표를
--   아예 못 올린다.
--
-- 무엇을 바꾸나
--   1) posts.edited_at 추가 (null = 한 번도 안 고침)
--   2) posts_feed 뷰에 edited_at 노출 — 상세도 피드도 이 뷰를 읽는다
--   3) poll_options.image_url 추가
--   4) create_post()가 선택지 사진을 같이 받는다
--
-- 재실행해도 안전하다.
-- ============================================================

begin;

alter table posts        add column if not exists edited_at timestamptz;
alter table poll_options add column if not exists image_url text;

-- ------------------------------------------------------------
-- posts_feed 재정의 (patch_v3_2의 정의 + edited_at)
-- ⚠️ security_invoker = on 을 빠뜨리면 뷰가 정의자 권한으로 돌아
--    밑에 깔린 테이블의 RLS를 통째로 우회한다.
-- ------------------------------------------------------------
drop view if exists posts_feed cascade;
create view posts_feed with (security_invoker = on) as
select
  p.id, p.category, p.post_type, p.title, p.body, p.created_at, p.device_id,
  p.edited_at,
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
-- create_post — 선택지 사진을 같이 받는다.
--
-- 사진 배열은 선택지 배열과 **같은 길이의 나란한 배열**이다. 사진이 없는
-- 선택지 자리에는 null이 들어간다. 배열 두 개 대신 jsonb 하나로 받을 수도
-- 있지만, 그러면 선택지 개수 검사(2~5개)를 배열 길이로 못 하게 된다.
--
-- 인자를 추가했으므로 새 시그니처다. 옛 시그니처를 남겨두면 PostgREST가
-- 어느 쪽을 부를지 모호해져 "Could not choose the best candidate function"으로
-- 죽는다 — 반드시 drop 하고 새로 만든다.
-- ------------------------------------------------------------
drop function if exists create_post(uuid, text, text, text, text, text[]) cascade;
drop function if exists create_post(uuid, text, text, text, text, text[], text[]) cascade;

create function create_post(
  p_device        uuid,
  p_category      text,
  p_type          text,
  p_title         text,
  p_body          text,
  p_options       text[] default null,
  p_option_images text[] default null
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
    -- 길이가 어긋나면 사진이 엉뚱한 선택지에 붙는다. 조용히 맞추지 않고 막는다.
    if p_option_images is not null
       and array_length(p_option_images, 1) is distinct from array_length(p_options, 1) then
      raise exception 'POLL_IMAGES_LENGTH_MISMATCH';
    end if;
  elsif p_options is not null then
    -- 투표글이 아닌데 선택지가 오면 화면과 DB가 어긋난 것이다.
    raise exception 'POLL_OPTIONS_NOT_ALLOWED';
  elsif p_option_images is not null then
    raise exception 'POLL_OPTIONS_NOT_ALLOWED';
  end if;

  insert into posts (device_id, category, post_type, title, body)
  values (p_device, p_category, p_type, p_title, p_body)
  returning id into v_post;

  if p_type = '선택지투표' then
    for v_i in 1 .. array_length(p_options, 1) loop
      insert into poll_options (post_id, text, sort_order, image_url)
      values (
        v_post,
        p_options[v_i],
        v_i - 1,
        case when p_option_images is null then null else p_option_images[v_i] end
      );
    end loop;
  end if;

  return v_post;
end $$;

commit;
