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

/**
 * 물어보는 방식 — category와 완전히 다른 축이다.
 *
 * '정보공유'만 성격이 다르다. 나머지 셋은 "봐주세요"고 이건 "알려드릴게요"다.
 * 그래서 투표 대신 좋아요를 받고, 받은 좋아요가 온도에 ×0.2로 반영된다.
 * 질문해서 온도가 오르는 경로는 없지만 알려줘서 오르는 경로는 있다 —
 * 온도는 고수 판별 장치라서 방향이 이래야 한다.
 */
export const POST_TYPES = [
  "일반질문",
  "선택지투표",
  "무난함판정",
  "정보공유",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABEL: Record<PostType, string> = {
  일반질문: "일반 글",
  선택지투표: "선택지 투표",
  무난함판정: "무난함 판정",
  정보공유: "정보 공유",
};

export const POST_TYPE_HINT: Record<PostType, string> = {
  일반질문: "그냥 이야기하거나 물어보기",
  선택지투표: "2~5개 중 골라달라기",
  무난함판정: "무난한지 애매한지 판정받기",
  정보공유: "아는 걸 알려주기",
};

/** 투표가 아니라 좋아요를 받는 유형. 화면이 다른 안내를 띄운다. */
export const LIKE_POST_TYPES: readonly PostType[] = ["정보공유"];
export const isFreePost = (t: PostType) => LIKE_POST_TYPES.includes(t);

export const TEMP_START = 36.5;
/**
 * 고수 자격 기준. F-71/72가 42.0으로 명시.
 * (디자인 파일 ⑱의 "0.7도 남았어요"는 목업 문구라 여기 기준을 따른다)
 */
export const TEMP_EXPERT_GATE = 42.0;
// EXPERT_TOP_PERCENT(상위 10%)는 없앴다. 실제 기준은 백분위가 아니라
// 42.0℃라는 절대값이라, 두 표현이 같이 있으면 화면마다 말이 달라진다.


/**
 * 무난템 기준.
 * 무난함 판정에서 이 % 이상을 받은 글만 도서관 '무난템' 서가에 오른다.
 * 커뮤니티의 '무난무난' 탭은 판정글을 전부 보여준다 — 그쪽은 판정을 받는
 * 곳이고, 여기는 판정이 끝난 것만 모으는 곳이라 역할이 다르다.
 */
export const NANHAN_PICK_PERCENT = 60;

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
 * '기타'는 저장되는 값이 아니라 자유 입력칸을 여는 스위치다.
 * 고수가 보는 건 "기타"가 아니라 실제로 어떤 자리인지라서,
 * 기타를 고르면 사용자가 쓴 문장이 그대로 purpose로 저장된다.
 */
export const CONSULT_OTHER = "기타";
/** 자유 입력 purpose의 길이 상한. 목록 밖 값을 받는 대신 길이는 막는다. */
export const CONSULT_PURPOSE_MAX = 40;

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
  `${CONSULT_BUDGET_MIN / 10000}만원 미만 — 예산이 빠듯해 만족스러운 제안이 어려워요.`,
  `${CONSULT_BUDGET_MAX / 10000}만원 초과 — 더 큰 예산의 컨설팅은 준비 중이에요.`,
] as const;

/**
 * 신경 쓰이는 부위. 여기에 '기타'는 넣지 않는다 —
 * 목록에 없는 고민은 '기타'라는 단어가 아니라 자유 서술(body_note)이
 * 실제 정보를 담는다. 화면에서는 CONSULT_OTHER 칩을 뒤에 덧붙여 그린다.
 */
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

/**
 * 구매 링크가 링크처럼 생겼는지.
 *
 * 엄격한 URL 파싱까지는 안 한다 — 고수는 "musinsa.com/goods/1" 처럼
 * 프로토콜 없이 붙여넣고, 화면이 https를 붙여 연다.
 * 다만 공백이 있거나 점이 없으면 주소가 아니라 문장이다.
 * 이걸 안 막으면 신청자가 링크를 눌렀을 때 아무 데도 가지 못한다.
 */
export function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  if (!v || /\s/.test(v)) return false;
  const host = v.replace(/^https?:\/\//i, "").split("/")[0];
  return /^[^.]+\.[^.]{2,}/.test(host);
}
