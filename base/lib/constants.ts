/**
 * 데모 기준값 — 숫자를 화면에 흩뿌리지 않고 여기서만 고친다.
 * 출처: Updated Feature List (F-06, F-71~73, F-80) + CLAUDE.md v2.
 */

/**
 * 주제 축. post_type(물어보는 방식)과 완전히 다른 축이다.
 * 여기를 고치면 db/patch_v2_3.sql의 CHECK 제약도 같이 고쳐야 한다 —
 * DB가 거부하면 화면에만 탭이 생기고 글은 안 올라간다.
 */
export const CATEGORIES = ["헤어", "옷", "스킨케어", "바디&향수", "자유"] as const;
export type Category = (typeof CATEGORIES)[number];

/** 온도가 쌓이는 카테고리. '자유'는 잡담방이라 제외된다(F-06). */
export const TEMP_CATEGORIES = CATEGORIES.filter((c) => c !== "자유");

/** 물어보는 방식 — category와 완전히 다른 축이다. */
export const POST_TYPES = ["일반질문", "선택지투표", "무난함판정"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABEL: Record<PostType, string> = {
  일반질문: "일반 글",
  선택지투표: "선택지 투표",
  무난함판정: "무난함 판정",
};

export const POST_TYPE_HINT: Record<PostType, string> = {
  일반질문: "그냥 이야기하거나 물어보기",
  선택지투표: "2~5개 중 골라달라기",
  무난함판정: "무난한지 애매한지 판정받기",
};

export const TEMP_START = 36.5;
/**
 * 고수 자격 기준. F-71/72가 42.0으로 명시.
 * (디자인 파일 ⑱의 "0.7도 남았어요"는 목업 문구라 여기 기준을 따른다)
 */
export const TEMP_EXPERT_GATE = 42.0;
export const EXPERT_TOP_PERCENT = 10;

export const POST_COST_HEARTS = 1;

/** 광고 한 번 보면 주는 하트 (F-80) */
export const AD_REWARD_HEARTS = 2;
/** 무한 수급을 막는 상한. 최근 24시간 기준. */
export const AD_REWARD_LIMIT = 5;
export const AD_REWARD_WINDOW_HOURS = 24;
export const POLL_OPTION_MIN = 2;
export const POLL_OPTION_MAX = 5;
export const POST_IMAGE_MAX = 2;

// ─────────────────────────────────────────────────────────────
// 컨설팅 (v3)
// 화면과 API가 같은 값을 봐야 한다. 예전에 카테고리를 API가 따로 들고
// 있다가 "탭은 생겼는데 저장은 거부"가 난 적이 있다 — 같은 실수를 막는다.
// ─────────────────────────────────────────────────────────────

/** 컨설팅 단가. 고수마다 다르지 않다 — 상담 방식 선택이 없어졌다. */
export const CONSULTING_PRICE = 14900;

/** 답변 SLA. 화면 ⑰의 "48시간 안에 1회차 답변이 도착해요"와 같은 값. */
export const CONSULTING_SLA_HOURS = 48;

export const CONSULT_PURPOSES = [
  "소개팅",
  "데이트",
  "면접",
  "결혼식 하객",
  "일상",
] as const;
export type ConsultPurpose = (typeof CONSULT_PURPOSES)[number];

/**
 * 예산 — 구간이 아니라 단일 금액이다(bookings.budget).
 * 15만원 미만은 상의·하의·신발을 새로 갖추기엔 빠듯해서 열지 않고,
 * 30만원 초과는 아직 준비가 안 됐다. 둘 다 왜 없는지 화면에 적어준다 —
 * 이유를 안 적으면 "내 예산은 취급 안 하는구나"로만 읽힌다.
 */
export const CONSULT_BUDGETS = [150000, 200000, 250000, 300000] as const;
export type ConsultBudget = (typeof CONSULT_BUDGETS)[number];

export const CONSULT_BUDGET_MIN = CONSULT_BUDGETS[0];
export const CONSULT_BUDGET_MAX = CONSULT_BUDGETS[CONSULT_BUDGETS.length - 1];

export const CONSULT_BUDGET_NOTES = [
  `${CONSULT_BUDGET_MIN / 10000}만원 미만 — 상의/하의/신발을 새로 갖추기엔 예산이 빠듯해 만족스러운 제안이 어려워요.`,
  `${CONSULT_BUDGET_MAX / 10000}만원 초과 — 더 큰 예산의 컨설팅은 준비 중이에요.`,
] as const;

export const CONSULT_CONCERNS = [
  "어깨·상체",
  "배·허리",
  "다리 길이",
  "마른 체형",
  "통통한 체형",
  "키",
  "피부톤",
] as const;

/** 착장 1세트. 셋 다 필수 — 하나라도 비면 "입을 수 있는 한 벌"이 안 된다. */
export const OUTFIT_SLOTS = ["상의", "하의", "신발"] as const;
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

/** bookings.status. DB CHECK 제약과 순서까지 같아야 한다. */
export const BOOKING_STATUSES = [
  "신청 접수",
  "답변 도착",
  "수정 요청됨",
  "완료",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** outfit_items.reason의 DB CHECK와 같은 값. 화면에서만 막으면 API로 우회된다. */
export const OUTFIT_REASON_MIN = 20;
/** feedbacks_reason_required CHECK와 같은 값. */
export const REVISION_REASON_MIN = 10;
/** 수정 요청 횟수 상한. bookings_revision_check와 같은 값. */
export const REVISION_MAX = 1;

/**
 * 사전 설문의 사진 최소 장수. 두 종류 다 필수다.
 * 전신은 체형을, 자주 입는 옷은 이미 가진 것을 알려준다 —
 * 후자가 없으면 옷장에 이미 있는 걸 다시 사라고 할 위험이 있다.
 */
export const BODY_PHOTO_MIN = 1;
export const OUTFIT_PHOTO_MIN = 1;
export const BOOKING_PHOTO_MAX = 5;
