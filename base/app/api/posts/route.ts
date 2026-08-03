import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
  stripDevice,
} from "@/lib/api/http";

// 목록을 여기서 또 정의하면 카테고리를 추가할 때 한쪽만 고쳐서
// "탭은 생겼는데 저장은 거부"가 된다. 항상 lib/constants.ts 한 곳에서 가져온다.
import { CATEGORIES, POST_TYPES, type Category, type PostType } from "@/lib/constants";

/**
 * F-11·12·13 피드 조회
 * - ?category=옷        → 카테고리 탭
 * - ?post_type=무난함판정 → 무난무난 탭 (카테고리를 가로지른다)
 * 정렬은 최신순 고정(F-13). 집계는 posts_feed 뷰가 한 번에 준다(N+1 방지).
 */
export async function GET(req: Request) {
  const viewer = getDeviceId(req); // 없어도 된다 — 읽기는 열려 있다
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const postType = url.searchParams.get("post_type");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  if (category && !CATEGORIES.includes(category as Category)) {
    return fail("INVALID_CATEGORY", 400);
  }
  if (postType && !POST_TYPES.includes(postType as PostType)) {
    return fail("INVALID_POST_TYPE", 400);
  }

  const db = createAdminClient();
  let query = db
    .from("posts_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (postType) query = query.eq("post_type", postType);

  const { data, error } = await query;
  if (error) return fail("DB_ERROR", 500, error.message);

  return ok({ items: (data ?? []).map((row) => stripDevice(row, viewer)) });
}

/**
 * F-20~24 글 작성
 * 하트 차감 + 글 insert + 선택지 insert가 create_post 안에서 한 트랜잭션이다.
 * 정보 공유 글은 하트를 쓰지 않는다(F-80).
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let body: {
    category?: string;
    post_type?: string;
    title?: string;
    body?: string;
    options?: string[];
    image_urls?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (!CATEGORIES.includes(body.category as Category)) {
    return fail("INVALID_CATEGORY", 400, "카테고리를 선택해주세요");
  }
  if (!POST_TYPES.includes(body.post_type as PostType)) {
    return fail("INVALID_POST_TYPE", 400, "글 유형을 선택해주세요");
  }
  if (!body.title?.trim()) return fail("TITLE_REQUIRED", 400);
  if (!body.body?.trim()) return fail("BODY_REQUIRED", 400);

  const options = body.options?.map((o) => o.trim()).filter(Boolean) ?? null;

  const db = createAdminClient();
  const { data: postId, error } = await db.rpc("create_post", {
    p_device: deviceId,
    p_category: body.category,
    p_type: body.post_type,
    p_title: body.title.trim(),
    p_body: body.body.trim(),
    p_options: options?.length ? options : null,
  });

  if (error) return fromDbError(error.message);

  // 사진은 선택 항목이라 글이 만들어진 뒤에 붙인다(F-22).
  const urls = body.image_urls ?? [];
  if (urls.length > 0) {
    const { error: imgError } = await db.from("post_images").insert(
      urls.map((url, i) => ({ post_id: postId, url, sort_order: i })),
    );
    if (imgError) return fail("IMAGE_INSERT_FAILED", 500, imgError.message);
  }

  return ok({ id: postId }, 201);
}
