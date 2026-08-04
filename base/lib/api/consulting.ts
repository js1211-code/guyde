import { createAdminClient } from "@/lib/supabase/admin";
import { CONSULTING_SLA_HOURS } from "@/lib/constants";

/**
 * 컨설팅 조회의 공통 부분.
 *
 * 고수/신청자 정보는 users·experts에 흩어져 있고, 온도는 저장값이 아니라
 * calc_temperature()가 매번 계산한다(F-06). 화면마다 이걸 다시 조립하면
 * 어딘가는 캐시된 users.temperature를 읽게 되므로 여기 한 곳에 모은다.
 */

export type ExpertRow = {
  id: string;
  device_id: string;
  specialty: string;
  intro: string;
  price: number;
};

/** 여러 기기의 온도를 한 번에 계산한다. RPC를 1인 1회 호출하면 N+1이 된다. */
export async function temperaturesOf(
  db: ReturnType<typeof createAdminClient>,
  deviceIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (deviceIds.length === 0) return out;

  const unique = [...new Set(deviceIds)];
  const results = await Promise.all(
    unique.map((d) => db.rpc("calc_temperature", { p_device: d })),
  );
  unique.forEach((d, i) => out.set(d, Number(results[i].data ?? 36.5)));
  return out;
}

/**
 * 고수의 "커뮤니티 대표 답변 3개"(F-55).
 * 더미 텍스트가 아니라 실제로 단 댓글을 추천 많은 순으로 뽑고 원본 글로 잇는다.
 * 이게 없으면 크몽·숨고와 구분되지 않는다.
 */
export async function highlightsOf(
  db: ReturnType<typeof createAdminClient>,
  deviceId: string,
  limit = 3,
) {
  const { data } = await db
    .from("comments")
    .select("id, body, likes, post_id, posts(id, title)")
    .eq("device_id", deviceId)
    .order("likes", { ascending: false })
    .limit(limit);

  return (data ?? []).map((c) => {
    const post = c.posts as unknown as { id: string; title: string } | null;
    return {
      body: c.body,
      likes: c.likes,
      post_id: post?.id ?? c.post_id,
      post_title: post?.title ?? "",
    };
  });
}

/** SLA 마감까지 남은 시간을 사람이 읽는 문구로. 지나면 "지연"이라고 말한다. */
export function dueLabel(dueAt: string | null, status: string): string {
  if (status === "완료") return "완료됨";
  if (!dueAt) return `${CONSULTING_SLA_HOURS}시간 안에 답변`;

  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs <= 0) return "답변이 지연되고 있어요";

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}일 ${hours % 24}시간 남음`;
  if (hours >= 1) return `${hours}시간 남음`;
  return `${Math.max(1, Math.floor(diffMs / 60_000))}분 남음`;
}

/** 날짜를 "8월 4일"로. 목록 카드의 신청일에 쓴다. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 한 건의 컨설팅을 화면이 그대로 쓸 수 있는 모양으로 조립한다.
 * device_id는 절대 밖으로 내보내지 않는다 — 그게 곧 신원이다.
 */
export async function loadBooking(
  db: ReturnType<typeof createAdminClient>,
  bookingId: string,
) {
  const { data: booking, error } = await db
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!booking) return null;

  const { data: expert } = await db
    .from("experts")
    .select("id, device_id, price, intro")
    .eq("id", booking.expert_id)
    .maybeSingle();

  const expertDevice = expert?.device_id ?? null;
  const [{ data: expertUser }, temps, { data: answers }, { data: images }] =
    await Promise.all([
      expertDevice
        ? db.from("users").select("nickname").eq("device_id", expertDevice).maybeSingle()
        : Promise.resolve({ data: null }),
      expertDevice ? temperaturesOf(db, [expertDevice]) : Promise.resolve(new Map()),
      db
        .from("consulting_answers")
        .select("id, round, diagnosis, avoid, created_at, outfit_items(*)")
        .eq("booking_id", bookingId)
        .order("round", { ascending: true }),
      db
        .from("booking_images")
        .select("kind, url, sort_order")
        .eq("booking_id", bookingId)
        .order("sort_order", { ascending: true }),
    ]);

  return {
    booking,
    expertDevice,
    view: {
      id: booking.id,
      status: booking.status,
      purpose: booking.purpose,
      budget: booking.budget,
      concerns: booking.concerns ?? [],
      body_note: booking.body_note ?? "",
      style_note: booking.style_note ?? "",
      price: booking.price,
      revision_count: booking.revision_count ?? 0,
      created_label: dayLabel(booking.created_at),
      due_label: dueLabel(booking.due_at, booking.status),
      expert: {
        id: expert?.id ?? booking.expert_id,
        nickname: expertUser?.nickname ?? "알 수 없음",
        temperature: expertDevice ? (temps.get(expertDevice) ?? 36.5) : 36.5,
        intro: expert?.intro ?? "",
      },
      images: (images ?? []).map((i) => ({ kind: i.kind, url: i.url })),
      answers: (answers ?? []).map((a) => {
        const items = ((a.outfit_items ?? []) as OutfitItemRow[]).slice().sort(
          (x, y) => SLOT_ORDER.indexOf(x.slot) - SLOT_ORDER.indexOf(y.slot),
        );
        return {
          id: a.id,
          round: a.round,
          diagnosis: a.diagnosis,
          avoid: a.avoid ?? [],
          items,
          total: items.reduce((sum, i) => sum + i.price, 0),
        };
      }),
    },
  };
}

type OutfitItemRow = {
  slot: string;
  url: string;
  alt_url: string | null;
  brand: string | null;
  name: string;
  price: number;
  reason: string;
};

// 상의 → 하의 → 신발. DB는 순서를 보장하지 않아서 화면 직전에 정렬한다.
const SLOT_ORDER = ["상의", "하의", "신발"];
