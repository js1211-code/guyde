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
  /**
   * 표지 사진. Unsplash 호스팅 URL을 그대로 쓴다 —
   * 표지는 우리가 만든 자산이 아니라 인용이라 Storage에 복사할 이유가 없다.
   * crop=faces,entropy 로 잘라낼 지점을 CDN에 맡긴다 — 세로 사진을 CSS로만
   * 자르면 얼굴이 잘려 나가고 몸통 여백만 남아 빈 화면처럼 보인다.
   * next.config.ts의 remotePatterns에 images.unsplash.com이 있어야 뜬다.
   */
  cover_url: string;
  /** 촬영자. Unsplash 라이선스상 표기 의무는 없지만 밝히는 게 예의다. */
  cover_by: string;
  published_at: string;
  /** 본문 — 소제목 + 단락이 번갈아 나온다 */
  sections: { heading: string; body: string; has_image?: boolean }[];
  /** 이 아티클과 이어지는 커뮤니티 글 (아티클 → 커뮤니티 유입) */
  related: string[];
};

const articles: Article[] = [
  {
    id: "a-oversize",
    cover_url: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Brando Makes Branding",
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
    cover_url: "https://images.unsplash.com/photo-1623676714504-edd78728155e?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Onela Ymeri",
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
    cover_url: "https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Salah Regouane",
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
    cover_url: "https://images.unsplash.com/photo-1608975321561-176c1b187d24?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Daniil Onischenko",
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
    cover_url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Jeroen den Otter",
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
    cover_url: "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Danny Ocean",
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
    cover_url: "https://images.unsplash.com/photo-1536098624746-8b23d2a11cd3?auto=format&fit=crop&crop=faces,entropy&w=900&h=600&q=70",
    cover_by: "Tadeusz Lakota",
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

/**
 * 테스트 문항.
 *
 * 결과 타입을 여러 개 두고 점수를 매기는 대신, 선택지마다 가중치를 주고
 * 합이 가장 높은 결과를 낸다 — 문항이 4개뿐이라 이 정도면 충분하고,
 * 무엇보다 "어떤 답을 골라도 결과가 하나"인 가짜 테스트를 피할 수 있다.
 */
export type QuizQuestion = {
  q: string;
  options: { text: string; scores: Record<string, number> }[];
};

export type Quiz = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  taker_count: number;
  questions: QuizQuestion[];
};

const quizzes: Quiz[] = [
  {
    id: "q-hair",
    slug: "hair-shape",
    title: "내 얼굴형에 맞는 헤어는?",
    category: "헤어",
    taker_count: 12402,
    questions: [
      {
        q: "거울을 봤을 때 얼굴이 어떤 편인가요?",
        options: [
          { text: "세로로 길쭉한 편", scores: { long: 2 } },
          { text: "가로로 넓은 편", scores: { round: 2 } },
          { text: "턱선이 각진 편", scores: { square: 2 } },
        ],
      },
      {
        q: "이마는 어떤가요?",
        options: [
          { text: "넓은 편이라 자꾸 가리게 된다", scores: { long: 2 } },
          { text: "좁아서 앞머리를 올리는 편", scores: { round: 1, square: 1 } },
          { text: "보통", scores: { round: 1 } },
        ],
      },
      {
        q: "머리를 만졌을 때 느낌은?",
        options: [
          { text: "가늘고 힘이 없다", scores: { long: 1, round: 1 } },
          { text: "굵고 뻣뻣하다", scores: { square: 2 } },
          { text: "곱슬기가 있다", scores: { round: 2 } },
        ],
      },
      {
        q: "미용실에서 제일 자주 듣는 말은?",
        options: [
          { text: "옆이 자꾸 뜬다", scores: { long: 2 } },
          { text: "숱이 많다", scores: { square: 1, round: 1 } },
          { text: "두상이 예쁘다", scores: { round: 2 } },
        ],
      },
    ],
  },
  {
    id: "q-skin",
    slug: "skin-type",
    title: "내 피부 타입 진단",
    category: "스킨케어",
    taker_count: 8915,
    questions: [
      {
        q: "세안하고 아무것도 안 바르면 30분 뒤에?",
        options: [
          { text: "이마·코가 번들거린다", scores: { oily: 2 } },
          { text: "얼굴 전체가 당긴다", scores: { dry: 2 } },
          { text: "T존만 번들, 볼은 당김", scores: { combo: 2 } },
        ],
      },
      {
        q: "낮 12시쯤 거울을 보면?",
        options: [
          { text: "기름종이가 필요하다", scores: { oily: 2 } },
          { text: "각질이 일어나 있다", scores: { dry: 2 } },
          { text: "코만 살짝 번들거린다", scores: { combo: 2 } },
        ],
      },
      {
        q: "트러블은 어떤가요?",
        options: [
          { text: "자주 올라온다", scores: { oily: 2 } },
          { text: "거의 없는데 붉어진다", scores: { dry: 1, combo: 1 } },
          { text: "가끔 T존에만", scores: { combo: 2 } },
        ],
      },
      {
        q: "겨울에 얼굴이?",
        options: [
          { text: "그래도 번들거린다", scores: { oily: 2 } },
          { text: "심하게 건조하다", scores: { dry: 2 } },
          { text: "볼만 건조하다", scores: { combo: 2 } },
        ],
      },
    ],
  },
  {
    id: "q-perfume",
    slug: "perfume-taste",
    title: "나의 향수 취향 찾기",
    category: "바디&향수",
    taker_count: 6203,
    questions: [
      {
        q: "향수를 뿌리는 이유에 가까운 건?",
        options: [
          { text: "튀지 않게 깔끔한 인상", scores: { woody: 2 } },
          { text: "기억에 남는 향", scores: { spicy: 2 } },
          { text: "산뜻하고 가벼운 느낌", scores: { citrus: 2 } },
        ],
      },
      {
        q: "어디에 주로 뿌리나요?",
        options: [
          { text: "출근·등교할 때 매일", scores: { woody: 2 } },
          { text: "약속 있는 날만", scores: { spicy: 2 } },
          { text: "운동하거나 더울 때", scores: { citrus: 2 } },
        ],
      },
      {
        q: "이런 향은 부담스럽다",
        options: [
          { text: "달고 무거운 향", scores: { woody: 1, citrus: 1 } },
          { text: "비누 냄새처럼 흔한 향", scores: { spicy: 2 } },
          { text: "나무·흙 냄새", scores: { citrus: 2 } },
        ],
      },
      {
        q: "지속력은?",
        options: [
          { text: "은은하게 오래", scores: { woody: 2 } },
          { text: "강하게 확실히", scores: { spicy: 2 } },
          { text: "짧아도 상관없다", scores: { citrus: 2 } },
        ],
      },
    ],
  },
];

export type QuizResult = {
  quiz_slug: string;
  quiz_title: string;
  result_type: string;
  description: string;
  top_percent: number;
  recommendations: string[];
};

/**
 * 결과는 slug 하나에 여러 개다. 선택지 가중치의 합이 가장 높은 키가 뽑힌다.
 * 동점이면 아래 순서에서 먼저 나오는 키가 이긴다 — 무작위로 고르면
 * 같은 답을 넣었는데 결과가 달라져서 테스트로 안 읽힌다.
 */
const quizResults: Record<string, Record<string, QuizResult>> = {
  "skin-type": {
    combo: {
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
    oily: {
      quiz_slug: "skin-type",
      quiz_title: "내 피부 타입 진단",
      result_type: "지성 · 유분 과다형",
      description:
        "하루 종일 유분이 올라오는 타입이에요. 기름을 걷어내는 것보다 덜 나오게 두는 쪽이 결과가 낫습니다. 세게 닦아낼수록 더 나옵니다.",
      top_percent: 29,
      recommendations: [
        "하루 두 번까지만 세안하기",
        "무거운 크림 대신 가벼운 수분 젤",
        "기름종이는 눌러서 흡수만, 문지르지 않기",
      ],
    },
    dry: {
      quiz_slug: "skin-type",
      quiz_title: "내 피부 타입 진단",
      result_type: "건성 · 장벽 약화형",
      description:
        "씻고 나면 바로 당기고 각질이 이는 타입이에요. 자극을 줄이고 수분을 가둬두는 순서가 중요합니다.",
      top_percent: 22,
      recommendations: [
        "미온수로 짧게 세안하기",
        "물기가 남아 있을 때 바로 보습제",
        "각질은 밀지 말고 보습으로 녹이기",
      ],
    },
  },
  "hair-shape": {
    long: {
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
    round: {
      quiz_slug: "hair-shape",
      quiz_title: "내 얼굴형에 맞는 헤어는?",
      result_type: "둥근 얼굴형 · 세로 보완형",
      description:
        "가로가 넓어 보이는 편이라 옆을 정리하고 위를 살짝 세우면 인상이 정돈됩니다.",
      top_percent: 31,
      recommendations: [
        "옆·뒤는 짧게 쳐서 부피 줄이기",
        "앞머리는 내리기보다 살짝 올리기",
        "가르마를 한쪽으로 확실히 내기",
      ],
    },
    square: {
      quiz_slug: "hair-shape",
      quiz_title: "내 얼굴형에 맞는 헤어는?",
      result_type: "각진 얼굴형 · 각 완화형",
      description:
        "턱선이 뚜렷한 편이에요. 각을 가리기보다 위쪽에 부드러운 흐름을 만들면 균형이 맞습니다.",
      top_percent: 24,
      recommendations: [
        "옆을 너무 밀지 않고 자연스럽게 남기기",
        "앞머리에 흐름을 주는 컷",
        "왁스는 딱딱하게 굳지 않는 제형으로",
      ],
    },
  },
  "perfume-taste": {
    woody: {
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
    citrus: {
      quiz_slug: "perfume-taste",
      quiz_title: "나의 향수 취향 찾기",
      result_type: "시트러스 · 산뜻형",
      description:
        "가볍고 깨끗한 향을 좋아하는 편이에요. 지속력이 짧은 계열이라 덧뿌릴 걸 감안하고 고르면 됩니다.",
      top_percent: 36,
      recommendations: [
        "시트러스 계열 오드코롱으로 시작",
        "여름·운동 전후에 특히 잘 맞는다",
        "지속력이 짧으니 작은 용량부터",
      ],
    },
    spicy: {
      quiz_slug: "perfume-taste",
      quiz_title: "나의 향수 취향 찾기",
      result_type: "스파이시 · 존재감형",
      description:
        "기억에 남는 향을 원하는 편이에요. 다만 강한 계열이라 뿌리는 양을 줄이는 게 실패를 막는 유일한 방법입니다.",
      top_percent: 18,
      recommendations: [
        "한 번만 뿌리고 시작하기",
        "좁은 실내·식사 자리는 피하기",
        "겨울 저녁 약속에 특히 잘 맞는다",
      ],
    },
  },
};

/** 선택지 가중치를 합해 결과 키를 정한다. */
export function scoreQuiz(quiz: Quiz, picks: number[]): string {
  const total: Record<string, number> = {};
  quiz.questions.forEach((q, i) => {
    const opt = q.options[picks[i]];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.scores)) {
      total[k] = (total[k] ?? 0) + v;
    }
  });

  const keys = Object.keys(quizResults[quiz.slug] ?? {});
  // 동점일 때 선언 순서가 이기도록 keys를 기준으로 훑는다.
  return keys.reduce((best, k) => ((total[k] ?? 0) > (total[best] ?? 0) ? k : best), keys[0]);
}

export const getArticles = () => articles;
export const getHeroArticle = () => articles.find((a) => a.is_hero) ?? articles[0];
export const getLatestArticles = () => articles.filter((a) => !a.is_hero);
export const getArticle = (id: string) => articles.find((a) => a.id === id) ?? null;
export const getArticleIds = () => articles.map((a) => a.id);

export const getQuizzes = () => quizzes;
export const getQuiz = (slug: string) => quizzes.find((q) => q.slug === slug) ?? null;
export const getQuizResults = (slug: string) => quizResults[slug] ?? null;
export const getQuizSlugs = () => Object.keys(quizResults);
