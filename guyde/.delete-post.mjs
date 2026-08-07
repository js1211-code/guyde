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
    db.from("poll_options").select("id, label").eq("post_id", ID),
    db.from("poll_votes").select("post_id").eq("post_id", ID),
    db.from("nanhan_votes").select("post_id").eq("post_id", ID),
    db.from("reports").select("id").eq("post_id", ID),
  ]);

console.log("images:", images.data);
console.log("comments:", comments.data);
console.log("likes:", likes.data?.length);
console.log("poll_options:", options.data);
console.log("poll_votes:", pollVotes.data?.length);
console.log("nanhan_votes:", nanhanVotes.data?.length);
console.log("reports:", reports.data?.length);

if (!apply) {
  console.log("\n(미리보기 — --apply 로 실제 삭제)");
  process.exit(0);
}

const { error } = await db.from("posts").delete().eq("id", ID);
if (error) throw error;

const { data: after } = await db.from("posts").select("id").eq("id", ID);
console.log("삭제됨. 남은 행:", after);
