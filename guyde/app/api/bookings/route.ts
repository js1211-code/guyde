import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, fromDbError, getDeviceId, ok } from "@/lib/api/http";
import { dayLabel, dueLabel, temperaturesOf } from "@/lib/api/consulting";
import {
  BODY_PHOTO_MIN,
  OUTFIT_PHOTO_MIN,
  BOOKING_PHOTO_MAX,
  CONSULT_BUDGETS,
  CONSULT_CONCERNS,
  CONSULT_PURPOSE_MAX,
  CONSULT_PURPOSES,
  CONSULTING_SLA_HOURS,
  type ConsultBudget,
  type ConsultPurpose,
} from "@/lib/constants";

/** F-76 내 컨설팅 목록. device_id 전용 조회 — 전체를 받아 거르지 않는다. */
export async function GET(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("id, expert_id, status, purpose, budget, created_at, due_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) return fail("DB_ERROR", 500, error.message);
  if (!data?.length) return ok({ items: [] });

  const { data: experts } = await db
    .from("experts")
    .select("id, device_id")
    .in("id", [...new Set(data.map((b) => b.expert_id))]);

  const expertDevices = (experts ?? []).map((e) => e.device_id);
  const [{ data: users }, temps] = await Promise.all([
    expertDevices.length
      ? db.from("users").select("device_id, nickname").in("device_id", expertDevices)
      : Promise.resolve({ data: [] }),
    temperaturesOf(db, expertDevices),
  ]);

  const deviceOf = new Map((experts ?? []).map((e) => [e.id, e.device_id]));
  const nickname = new Map((users ?? []).map((u) => [u.device_id, u.nickname]));

  return ok({
    items: data.map((b) => {
      const ed = deviceOf.get(b.expert_id);
      return {
        id: b.id,
        status: b.status,
        purpose: b.purpose,
        budget: b.budget,
        created_label: dayLabel(b.created_at),
        due_label: dueLabel(b.due_at, b.status),
        expert: {
          id: b.expert_id,
          nickname: ed ? (nickname.get(ed) ?? "알 수 없음") : "알 수 없음",
          temperature: ed ? (temps.get(ed) ?? 36.5) : 36.5,
        },
      };
    }),
  });
}

/**
 * F-57 사전 설문 제출 + 결제.
 *
 * 금액은 요청 본문에서 받지 않고 experts.price를 읽어서 쓴다.
 * 클라이언트가 보낸 숫자를 그대로 저장하면 1원짜리 컨설팅을 만들 수 있다.
 *
 * 사진 두 종류가 다 필수다(F-57) — 전신이 없으면 체형을 못 보고,
 * 자주 입는 옷이 없으면 이미 옷장에 있는 걸 다시 사라고 할 수 있다.
 * DB CHECK로 걸지 않은 이유: 사진 insert가 bookings insert 뒤에 오므로
 * 제약으로 막으면 순서에 묶여서 오히려 다루기 나빠진다. 대신 여기서 막는다.
 * 화면에서도 같은 조건으로 버튼을 잠근다 — 한쪽만 막으면 우회된다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let body: {
    expert_id?: string;
    purpose?: string;
    budget?: number;
    concerns?: string[];
    body_note?: string;
    style_note?: string;
    body_images?: string[];
    outfit_images?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (!body.expert_id) return fail("EXPERT_REQUIRED", 400, "고수를 선택해주세요");

  // 목록에 있는 값이거나, '기타'로 직접 쓴 문장이거나 둘 중 하나다.
  // 자유 입력을 받는 이상 화이트리스트로는 막을 수 없으니 길이로 막는다 —
  // purpose는 고수 화면에 그대로 나오는 값이라 길면 레이아웃이 무너진다.
  const purpose = (body.purpose ?? "").trim();
  if (!purpose) {
    return fail("INVALID_PURPOSE", 400, "어떤 자리인지 골라주세요");
  }
  if (
    !CONSULT_PURPOSES.includes(purpose as ConsultPurpose) &&
    purpose.length > CONSULT_PURPOSE_MAX
  ) {
    return fail(
      "PURPOSE_TOO_LONG",
      400,
      `어떤 자리인지 ${CONSULT_PURPOSE_MAX}자 이내로 적어주세요`,
    );
  }
  if (!CONSULT_BUDGETS.includes(body.budget as ConsultBudget)) {
    return fail("INVALID_BUDGET", 400, "지원하는 예산 범위를 골라주세요");
  }

  const bodyImages = (body.body_images ?? []).slice(0, BOOKING_PHOTO_MAX);
  if (bodyImages.length < BODY_PHOTO_MIN) {
    return fail("BODY_PHOTO_REQUIRED", 400, "전신 사진을 최소 1장 올려주세요");
  }

  const outfitImages = (body.outfit_images ?? []).slice(0, BOOKING_PHOTO_MAX);
  if (outfitImages.length < OUTFIT_PHOTO_MIN) {
    return fail(
      "OUTFIT_PHOTO_REQUIRED",
      400,
      "자주 입는 옷 사진을 최소 1장 올려주세요",
    );
  }

  // 목록에 없는 고민 항목은 버린다. 자유 서술은 body_note가 받는다.
  const concerns = (body.concerns ?? []).filter((c) =>
    (CONSULT_CONCERNS as readonly string[]).includes(c),
  );

  const db = createAdminClient();

  const { data: expert, error: expertError } = await db
    .from("experts")
    .select("id, price")
    .eq("id", body.expert_id)
    .maybeSingle();
  if (expertError) return fail("DB_ERROR", 500, expertError.message);
  if (!expert) return fail("EXPERT_NOT_FOUND", 404);

  const dueAt = new Date(Date.now() + CONSULTING_SLA_HOURS * 3_600_000);

  const { data: booking, error } = await db
    .from("bookings")
    .insert({
      device_id: deviceId,
      expert_id: expert.id,
      purpose,
      budget: body.budget,
      concerns,
      body_note: body.body_note?.trim() || null,
      style_note: body.style_note?.trim() || null,
      price: expert.price, // ← 서버가 정한 값. 클라이언트 숫자를 믿지 않는다.
      due_at: dueAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) return fromDbError(error.message);

  const images = [
    ...bodyImages.map((url, i) => ({ kind: "전신", url, sort_order: i })),
    ...outfitImages.map((url, i) => ({ kind: "착장", url, sort_order: i })),
  ].map((r) => ({ ...r, booking_id: booking.id }));

  const { error: imgError } = await db.from("booking_images").insert(images);
  if (imgError) return fail("IMAGE_INSERT_FAILED", 500, imgError.message);

  return ok({ id: booking.id }, 201);
}
