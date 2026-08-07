// 글 삭제. 제목으로 찾고, 지우기 전에 무엇이 딸려 나가는지 먼저 찍는다.
//   node .delete-post.mjs "제목 일부"          → 미리보기
//   node .delete-post.mjs "제목 일부" --apply  → 실제 삭제
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("/Users/admin/Documents/GitHub/JJ/guyde/.env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const apply = process.argv.includes("--apply");
const title = process.argv.slice(2).filter((a) => a !== "--apply")[0];
if (!title) throw new Error("제목을 인자로 넘길 것");

const { data: found, error: findErr } = await db
  .from("posts")
  .select("id, title, post_type, category, created_at")
  .ilike("title", `%${title}%`);
if (findErr) throw findErr;

console.log("검색어:", title);
console.log("일치:", found);
if (found.length !== 1) {
  console.log(`\n1건이 아니라 ${found.length}건이라 중단한다.`);
  process.exit(1);
}

const ID = found[0].id;

const [images, comments, likes, options, pollVotes, nanhanVotes, reports] =
  await Promise.all([
    db.from("post_images").select("url").eq("post_id", ID),
    db.from("comments").select("id, body").eq("post_id", ID),
    db.from("post_likes").select("device_id").eq("post_id", ID),
    // 선택지 이름 컬럼은 label 이 아니라 text 다. label 로 고르면 PostgREST가
    // 없는 컬럼이라고 에러를 내서 data 가 null 로 오고, 선택지가 하나도 없는
    // 것처럼 찍힌다 — 지우기 전에 무엇이 딸려 나가는지 보려고 만든 스크립트라
    // 여기가 조용히 비면 목적 자체가 무너진다.
    db.from("poll_options").select("id, text").eq("post_id", ID),
    db.from("poll_votes").select("post_id").eq("post_id", ID),
    db.from("nanhan_votes").select("post_id").eq("post_id", ID),
    // 신고는 post_id 가 아니라 target_type + target_id 로 붙는다(글·댓글을
    // 한 테이블이 받는다). post_id 로 고르면 없는 컬럼이라 조용히 비어 나온다.
    //
    // ⚠️ target_id 에는 FK가 없다. 글을 지워도 신고 행은 **남는다** — 사진·댓글
    //    ·표처럼 딸려 나가지 않으므로, 여기 숫자가 0이 아니면 지운 뒤 고아가
    //    된다는 뜻이다.
    db.from("reports").select("id").eq("target_type", "post").eq("target_id", ID),
  ]);

console.log("images:", images.data);
console.log("comments:", comments.data);
console.log("likes:", likes.data?.length);
console.log("poll_options:", options.data);
console.log("poll_votes:", pollVotes.data?.length);
console.log("nanhan_votes:", nanhanVotes.data?.length);
console.log("reports:", reports.data?.length, "(글을 지워도 남는다)");

// 🚨 조회가 실패하면 supabase-js 는 던지지 않고 data 를 null 로 준다. 그대로
//    두면 "0건"과 구분이 안 돼서, 지우기 전에 확인하려던 게 오히려 안 보인다.
//    실제로 poll_options.label · reports.post_id 둘 다 이렇게 조용히 비어 있었다.
const failed = Object.entries({
  images, comments, likes, options, pollVotes, nanhanVotes, reports,
}).filter(([, r]) => r.error);
if (failed.length > 0) {
  console.error("\n조회 실패 — 무엇이 딸려 나가는지 알 수 없으므로 중단한다:");
  for (const [name, r] of failed) console.error(`  ${name}: ${r.error.message}`);
  process.exit(1);
}

if (!apply) {
  console.log("\n(미리보기 — --apply 로 실제 삭제)");
  process.exit(0);
}

const { error } = await db.from("posts").delete().eq("id", ID);
if (error) throw error;

const { data: after } = await db.from("posts").select("id").eq("id", ID);
console.log("삭제됨. 남은 행:", after);
