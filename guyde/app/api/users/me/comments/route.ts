import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";

type Row = {
  id: string;
  body: string;
  likes: number;
  created_at: string;
  posts: { id: string; title: string; category: string; post_type: string } | null;
};

/**
 * F-75 내 댓글 목록 — device_id 기준.
 * 항목을 누르면 원본 글로 이동해야 해서 글 제목까지 같이 조인해 내려준다.
 */
export async function GET(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const db = createAdminClient();
  const { data, error } = await db
    .from("comments")
    .select("id, body, likes, created_at, posts(id, title, category, post_type)")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<Row[]>();

  if (error) return fail("DB_ERROR", 500, error.message);

  return ok({
    items: (data ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      likes: c.likes,
      created_at: c.created_at,
      post: c.posts,
    })),
  });
}
