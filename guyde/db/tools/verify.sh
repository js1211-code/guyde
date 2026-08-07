#!/usr/bin/env bash
#
# 시드 검증 — 배포 DB를 건드리지 않고 로컬에서 전 체인을 실제로 돌린다.
#
#   bash db/tools/verify.sh
#
# 왜 필요한가 ─────────────────────────────────────────────────
# 시드 파일에서 글 하나를 지우면 그 글의 사진·표·선택지·댓글·댓글추천이
# 여러 절에 흩어져 있어서 한 군데만 빠뜨려도 FK 제약에 걸린다. 그런데 그건
# **파일을 실제로 돌려보기 전까지 안 보인다** — 눈으로 훑어서는 안 걸린다.
# 실제로 그렇게 깨진 채로 커밋될 뻔했고, 이 스크립트가 잡아냈다.
#
# 🚨 배포 DB(Supabase)에는 절대 돌리지 않는다. 여기서 만드는 guyde_verify 는
#    매번 drop 하고 새로 만드는 일회용이다.
#
# 로컬 Postgres.app 이 없으면 그냥 건너뛴다 — 검증을 못 하는 것과
# 검증이 실패한 것은 다르므로 종료 코드로 구분한다(0 = 건너뜀).
set -uo pipefail

cd "$(dirname "$0")/../.."          # guyde/
BIN=/Applications/Postgres.app/Contents/Versions/latest/bin
DB=guyde_verify

if [ ! -x "$BIN/psql" ]; then
  echo "⏭  Postgres.app 이 없어 검증을 건너뜁니다 ($BIN/psql)"
  exit 0
fi

# 🚨 순서가 곧 정답이다. seed_consulting 이 seed 보다 먼저 오면 고수 온도가
#    36.5로 떨어져 고수 목록이 통째로 빈다(42.0 미만은 걸러진다).
FILES=(schema_v2 patch_v2_1 patch_v2_3 patch_v3 patch_v3_1 patch_v3_2
       patch_v3_3 patch_v3_4 patch_v3_5 patch_v3_6 patch_v3_7
       seed seed_consulting seed_picks)

"$BIN/dropdb" --if-exists "$DB" >/dev/null 2>&1
"$BIN/createdb" "$DB" || { echo "❌ createdb 실패"; exit 1; }

for f in "${FILES[@]}"; do
  if ! OUT=$("$BIN/psql" -v ON_ERROR_STOP=1 -q -d "$DB" -f "db/$f.sql" 2>&1); then
    echo "❌ db/$f.sql"
    echo "$OUT" | head -6
    exit 1
  fi
done
echo "✅ SQL ${#FILES[@]}개 파일 전부 실행됨"

# 실행이 됐다고 데이터가 맞는 건 아니다. 화면에서 티가 나는 것들을 센다.
"$BIN/psql" -v ON_ERROR_STOP=1 -qAt -d "$DB" <<'SQL'
\set ON_ERROR_STOP on
select case when count(*) = 0 then '✅ 고아 사진 0'
            else '❌ 고아 사진 ' || count(*) end
  from post_images i left join posts p on p.id = i.post_id where p.id is null;

-- 댓글이 글보다 먼저 달린 상태. 상세를 열면 시간이 거꾸로 보인다.
-- 댓글 시각은 글과 따로 박히므로 글만 위로 옮기면 조용히 이렇게 된다.
select case when count(*) = 0 then '✅ 댓글이 글보다 먼저인 경우 0'
            else '❌ 댓글이 글보다 먼저 ' || count(*) end
  from comments c join posts p on p.id = c.post_id
 where c.created_at < p.created_at;

-- 🚨 42.0 미만이면 experts 행이 있어도 고수 목록에서 통째로 빠진다.
--    고수 댓글이 달린 글을 지우면 그 댓글의 추천(×0.5)이 같이 날아가서
--    한 글에 1.1도씩 떨어진다 — 여유가 1도 밑이면 다음 삭제가 위험하다.
select case when min(t) >= 42.0 then '✅ 고수 최저 온도 ' || min(t) || ' (게이트 42.0)'
            else '❌ 42.0 미만인 고수 있음: ' || min(t) end
  from (select calc_temperature(device_id) as t from experts) x;

select '   글 ' || (select count(*) from posts)
    || ' · 댓글 ' || (select count(*) from comments)
    || ' · 서가에 오르는 판정글 ' || (
         select count(*) from posts_feed
          where post_type = '무난함판정' and is_closed
            and reaction_count >= 10 and nanhan_percent >= 60);
SQL
