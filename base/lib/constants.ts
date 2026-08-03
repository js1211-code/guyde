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
