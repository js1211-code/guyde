/**
 * 목 데이터 — 아직 백엔드가 없는 영역만 남겨둔다.
 *
 *   커뮤니티(피드·글쓰기·상세·댓글) → 실제 API (lib/api.ts)
 *   매거진 · 고수 · 예약            → 여기 (S4~S10 백엔드 미구현)
 *
 * 필드명은 db/schema_v2.sql의 컬럼명을 그대로 따른다. 백엔드가 붙으면
 * 화면은 그대로 두고 아래 get*() 본문만 fetch로 바꾸면 된다.
 */

import type { Category } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// 매거진 — articles / quizzes / quiz_results
// ─────────────────────────────────────────────────────────────

export type Article = {
  id: string;
  title: string;
  lead: string;
  category: Category;
  read_minutes: number;
  is_hero: boolean;
  published_at: string;
  /** 본문 — 소제목 + 단락이 번갈아 나온다 */
  sections: { heading: string; body: string; has_image?: boolean }[];
  /** 이 아티클과 이어지는 커뮤니티 글 (아티클 → 커뮤니티 유입) */
  related: string[];
};

const articles: Article[] = [
  {
    id: "a-oversize",
    title: "올여름 남자 반팔, 오버핏은 이제 끝났나",
    lead: "체형 상관없이 통했던 오버핏 유행이 저물면서 실루엣이 다시 좁아지고 있다. 무난하게 갈아탈 라인을 정리했다.",
    category: "옷",
    read_minutes: 3,
    is_hero: true,
    published_at: "2026.07.28",
    sections: [
      {
        heading: "실루엣이 다시 좁아진다",
        body: "몇 해 동안 체형 커버의 정답처럼 통했던 오버핏이 조금씩 저물고 있다. 어깨선이 맞고 팔 둘레가 슬림한 반팔이 매장 진열대 앞쪽을 차지하는 빈도가 늘었다.",
        has_image: true,
      },
      {
        heading: "그럼 뭘 사야 무난할까",
        body: "몸에 딱 붙지 않으면서도 어깨선만 맞춰도 인상이 크게 달라진다. 색은 무채색 위주로 두세 벌만 있어도 로테이션이 충분하다.",
      },
    ],
    related: [
      "반팔 오버핏 아직도 괜찮은지 애매하네요",
      "슬림핏 반팔 무난한 브랜드 추천해주세요",
    ],
  },
  {
    id: "a-suncream",
    title: "선크림 백탁 없는 제품만 모아봤습니다",
    lead: "톤업 기능을 뺀 무기자차 위주로 골랐다.",
    category: "스킨케어",
    read_minutes: 3,
    is_hero: false,
    published_at: "2026.07.26",
    sections: [
      {
        heading: "백탁은 왜 생기나",
        body: "자외선을 물리적으로 튕겨내는 성분이 흰 가루라서 그렇다. 입자를 잘게 쪼갠 제품일수록 백탁이 덜하다.",
      },
    ],
    related: ["이 선크림 백탁 없이 무난한가요?"],
  },
  {
    id: "a-twoblock",
    title: "투블럭, 이제 안 치는 사람이 더 많다",
    lead: "옆을 바짝 치는 대신 두상을 살리는 쪽으로 옮겨가는 중이다.",
    category: "헤어",
    read_minutes: 3,
    is_hero: false,
    published_at: "2026.07.27",
    sections: [
      {
        heading: "왜 덜 치기 시작했나",
        body: "옆을 짧게 치면 두상이 그대로 드러난다. 뒤통수가 납작한 편이면 오히려 더 도드라져서, 요즘은 6mm 이상 남기고 층으로 정리하는 쪽을 권한다.",
      },
      {
        heading: "미용실에서 뭐라고 말할까",
        body: "기장보다 원하는 느낌을 사진으로 보여주는 게 정확하다. '옆은 남기고 뒤로 자연스럽게'가 가장 무난한 주문이다.",
      },
    ],
    related: ["투블럭 기르는 중인데 옆머리 어디까지 참아야 하나요"],
  },
  {
    id: "a-knit",
    title: "겨울 니트 하나로 3주 버티는 법",
    lead: "세탁 주기를 늘리는 관리법.",
    category: "옷",
    read_minutes: 2,
    is_hero: false,
    published_at: "2026.07.24",
    sections: [
      {
        heading: "매번 빨지 않아도 된다",
        body: "니트는 입고 나서 하루 걸어두면 냄새와 주름이 상당 부분 빠진다. 세탁은 3주에 한 번이면 충분하다.",
      },
    ],
    related: [],
  },
  {
    id: "a-perfume",
    title: "겨울철 향수, 잔향 오래 남기는 법",
    lead: "온도가 낮으면 향이 덜 퍼진다.",
    category: "바디&향수",
    read_minutes: 4,
    is_hero: false,
    published_at: "2026.07.22",
    sections: [
      {
        heading: "체온이 닿는 곳에",
        body: "손목 안쪽과 목덜미처럼 맥이 뛰는 자리에 뿌리면 체온으로 향이 천천히 올라온다.",
      },
    ],
    related: ["이 향 데일리로 뿌리기 무난할까요?"],
  },
  {
    id: "a-interview",
    title: "면접 코디, 무난함의 기준이 바뀌고 있다",
    lead: "정장 아니어도 되는 자리가 늘었다.",
    category: "옷",
    read_minutes: 5,
    is_hero: false,
    published_at: "2026.07.20",
    sections: [
      {
        heading: "정장이 기본값이 아니다",
        body: "업계에 따라 셔츠에 슬랙스만으로도 충분한 곳이 많아졌다. 다만 신발과 벨트는 여전히 눈에 띈다.",
      },
    ],
    related: [],
  },
  {
    id: "a-cleansing",
    title: "지성 피부를 위한 클렌징 순서 정리",
    lead: "이중 세안이 항상 답은 아니다.",
    category: "스킨케어",
    read_minutes: 3,
    is_hero: false,
    published_at: "2026.07.18",
    sections: [
      {
        heading: "과하게 씻으면 더 난다",
        body: "유분을 다 걷어내면 피부가 부족하다고 판단해 더 많이 만든다. 아침은 물세안만으로도 충분한 경우가 많다.",
      },
    ],
    related: [],
  },
];

export type Quiz = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  taker_count: number;
};

const quizzes: Quiz[] = [
  { id: "q-hair", slug: "hair-shape", title: "내 얼굴형에 맞는 헤어는?", category: "옷", taker_count: 12402 },
  { id: "q-skin", slug: "skin-type", title: "내 피부 타입 진단", category: "스킨케어", taker_count: 8915 },
  { id: "q-perfume", slug: "perfume-taste", title: "나의 향수 취향 찾기", category: "바디&향수", taker_count: 6203 },
];

export type QuizResult = {
  quiz_slug: string;
  quiz_title: string;
  result_type: string;
  description: string;
  top_percent: number;
  recommendations: string[];
};

const quizResults: Record<string, QuizResult> = {
  "skin-type": {
    quiz_slug: "skin-type",
    quiz_title: "내 피부 타입 진단",
    result_type: "복합성 · 수분 부족형",
    description:
      "T존은 유분이 많고 볼은 당기는 타입이에요. 겉은 번들거려도 속은 건조해서 유수분 밸런스 관리가 관건입니다.",
    top_percent: 34,
    recommendations: [
      "저자극 젤 타입 세안제로 교체하기",
      "수분 토너 후 가벼운 로션으로 마무리",
      "T존만 위크엔드 팩으로 유분 관리",
    ],
  },
  "hair-shape": {
    quiz_slug: "hair-shape",
    quiz_title: "내 얼굴형에 맞는 헤어는?",
    result_type: "긴 얼굴형 · 볼륨 보완형",
    description:
      "세로가 길어 보이는 편이라 윗머리를 세우기보다 옆으로 넓혀주는 컷이 무난합니다.",
    top_percent: 28,
    recommendations: [
      "앞머리를 조금 내려 세로 길이 줄이기",
      "옆 볼륨을 살리는 레이어드 컷",
      "왁스는 매트한 제형으로",
    ],
  },
  "perfume-taste": {
    quiz_slug: "perfume-taste",
    quiz_title: "나의 향수 취향 찾기",
    result_type: "우디 · 데일리형",
    description:
      "튀지 않으면서 오래 남는 향을 선호하는 편이에요. 회사나 학교에서도 부담 없는 계열입니다.",
    top_percent: 41,
    recommendations: [
      "우디 계열 오드뚜왈렛부터 시작",
      "손목 대신 목덜미에 한 번만",
      "겨울에는 한 번 더 덧뿌리기",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// 컨설팅 — experts / reviews / expert_slots / bookings
// ─────────────────────────────────────────────────────────────

export type Expert = {
  id: string;
  nickname: string;
  temperature: number;
  specialty: Exclude<Category, "자유">;
  intro: string;
  price_chat: number;
  price_video: number;
  rating: number;
  /** 커뮤니티에 실제로 단 댓글 3개 (F-55) — 더미 텍스트가 아니라 원본 글로 이어진다 */
  highlights: { body: string; post_title: string; post_id: string }[];
  reviews: { rating: number; body: string }[];
  /** 상담 가능한 고민 항목 (F-57) — 전문분야마다 다르다 */
  concerns: string[];
};

const experts: Expert[] = [
  {
    id: "e-fox",
    nickname: "정갈한 여우 #0192",
    temperature: 39.1,
    specialty: "옷",
    intro: "체형 상관없이 무난하게 입는 법, 8년째 알려드립니다",
    price_chat: 15000,
    price_video: 35000,
    rating: 4.9,
    highlights: [
      {
        body: "블랙이 무난하긴 한데 카멜도 요즘 많이 입더라고요",
        post_title: "겨울 코트 색깔 뭐가 더 무난할까요?",
        post_id: "seed-coat",
      },
      {
        body: "반팔 오버핏은 어깨선만 맞으면 크게 티 안나요",
        post_title: "반팔 오버핏 아직도 괜찮은지 애매하네요",
        post_id: "seed-tee",
      },
      {
        body: "재킷 하나 살 거면 그레이가 활용도 제일 높아요",
        post_title: "이 재킷 무난하게 입고 다닐 수 있나요?",
        post_id: "seed-jacket",
      },
    ],
    reviews: [
      { rating: 5, body: "설명이 꼼꼼해서 좋았어요" },
      { rating: 5, body: "화상 상담 추천, 직접 입어보면서 봐주셔서 도움됐어요" },
      { rating: 4, body: "채팅으로도 충분히 자세했습니다" },
    ],
    concerns: ["체형 커버", "소개팅룩", "면접복", "사이즈 고르기", "색 조합"],
  },
  {
    id: "e-deer",
    nickname: "말쑥한 사슴 #0231",
    temperature: 38.9,
    specialty: "헤어",
    intro: "두상·모질 보고 어울리는 컷을 정확히 짚어드립니다",
    price_chat: 15000,
    price_video: 33000,
    rating: 4.9,
    highlights: [
      {
        body: "투블럭은 옆을 너무 치면 두상이 그대로 드러나요, 6mm부터 가세요",
        post_title: "투블럭 기르는 중인데 옆머리 어디까지 참아야 하나요",
        post_id: "seed-twoblock",
      },
      {
        body: "모발이 얇으면 왁스보다 파우더가 훨씬 잘 잡힙니다",
        post_title: "머리숱 적은데 왁스 뭐가 무난한가요",
        post_id: "seed-wax",
      },
      {
        body: "미용실에서는 '기장'보다 '어떤 느낌'을 사진으로 보여주는 게 정확해요",
        post_title: "미용실에서 뭐라고 말해야 원하는 머리가 나오나요",
        post_id: "seed-salon",
      },
    ],
    reviews: [
      { rating: 5, body: "두상 얘기 듣고 처음으로 머리가 마음에 들었어요" },
      { rating: 5, body: "사진 보내니 바로 컷 이름까지 알려주심" },
      { rating: 4, body: "제품 추천이 구체적이라 좋았습니다" },
    ],
    concerns: ["두상 커버", "모질에 맞는 컷", "스타일링 제품", "미용실에서 말하기", "기르는 중 관리"],
  },
  {
    id: "e-owl",
    nickname: "차분한 부엉이 #0774",
    temperature: 38.6,
    specialty: "스킨케어",
    intro: "지성·복합성 피부 루틴 잡아드립니다",
    price_chat: 18000,
    price_video: 38000,
    rating: 4.8,
    highlights: [
      {
        body: "지성이면 아침은 물세안만 해도 충분해요",
        post_title: "지성 피부인데 세안 몇 번 하세요?",
        post_id: "seed-wash",
      },
      {
        body: "톤업 빠진 무기자차 쓰시면 백탁 거의 없습니다",
        post_title: "이 선크림 백탁 없이 무난한가요?",
        post_id: "seed-sun",
      },
      {
        body: "토너 - 로션 두 단계면 시작으로 충분합니다",
        post_title: "스킨케어 기본템 추천해주세요",
        post_id: "seed-basic",
      },
    ],
    reviews: [
      { rating: 5, body: "제품명까지 짚어주셔서 바로 샀습니다" },
      { rating: 5, body: "루틴이 단순해져서 좋아요" },
      { rating: 4, body: "질문에 다 답해주셨어요" },
    ],
    concerns: ["유분 관리", "건조함", "트러블", "제품 고르기", "루틴 순서"],
  },
  {
    id: "e-hippo",
    nickname: "말끔한 하마 #0455",
    temperature: 39.4,
    specialty: "바디&향수",
    intro: "향수 첫 구매부터 데일리 조합까지",
    price_chat: 15000,
    price_video: 32000,
    rating: 5.0,
    highlights: [
      {
        body: "우디 계열은 대체로 무난해요, 양만 조절하면 될 듯",
        post_title: "이 향수 데일리로 뿌리기 무난한가요?",
        post_id: "seed-perfume",
      },
      {
        body: "첫 향수는 오드뚜왈렛으로 시작하시는 걸 권해요",
        post_title: "향수 처음 사는데 뭐부터 봐야 하나요",
        post_id: "seed-first",
      },
      {
        body: "겨울엔 두 번 뿌려도 과하지 않습니다",
        post_title: "겨울에 향이 금방 날아가요",
        post_id: "seed-winter",
      },
    ],
    reviews: [
      { rating: 5, body: "취향을 정확히 짚어주셨어요" },
      { rating: 5, body: "예산 안에서 골라주셔서 좋았습니다" },
      { rating: 5, body: "시향 순서까지 알려주심" },
    ],
    concerns: ["첫 향수 고르기", "데일리 향", "계절별 조합", "지속력", "예산 맞추기"],
  },
];

/** 슬롯 — 고수마다 요일·시간대를 다르게 열어둔다(D-05). 8월 기준. */
const slots: Record<string, { day: number; times: string[] }[]> = {
  "e-fox": [
    { day: 6, times: ["10:00", "14:00"] },
    { day: 9, times: ["10:00", "14:00"] },
    { day: 13, times: ["11:30", "16:00"] },
    { day: 20, times: ["10:00"] },
  ],
  "e-owl": [
    { day: 5, times: ["09:00", "13:00"] },
    { day: 12, times: ["13:00", "18:00"] },
    { day: 19, times: ["09:00"] },
  ],
  "e-hippo": [
    { day: 7, times: ["15:00"] },
    { day: 8, times: ["11:00", "15:00", "19:00"] },
    { day: 15, times: ["11:00"] },
  ],
};

export type Booking = {
  id: string;
  expert_id: string;
  expert_nickname: string;
  slot_label: string;
  concerns: string[];
  status: "신청 접수";
};

const bookings: Booking[] = [
  {
    id: "bk-1",
    expert_id: "e-fox",
    expert_nickname: "정갈한 여우 #0192",
    slot_label: "8월 9일(일) 오전 10:00",
    concerns: ["체형 커버", "색 조합"],
    status: "신청 접수",
  },
];

// ─────────────────────────────────────────────────────────────
// 조회 함수
// ─────────────────────────────────────────────────────────────

export const getArticles = () => articles;
export const getHeroArticle = () => articles.find((a) => a.is_hero) ?? articles[0];
export const getLatestArticles = () => articles.filter((a) => !a.is_hero);
export const getArticle = (id: string) => articles.find((a) => a.id === id) ?? null;
export const getArticleIds = () => articles.map((a) => a.id);

export const getQuizzes = () => quizzes;
export const getQuizResult = (slug: string) => quizResults[slug] ?? null;
export const getQuizSlugs = () => Object.keys(quizResults);

export const getExperts = (specialty?: string) =>
  experts.filter((e) => !specialty || e.specialty === specialty);
export const getExpert = (id: string) => experts.find((e) => e.id === id) ?? null;
export const getExpertIds = () => experts.map((e) => e.id);
export const getSlots = (expertId: string) => slots[expertId] ?? [];

export const getBookings = () => bookings;
export const getBooking = (id: string) => bookings.find((b) => b.id === id) ?? null;
export const getBookingIds = () => bookings.map((b) => b.id);
