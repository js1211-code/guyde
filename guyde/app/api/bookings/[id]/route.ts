import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { loadBooking } from "@/lib/api/consulting";

/**
 * 컨설팅 상세.
 *
 * 신청자와 담당 고수만 볼 수 있다. 설문에는 전신 사진과 체형 서술이 들어 있어서
 * 링크를 아는 사람이 다 볼 수 있으면 안 된다 — 이 앱에서 가장 민감한 데이터다.
 *
 * 응답에 device_id는 담지 않는다. 대신 내가 이 건에서 어느 쪽인지만 알려준다.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;
  const db = createAdminClient();

  let loaded;
  try {
    loaded = await loadBooking(db, id);
  } catch (e) {
    return fail("DB_ERROR", 500, e instanceof Error ? e.message : undefined);
  }
  if (!loaded) return fail("BOOKING_NOT_FOUND", 404);

  const isOwner = loaded.booking.device_id === deviceId;
  const isExpert = loaded.expertDevice === deviceId;
  // 없는 것과 못 보는 것을 구분해 주면 남의 건이 존재한다는 사실이 새어 나간다.
  if (!isOwner && !isExpert) return fail("BOOKING_NOT_FOUND", 404);

  return ok({ ...loaded.view, is_owner: isOwner, is_expert: isExpert });
}
