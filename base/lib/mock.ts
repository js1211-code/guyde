/**
 * 목 데이터 — 아직 백엔드가 없는 영역만 남겨둔다.
 *
 *   커뮤니티(피드·글쓰기·상세·댓글) → 실제 API (lib/api.ts)
 *   컨설팅(고수·신청·답변·피드백)   → 실제 API (lib/api/consulting.ts)
 *   도서관 · 퀴즈                   → 여기 (백엔드 미구현)
 *
 * 필드명은 db/schema_v2.sql의 컬럼명을 그대로 따른다. 백엔드가 붙으면
 * 화면은 그대로 두고 아래 get*() 본문만 fetch로 바꾸면 된다.
 */

import type { Category } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// 도서관 — articles / quizzes / quiz_results
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
