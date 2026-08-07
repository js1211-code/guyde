import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
} from "@/lib/api/http";

/**
 * F-40 댓글 작성. parent_id를 주면 답글이 된다.
 *
 * 깊이는 1단계까지다 — 답글에 답글을 달면 모바일 폭에서 계속 안으로 밀려
 * 읽을 수 없게 된다. 제한은 DB 트리거(block_nested_reply)가 강제하므로
 * 여기서는 그 예외를 사람이 읽을 수 있는 메시지로 옮기기만 한다.
 *
 * 댓글 목록은 글 상세(GET /api/posts/[id])가 정렬까지 해서 함께 내려준다.
 *
 * 사진은 한 장까지(image_url). 댓글은 글이 아니라 대답이라 여러 장이 필요한
 * 경우가 드물어서 컬럼 하나로 뒀다.
 * 사진만 남겨도 된다 — 둘 다 없을 때만 막는다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  let body: string | undefined;
  let parentId: string | undefined;
  let imageUrl: string | undefined;
  try {
    ({ body, parent_id: parentId, image_url: imageUrl } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }
  // 사진 한 장이 곧 대답인 경우가 많다 — "이런 느낌이요?" 하고 사진만 올리는
  // 게 자연스럽다. 대신 **둘 다 없는** 댓글은 막는다. 아무것도 없는 줄이
  // 목록에 쌓이면 읽는 쪽에서는 고장으로 보인다(DB CHECK도 같이 막는다).
  const text = body?.trim() ?? "";
  if (!text && !imageUrl) return fail("BODY_OR_IMAGE_REQUIRED", 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from("comments")
    .insert({
      post_id: id,
      device_id: deviceId,
      // body는 not null이라 빈 문자열로 넣는다. null을 허용하면 화면·API
      // 곳곳에서 "본문이 없을 수 있는 경우"를 새로 다뤄야 한다.
      body: text,
      parent_id: parentId ?? null,
      image_url: imageUrl ?? null,
    })
    .select("id, body, likes, created_at, parent_id, image_url")
    .single();

  if (error) return fromDbError(error.message);
  return ok(data, 201);
}
