"""
Supabase 재시드 (운영 도구)

    # 1) 로컬에 기준 DB를 만든다
    createdb guyde_reseed
    for f in schema_v2 patch_v2_1 patch_v2_3 patch_v3 patch_v3_1 patch_v3_2 seed seed_consulting; do
      psql -v ON_ERROR_STOP=1 -d guyde_reseed -f db/$f.sql
    done

    # 2) 배포 DB에 옮긴다
    set -a; . ./.env.local; set +a
    python3 db/tools/reseed.py

⚠️ 시드 유저(00000000-0000-4000-800*)를 지우고 다시 넣는다.
   그들의 글·댓글·투표는 FK로 연쇄 삭제되고, 고수를 지우면
   experts → bookings → answers/feedbacks까지 딸려 나간다.
   실제 방문자 계정과 그 글은 건드리지 않는다.

Supabase 재시드 — seed.sql + seed_consulting.sql 을 PostgREST로 재현한다.

DDL이 아니라 DML만 쓰므로 대시보드 없이 돌릴 수 있다.
SQL 파일에서 값을 파싱하는 게 아니라 로컬 Postgres에서 이미 시드된 결과를
그대로 읽어 옮긴다 — 파서를 따로 만들면 SQL과 어긋날 수 있고,
어긋난 채로 배포 DB에 들어가면 알아채기 어렵다.
"""

import json
import os
import subprocess
import urllib.error
import urllib.request

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
KEY = os.environ["SUPABASE_SECRET_KEY"]
LOCAL_DB = "guyde_reseed"
PSQL = "/Applications/Postgres.app/Contents/Versions/latest/bin/psql"

HEAD = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def rest(method: str, path: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", data=data, headers=HEAD, method=method)
    try:
        return urllib.request.urlopen(req).read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} → {e.code}: {e.read().decode()[:400]}")


def local(sql: str):
    """로컬 시드 DB에서 JSON으로 읽어온다."""
    out = subprocess.run(
        [PSQL, "-qAt", "-d", LOCAL_DB, "-c",
         f"select coalesce(json_agg(t), '[]') from ({sql}) t"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def push(table: str, rows, chunk=200):
    for i in range(0, len(rows), chunk):
        rest("POST", table, rows[i:i + chunk])
    print(f"  {table}: {len(rows)}건")


# ── 1) 기존 시드 제거 ────────────────────────────────────────────
# users를 지우면 글·댓글·투표·좋아요가 FK로 딸려 나간다.
# 고수(8001)를 지우면 experts → bookings → answers/feedbacks까지 연쇄된다.
print("기존 시드 삭제")
seed_users = local("""
  select device_id from users
   where device_id::text like '00000000-0000-4000-800%'
""")
ids = ",".join(u["device_id"] for u in seed_users)
rest("DELETE", f"users?device_id=in.({ids})")
print(f"  시드 유저 {len(seed_users)}명 (연관 데이터 연쇄 삭제)")

# ── 2) 유저 ─────────────────────────────────────────────────────
print("재시드")
push("users", local("select device_id, nickname, hearts from users where device_id::text like '00000000-0000-4000-800%' order by device_id"))

# ── 3) 글 ───────────────────────────────────────────────────────
push("posts", local("""
  select id, device_id, category, post_type, title, body, created_at
    from posts order by created_at
"""))

push("poll_options", local("select id, post_id, text, sort_order from poll_options order by post_id, sort_order"))
push("poll_votes", local("select post_id, option_id, device_id from poll_votes"))
push("nanhan_votes", local("select post_id, device_id, choice from nanhan_votes"))
push("post_likes", local("select post_id, device_id from post_likes"))

# ── 4) 댓글 ─────────────────────────────────────────────────────
# likes 컬럼은 트리거가 세므로 보내지 않는다.
push("comments", local("""
  select id, post_id, device_id, body, parent_id, created_at
    from comments order by created_at
"""))
push("comment_likes", local("select comment_id, device_id from comment_likes"))

# ── 5) 고수 ─────────────────────────────────────────────────────
push("experts", local("select id, device_id, specialty, intro, price from experts order by id"))
push("reviews", local("select expert_id, device_id, rating, body from reviews"))

print("완료")
