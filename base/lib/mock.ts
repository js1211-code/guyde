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
// 컨설팅 v3 — experts / bookings / consulting_answers / outfit_items
//
// v2의 달력·시간 슬롯 예약은 사라졌다. 지금은 설문을 넣고 선결제하면
// 48시간 안에 "진단 + 피해야 할 것 + 착장 1세트"가 문서로 오는 구조다.
// 필드명은 db/patch_v3.sql의 컬럼명을 그대로 쓴다 — 나중에 Supabase로
// 갈아끼울 때 이름을 바꾸지 않으려는 것.
// ─────────────────────────────────────────────────────────────

/** 컨설팅 단가. 고수마다 다르지 않다 — 상담 방식 선택이 없어졌다. */
export const CONSULTING_PRICE = 14900;
/** 답변 SLA. 화면 ⑰의 "48시간 안에 1회차 답변이 도착해요"와 같은 값. */
export const CONSULTING_SLA_HOURS = 48;

export type Expert = {
  id: string;
  nickname: string;
  temperature: number;
  specialty: Exclude<Category, "자유">;
  intro: string;
  price: number;
  rating: number;
  answered_count: number;
  /** 커뮤니티에 실제로 단 댓글 3개 (F-55) — 더미 텍스트가 아니라 원본 글로 이어진다 */
  highlights: { body: string; post_title: string; post_id: string }[];
  reviews: { rating: number; body: string }[];
};

const experts: Expert[] = [
  {
    id: "e-fox",
    nickname: "정갈한 여우 #0192",
    temperature: 44.1,
    specialty: "옷",
    intro: "체형 상관없이 무난하게 입는 법, 8년째 알려드립니다",
    price: CONSULTING_PRICE,
    rating: 4.9,
    answered_count: 212,
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
      { rating: 5, body: "왜 이 옷인지까지 설명해줘서 다음에 혼자 고를 때도 도움돼요" },
      { rating: 5, body: "예산 안에서 딱 맞춰주셨습니다" },
      { rating: 4, body: "링크가 다 살아 있어서 그대로 샀어요" },
    ],
  },
  {
    id: "e-deer",
    nickname: "말쑥한 사슴 #0231",
    temperature: 43.6,
    specialty: "옷",
    intro: "마른 체형·좁은 어깨 커버가 전문입니다",
    price: CONSULTING_PRICE,
    rating: 4.9,
    answered_count: 168,
    highlights: [
      {
        body: "마른 편이면 오버핏보다 정핏에 레이어드가 훨씬 안전해요",
        post_title: "마른 체형인데 오버핏 입어도 되나요",
        post_id: "seed-slim",
      },
      {
        body: "어깨가 좁으면 셔츠 어깨선을 1cm만 넓게 봐도 달라집니다",
        post_title: "어깨 좁은 편인데 셔츠 사이즈 어떻게 고르나요",
        post_id: "seed-shoulder",
      },
      {
        body: "밝은 하의는 다리가 짧아 보여서 초심자는 어두운 쪽이 무난해요",
        post_title: "베이지 팬츠 무난한가요?",
        post_id: "seed-beige",
      },
    ],
    reviews: [
      { rating: 5, body: "피해야 할 것 목록이 제일 도움됐어요" },
      { rating: 5, body: "수정 요청했더니 바로 다른 안 주셨습니다" },
      { rating: 5, body: "처음으로 옷 사고 후회 안 했어요" },
    ],
  },
  {
    id: "e-owl",
    nickname: "차분한 부엉이 #0774",
    temperature: 42.9,
    specialty: "옷",
    intro: "면접·상견례처럼 실수하면 안 되는 자리 위주로 봐드립니다",
    price: CONSULTING_PRICE,
    rating: 4.8,
    answered_count: 96,
    highlights: [
      {
        body: "면접은 튀지 않는 게 목적이라 네이비 아니면 차콜입니다",
        post_title: "면접 정장 색 뭐가 무난한가요",
        post_id: "seed-suit",
      },
      {
        body: "구두는 새것보다 하루 신어보고 가는 게 낫습니다",
        post_title: "구두 처음 사는데 뭘 봐야 하나요",
        post_id: "seed-shoes",
      },
      {
        body: "상견례는 재킷만 걸쳐도 인상이 크게 달라져요",
        post_title: "상견례 복장 어디까지 갖춰야 하나요",
        post_id: "seed-formal",
      },
    ],
    reviews: [
      { rating: 5, body: "면접 당일에 안심이 됐습니다" },
      { rating: 5, body: "사이즈 산정이 정확했어요" },
      { rating: 4, body: "설명이 길지만 그만큼 꼼꼼합니다" },
    ],
  },
  {
    id: "e-hippo",
    nickname: "말끔한 하마 #0455",
    temperature: 42.5,
    specialty: "옷",
    intro: "10~20만원 예산에서 최대치를 뽑는 걸 잘합니다",
    price: CONSULTING_PRICE,
    rating: 5.0,
    answered_count: 74,
    highlights: [
      {
        body: "예산이 빠듯하면 상의보다 신발에 먼저 쓰세요, 티가 제일 큽니다",
        post_title: "20만원으로 한 벌 맞추려면 어디에 써야 하나요",
        post_id: "seed-budget",
      },
      {
        body: "세일 기다리다 시즌 놓치는 것보다 정가가 나을 때가 많아요",
        post_title: "지금 살까요 세일 기다릴까요",
        post_id: "seed-sale",
      },
      {
        body: "기본템은 브랜드보다 원단 두께를 보세요",
        post_title: "무신사 스탠다드 무난한가요",
        post_id: "seed-basicwear",
      },
    ],
    reviews: [
      { rating: 5, body: "예산을 정확히 지켜주셨어요" },
      { rating: 5, body: "대체 링크까지 줘서 품절 났을 때 편했습니다" },
      { rating: 5, body: "가성비 컨설팅 맞습니다" },
    ],
  },
];

// ── 사전 설문 선택지 (화면 ⑯) ──────────────────────────────
export const CONSULT_PURPOSES = [
  "소개팅",
  "데이트",
  "면접",
  "결혼식 하객",
  "일상",
] as const;

/** 예산 구간. budget_min / budget_max 로 저장된다. */
export const CONSULT_BUDGETS = [
  { label: "10~20만원", min: 100000, max: 200000 },
  { label: "15~30만원", min: 150000, max: 300000 },
  { label: "30~50만원", min: 300000, max: 500000 },
] as const;

/** 지금 지원하는 구간. 나머지는 "준비 중"으로 잠근다. */
export const CONSULT_BUDGET_SUPPORTED = "15~30만원";

export const CONSULT_CONCERNS = [
  "어깨·상체",
  "배·허리",
  "다리 길이",
  "마른 체형",
  "통통한 체형",
  "키",
  "피부톤",
] as const;

// ── 진행 중인 컨설팅 ──────────────────────────────────────
export type OutfitSlot = "상의" | "하의" | "신발";

export type OutfitItem = {
  slot: OutfitSlot;
  url: string;
  alt_url?: string;
  brand: string;
  name: string;
  price: number;
  reason: string;
};

export type ConsultingAnswer = {
  round: 1 | 2;
  diagnosis: string;
  avoid: string[];
  items: OutfitItem[];
};

export type BookingStatus = "신청 접수" | "답변 도착" | "수정 요청됨" | "완료";

export type Booking = {
  id: string;
  expert_id: string;
  expert_nickname: string;
  expert_temperature: number;
  status: BookingStatus;
  purpose: string;
  budget_min: number;
  budget_max: number;
  concerns: string[];
  body_note: string;
  style_note: string;
  price: number;
  created_label: string;
  /** SLA 남은 시간. 데모라 계산하지 않고 문구로 박는다. */
  due_label: string;
  revision_count: 0 | 1;
  revision_reason?: string;
  answers: ConsultingAnswer[];
  review?: { rating: number; body: string };
};

const bookings: Booking[] = [
  {
    id: "bk-1",
    expert_id: "e-fox",
    expert_nickname: "정갈한 여우 #0192",
    expert_temperature: 44.1,
    status: "답변 도착",
    purpose: "소개팅",
    budget_min: 150000,
    budget_max: 300000,
    concerns: ["어깨·상체", "마른 체형"],
    body_note: "어깨가 좁은 편이라 상의가 항상 커 보여요.",
    style_note: "튀지 않으면서 단정해 보였으면 좋겠어요.",
    price: CONSULTING_PRICE,
    created_label: "8월 2일",
    due_label: "12시간 남음",
    revision_count: 0,
    answers: [
      {
        round: 1,
        diagnosis:
          "어깨가 좁고 상체가 마른 편이라 오버핏은 옷이 사람을 먹습니다. 어깨선이 정확히 맞는 세미오버핏으로 가고, 상의를 어둡게 잡아 상체에 무게를 주는 방향이 안전합니다.",
        avoid: ["오버핏 후드", "밝은 카고팬츠", "굽 없는 납작한 스니커즈"],
        items: [
          {
            slot: "상의",
            url: "musinsa.com/goods/3928471",
            alt_url: "29cm.co.kr/item/882014",
            brand: "무신사 스탠다드",
            name: "세미오버핏 코튼 셔츠 · 네이비",
            price: 89000,
            reason:
              "어깨선이 넓은 편이라 세미오버핏이 훨씬 유리하고, 네이비는 하의 색과 무난하게 맞아요.",
          },
          {
            slot: "하의",
            url: "musinsa.com/goods/2201883",
            brand: "토피",
            name: "와이드 슬랙스 · 차콜",
            price: 98000,
            reason:
              "다리 길이를 길어 보이게 하려면 상의보다 하의를 더 어둡게 잡는 게 확실합니다.",
          },
          {
            slot: "신발",
            url: "musinsa.com/goods/1104520",
            alt_url: "kream.co.kr/products/44120",
            brand: "뉴발란스",
            name: "480 로우 · 화이트",
            price: 89000,
            reason:
              "차콜 슬랙스에 흰 신발이면 아래가 밝아져서 전체가 무거워 보이지 않습니다.",
          },
        ],
      },
    ],
  },
  {
    id: "bk-2",
    expert_id: "e-hippo",
    expert_nickname: "말끔한 하마 #0455",
    expert_temperature: 42.5,
    status: "신청 접수",
    purpose: "면접",
    budget_min: 150000,
    budget_max: 300000,
    concerns: ["배·허리"],
    body_note: "허리 쪽이 신경 쓰여서 붙는 옷은 피하고 싶어요.",
    style_note: "무난하게 갖춰 입은 느낌이면 됩니다.",
    price: CONSULTING_PRICE,
    created_label: "8월 4일",
    due_label: "46시간 남음",
    revision_count: 0,
    answers: [],
  },
  {
    id: "bk-3",
    expert_id: "e-deer",
    expert_nickname: "말쑥한 사슴 #0231",
    expert_temperature: 43.6,
    status: "완료",
    purpose: "데이트",
    budget_min: 100000,
    budget_max: 200000,
    concerns: ["마른 체형", "키"],
    body_note: "키가 작은 편이라 다리가 짧아 보이는 게 고민이에요.",
    style_note: "편해 보이지만 신경 쓴 티는 나면 좋겠어요.",
    price: CONSULTING_PRICE,
    created_label: "7월 21일",
    due_label: "완료됨",
    revision_count: 1,
    revision_reason: "상의 색이 제 피부톤과 안 맞는 것 같아요.",
    answers: [
      {
        round: 1,
        diagnosis:
          "허리선을 높여 보이게 하는 게 최우선입니다. 상의를 짧게 가져가고 하의를 하이웨이스트로 잡으면 비율이 정리됩니다.",
        avoid: ["롱 아우터", "밑위 짧은 팬츠"],
        items: [
          {
            slot: "상의",
            url: "musinsa.com/goods/7710233",
            brand: "라퍼지스토어",
            name: "크롭 스웨트셔츠 · 아이보리",
            price: 45000,
            reason:
              "기장이 짧아야 허리선이 위로 올라가 보여서 다리가 길어 보입니다.",
          },
          {
            slot: "하의",
            url: "musinsa.com/goods/6620119",
            brand: "무신사 스탠다드",
            name: "하이웨이스트 데님 · 미드블루",
            price: 59000,
            reason:
              "밑위가 높은 데님이라 상의를 넣어 입으면 비율이 확실히 달라집니다.",
          },
          {
            slot: "신발",
            url: "musinsa.com/goods/9902314",
            brand: "컨버스",
            name: "척 70 하이 · 블랙",
            price: 79000,
            reason:
              "하이탑이라 발목까지 이어져서 다리 라인이 끊기지 않고 길어 보입니다.",
          },
        ],
      },
      {
        round: 2,
        diagnosis:
          "피부톤이 쿨한 편이라 아이보리가 얼굴을 뜨게 만들었습니다. 같은 실루엣에서 색만 그레이로 바꿨습니다.",
        avoid: ["아이보리·크림 계열 상의", "노란 기 도는 베이지"],
        items: [
          {
            slot: "상의",
            url: "musinsa.com/goods/7710240",
            brand: "라퍼지스토어",
            name: "크롭 스웨트셔츠 · 멜란지 그레이",
            price: 45000,
            reason:
              "쿨톤에는 노란 기가 없는 회색이 얼굴색을 훨씬 안정적으로 받쳐줍니다.",
          },
          {
            slot: "하의",
            url: "musinsa.com/goods/6620119",
            brand: "무신사 스탠다드",
            name: "하이웨이스트 데님 · 미드블루",
            price: 59000,
            reason:
              "밑위가 높은 데님이라 상의를 넣어 입으면 비율이 확실히 달라집니다.",
          },
          {
            slot: "신발",
            url: "musinsa.com/goods/9902314",
            brand: "컨버스",
            name: "척 70 하이 · 블랙",
            price: 79000,
            reason:
              "하이탑이라 발목까지 이어져서 다리 라인이 끊기지 않고 길어 보입니다.",
          },
        ],
      },
    ],
    review: { rating: 5, body: "수정 요청 한 번에 딱 맞는 걸 주셨어요." },
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

export const getBookings = () => bookings;
export const getBooking = (id: string) => bookings.find((b) => b.id === id) ?? null;
export const getBookingIds = () => bookings.map((b) => b.id);

/** 마지막 회차 답변. 없으면 아직 고수가 안 썼다는 뜻. */
export const latestAnswer = (b: Booking) => b.answers.at(-1) ?? null;

/** 착장 합계 — DB에선 outfit_totals 뷰가 주는 값이다. */
export const outfitTotal = (a: ConsultingAnswer) =>
  a.items.reduce((sum, i) => sum + i.price, 0);
