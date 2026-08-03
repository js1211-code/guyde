import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { grantHearts } from "@/lib/api/grant-hearts";
import { getPack, packTotal } from "@/lib/hearts";

/**
 * 하트 충전.
 *
 * ⚠️ 결제 PG를 붙이지 않았다(스코프 밖). 지금은 구매를 누르면 바로 지급된다.
 * 실제 결제를 붙일 때는 이 핸들러 앞에 결제 승인 확인이 들어가야 한다.
 *
 * 지급량은 클라이언트가 보내는 숫자를 믿지 않고 서버의 팩 정의에서 가져온다.
 * 안 그러면 요청 하나 조작해서 원하는 만큼 받아갈 수 있다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let packId: string | undefined;
  try {
    ({ pack_id: packId } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const pack = packId ? getPack(packId) : null;
  if (!pack) return fail("UNKNOWN_PACK", 400);

  const amount = packTotal(pack);
  const db = createAdminClient();
  const result = await grantHearts(db, deviceId, amount, `purchase:${pack.id}`);

  if (!result.ok) {
    return fail(result.code, result.code === "USER_NOT_FOUND" ? 404 : 500, result.detail);
  }

  return ok({ hearts: result.hearts, granted: amount, pack_id: pack.id });
}
