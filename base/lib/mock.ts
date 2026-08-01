/**
 * 목 데이터 — UI 셸 전용. 나중에 Supabase 쿼리로 통째로 교체한다.
 *
 * 필드명은 CLAUDE.md의 DB 스키마 컬럼명을 그대로 따른다(snake_case).
 * 교체할 때 컴포넌트 마크업은 건드리지 않고 이 파일의 함수 본문만 바꾸면 되도록,
 * 화면이 쓰는 진입점은 전부 아래 get*() 함수로 모아뒀다.
 *
 * 교체 시 주의(CLAUDE.md 데이터 접근 규칙):
 * - 피드는 posts 직접 select가 아니라 posts_feed 뷰로 읽는다(익명성 보장).
 * - 프로필은 profiles_public 뷰로 읽는다.
 */

// ─────────────────────────────────────────────────────────────
// 타입 — DB 테이블과 1:1
// ─────────────────────────────────────────────────────────────

export type Category = "헤어" | "패션" | "스킨케어" | "전반";
export type PostType = "normal" | "dday";
export type PostStatus = "open" | "answered" | "closed";
export type ServiceFormat = "chat" | "video";
export type BookingStatus =
  | "requested"
  | "paid_escrow"
  | "in_session"
  | "completed"
  | "refunded"
  | "cancelled";

/** users — 답변·고수는 실명(닉네임)+온도 노출, 질문은 익명 렌더링 */
export type User = {
  id: string;
  nickname: string;
  real_name: string | null;
  is_expert: boolean;
  temperature: number;
  grade: string;
  heart_balance: number;
};

/** posts — author_id는 저장하되 UI에서는 익명으로 렌더링 */
export type Post = {
  id: string;
  author_id: string;
  category: Category;
  post_type: PostType;
  event_date: string | null;
  /** D-day 뱃지에 쓸 라벨. post_type이 'dday'일 때만 채워진다. */
  event_label: string | null;
  body: string;
  status: PostStatus;
  heart_cost: number;
  created_at: string;
  best_comment_id: string | null;
};

export type PostImage = {
  id: string;
  post_id: string;
  url: string | null;
  sort_order: number;
};

export type PollOption = {
  id: string;
  post_id: string;
  label: string;
  image_url: string | null;
  sort_order: number;
  /** votes 테이블 집계 결과 */
  vote_count: number;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  upvotes: number;
  created_at: string;
};

export type HeartTransaction = {
  id: string;
  user_id: string;
  delta: number;
  reason:
    | "signup_bonus"
    | "ad_reward"
    | "purchase"
    | "post_spend"
    | "best_answer_bonus";
  ref_id: string | null;
  balance_after: number;
  created_at: string;
  /** 원장 목록에 보여줄 사람이 읽는 라벨 */
  label: string;
};

export type ExpertService = {
  id: string;
  expert_id: string;
  title: string;
  expertise_area: Category;
  format: ServiceFormat;
  price: number;
  duration_min: number | null;
  is_active: boolean;
  description: string;
};

export type Booking = {
  id: string;
  service_id: string;
  client_id: string;
  expert_id: string;
  status: BookingStatus;
  price: number;
  payment_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  /** 예약 기간 표시용 */
  period_label: string;
};

export type Review = {
  id: string;
  booking_id: string;
  author_nickname: string;
  rating: number;
  body: string;
  created_at: string;
};

export type QuizResult = {
  id: string;
  user_id: string | null;
  quiz_slug: string;
  result_type: string;
  description: string;
  /** 같은 유형 안에서의 상위 % */
  top_percent: number;
  answers: Record<string, number>;
  created_at: string;
  /** 결과 화면의 "첫 베이스 3가지" */
  starters: { title: string; hint: string }[];
};

// ─────────────────────────────────────────────────────────────
// 데이터
// ─────────────────────────────────────────────────────────────

const CURRENT_USER_ID = "u-me";

const users: User[] = [
  {
    id: CURRENT_USER_ID,
    nickname: "준서",
    real_name: "준서",
    is_expert: false,
    temperature: 37.8,
    grade: "성실 답변러",
    heart_balance: 4,
  },
  {
    id: "u-daily",
    nickname: "데일리베이직",
    real_name: null,
    is_expert: false,
    temperature: 37.9,
    grade: "regular",
    heart_balance: 0,
  },
  {
    id: "u-bear",
    nickname: "옷잘입고싶은곰",
    real_name: null,
    is_expert: false,
    temperature: 37.1,
    grade: "regular",
    heart_balance: 0,
  },
  {
    id: "u-minimal",
    nickname: "미니멀준",
    real_name: null,
    is_expert: false,
    temperature: 36.6,
    grade: "newbie",
    heart_balance: 0,
  },
  {
    id: "u-taehyun",
    nickname: "김태현",
    real_name: "김태현",
    is_expert: true,
    temperature: 38.7,
    grade: "마스터",
    heart_balance: 0,
  },
  {
    id: "u-seungwoo",
    nickname: "이승우",
    real_name: "이승우",
    is_expert: true,
    temperature: 38.4,
    grade: "마스터",
    heart_balance: 0,
  },
  {
    id: "u-jihoon",
    nickname: "박지훈",
    real_name: "박지훈",
    is_expert: true,
    temperature: 38.1,
    grade: "마스터",
    heart_balance: 0,
  },
];

const posts: Post[] = [
  {
    id: "0847",
    author_id: "u-someone-1",
    category: "패션",
    post_type: "dday",
    event_date: "2026-08-04",
    event_label: "소개팅 D-3",
    // 첫 줄이 제목, 나머지가 본문. 피드는 첫 줄만 쓴다(splitBody 참고).
    body: "소개팅 3일 남았는데 이 셔츠 무난한가요?\n첫인상 무난하게 가고 싶습니다. A는 화이트 옥스포드, B는 네이비 스트라이프예요. 바지는 둘 다 그레이 슬랙스입니다.",
    status: "open",
    heart_cost: 1,
    created_at: "8분 전",
    best_comment_id: null,
  },
  {
    id: "0846",
    author_id: "u-someone-2",
    category: "헤어",
    post_type: "normal",
    event_date: null,
    event_label: null,
    body: "투블럭 기르는 중인데 옆머리 어디까지 참아야 하나요",
    status: "open",
    heart_cost: 1,
    created_at: "32분 전",
    best_comment_id: null,
  },
  {
    id: "0845",
    author_id: "u-someone-3",
    category: "스킨케어",
    post_type: "normal",
    event_date: null,
    event_label: null,
    body: "지성 피부인데 톤업 선크림 백탁 심한지 봐주실 분",
    status: "open",
    heart_cost: 1,
    created_at: "1시간 전",
    best_comment_id: null,
  },
  {
    // 내가 쓴 글 — 채택 화면(디자인 14번)의 주인공
    id: "0844",
    author_id: CURRENT_USER_ID,
    category: "패션",
    post_type: "dday",
    event_date: "2026-08-02",
    event_label: "면접 D-1",
    body: "내일 면접인데 넥타이 네이비 vs 그레이 뭐가 무난할까요\n첫 대면 면접이라 튀지 않게 가고 싶습니다. 정장은 차콜, 셔츠는 화이트예요.",
    status: "answered",
    heart_cost: 1,
    created_at: "2시간 전",
    best_comment_id: "c-844-1",
  },
  {
    id: "0843",
    author_id: "u-someone-4",
    category: "전반",
    post_type: "normal",
    event_date: null,
    event_label: null,
    body: "키 172인데 와이드 팬츠 입으면 더 작아 보이나요",
    status: "open",
    heart_cost: 1,
    created_at: "3시간 전",
    best_comment_id: null,
  },
];

const postImages: PostImage[] = [
  { id: "img-847-a", post_id: "0847", url: null, sort_order: 0 },
  { id: "img-847-b", post_id: "0847", url: null, sort_order: 1 },
  { id: "img-846-a", post_id: "0846", url: null, sort_order: 0 },
  { id: "img-844-a", post_id: "0844", url: null, sort_order: 0 },
];

const pollOptions: PollOption[] = [
  {
    id: "po-847-a",
    post_id: "0847",
    label: "화이트 옥스포드",
    image_url: null,
    sort_order: 0,
    vote_count: 95,
  },
  {
    id: "po-847-b",
    post_id: "0847",
    label: "네이비 스트라이프",
    image_url: null,
    sort_order: 1,
    vote_count: 47,
  },
  {
    id: "po-846-a",
    post_id: "0846",
    label: "지금 길이 유지",
    image_url: null,
    sort_order: 0,
    vote_count: 111,
  },
  {
    id: "po-846-b",
    post_id: "0846",
    label: "한 번 더 정리",
    image_url: null,
    sort_order: 1,
    vote_count: 45,
  },
  {
    id: "po-844-a",
    post_id: "0844",
    label: "네이비 타이",
    image_url: null,
    sort_order: 0,
    vote_count: 166,
  },
  {
    id: "po-844-b",
    post_id: "0844",
    label: "그레이 타이",
    image_url: null,
    sort_order: 1,
    vote_count: 37,
  },
];

const comments: Comment[] = [
  {
    id: "c-847-best",
    post_id: "0847",
    author_id: "u-daily",
    parent_id: null,
    body: "A요. 소개팅에서 스트라이프는 호불호가 갈립니다. 화이트 옥스포드에 그레이 슬랙스면 깔끔 그 자체예요. 다림질만 확실하게 하세요.",
    upvotes: 48,
    created_at: "5분 전",
  },
  {
    id: "c-847-2",
    post_id: "0847",
    author_id: "u-bear",
    parent_id: null,
    body: "둘 다 나쁘진 않은데 A가 안전빵입니다. B는 두 번째 만남부터.",
    upvotes: 21,
    created_at: "6분 전",
  },
  {
    id: "c-847-3",
    post_id: "0847",
    author_id: "u-minimal",
    parent_id: null,
    body: "셔츠보다 신발이 더 중요해요. 착샷에 신발도 올려주세요.",
    upvotes: 9,
    created_at: "3분 전",
  },
  {
    id: "c-844-1",
    post_id: "0844",
    author_id: "u-daily",
    parent_id: null,
    body: "네이비요. 면접에서 그레이 타이는 자칫 흐려 보입니다. 네이비가 인상도 또렷하고 무난해요. 딤플만 잡으세요.",
    upvotes: 48,
    created_at: "5분 전",
  },
  {
    id: "c-844-2",
    post_id: "0844",
    author_id: "u-bear",
    parent_id: null,
    body: "둘 다 나쁘진 않은데 네이비가 안전빵입니다. 그레이는 두 번째 면접부터.",
    upvotes: 21,
    created_at: "6분 전",
  },
  {
    id: "c-844-3",
    post_id: "0844",
    author_id: "u-minimal",
    parent_id: null,
    body: "타이보다 셔츠 다림질이 더 중요해요. 깃 세우는 것도 확인하세요.",
    upvotes: 9,
    created_at: "3분 전",
  },
];

/** 내가 투표한 poll_option — votes 테이블의 unique(post_id, voter_id) 결과 */
const myVotes: Record<string, string> = {
  "0847": "po-847-a",
};

const heartTransactions: HeartTransaction[] = [
  {
    id: "ht-6",
    user_id: CURRENT_USER_ID,
    delta: -1,
    reason: "post_spend",
    ref_id: "0847",
    balance_after: 4,
    created_at: "8월 1일 09:12",
    label: "질문 등록 · 소개팅 셔츠",
  },
  {
    id: "ht-5",
    user_id: CURRENT_USER_ID,
    delta: 2,
    reason: "ad_reward",
    ref_id: null,
    balance_after: 5,
    created_at: "7월 31일 21:40",
    label: "광고 시청 보상",
  },
  {
    id: "ht-4",
    user_id: CURRENT_USER_ID,
    delta: -1,
    reason: "post_spend",
    ref_id: "0844",
    balance_after: 3,
    created_at: "7월 30일 18:03",
    label: "질문 등록 · 면접 넥타이",
  },
  {
    id: "ht-3",
    user_id: CURRENT_USER_ID,
    delta: 1,
    reason: "best_answer_bonus",
    ref_id: null,
    balance_after: 4,
    created_at: "7월 29일 14:27",
    label: "베스트 답변 보너스",
  },
  {
    id: "ht-2",
    user_id: CURRENT_USER_ID,
    delta: -1,
    reason: "post_spend",
    ref_id: "0846",
    balance_after: 3,
    created_at: "7월 29일 08:55",
    label: "질문 등록 · 투블럭 옆머리",
  },
  {
    id: "ht-1",
    user_id: CURRENT_USER_ID,
    delta: 5,
    reason: "signup_bonus",
    ref_id: null,
    balance_after: 5,
    created_at: "7월 28일 22:10",
    label: "가입 보너스",
  },
];

const expertServices: ExpertService[] = [
  {
    id: "svc-taehyun-chat",
    expert_id: "u-taehyun",
    title: "채팅 상담",
    expertise_area: "헤어",
    format: "chat",
    price: 9900,
    duration_min: null,
    is_active: true,
    description: "사진 보내고 질문 무제한 · 24시간 내 답변",
  },
  {
    id: "svc-taehyun-video",
    expert_id: "u-taehyun",
    title: "화상 상담",
    expertise_area: "헤어",
    format: "video",
    price: 29000,
    duration_min: 30,
    is_active: true,
    description: "실시간 30분 · 거울 보며 바로 피드백",
  },
  {
    id: "svc-seungwoo-chat",
    expert_id: "u-seungwoo",
    title: "채팅 상담",
    expertise_area: "패션",
    format: "chat",
    price: 12000,
    duration_min: null,
    is_active: true,
    description: "옷장 사진 보내면 조합까지 잡아드려요",
  },
  {
    id: "svc-jihoon-chat",
    expert_id: "u-jihoon",
    title: "채팅 상담",
    expertise_area: "스킨케어",
    format: "chat",
    price: 9900,
    duration_min: null,
    is_active: true,
    description: "피부 타입 진단 + 제품 추천",
  },
];

/** 고수 카드에 붙는 활동 지표 — 실제로는 comments/reputation_events 집계 */
const expertStats: Record<string, { answers: number; best: number; bio: string; top_percent: number }> = {
  "u-taehyun": {
    answers: 132,
    best: 41,
    bio: "미용실 원장 8년차. 두상·모질 보고 어울리는 컷을 정확히 짚어드립니다.",
    top_percent: 2,
  },
  "u-seungwoo": {
    answers: 98,
    best: 27,
    bio: "남성복 바이어 6년차. 체형별로 실패 없는 핏을 잡아드려요.",
    top_percent: 4,
  },
  "u-jihoon": {
    answers: 76,
    best: 19,
    bio: "피부과 상담실장. 예민한 피부도 무너지지 않는 루틴을 짭니다.",
    top_percent: 6,
  },
};

const bookings: Booking[] = [
  {
    id: "bk-1",
    service_id: "svc-taehyun-chat",
    client_id: CURRENT_USER_ID,
    expert_id: "u-taehyun",
    status: "completed",
    price: 9900,
    payment_id: "test_pay_0001",
    scheduled_at: null,
    created_at: "7월 30일",
    period_label: "7/30 ~ 8/1",
  },
  {
    id: "bk-2",
    service_id: "svc-taehyun-chat",
    client_id: CURRENT_USER_ID,
    expert_id: "u-taehyun",
    status: "requested",
    price: 9900,
    payment_id: null,
    scheduled_at: null,
    created_at: "8월 1일",
    period_label: "8/1",
  },
];

const reviews: Review[] = [
  {
    id: "rv-1",
    booking_id: "bk-past-1",
    author_nickname: "옷잘입고싶은곰",
    rating: 5,
    body: "얼굴형 보고 컷 추천해주는데 미용실에서 그대로 보여줬더니 인생머리 됐습니다.",
    created_at: "3일 전",
  },
  {
    id: "rv-2",
    booking_id: "bk-past-2",
    author_nickname: "미니멀준",
    rating: 4,
    body: "답변이 구체적이에요. 모질까지 물어보고 왁스 제품명까지 찍어줌.",
    created_at: "1주 전",
  },
];

const quizResults: QuizResult[] = [
  {
    id: "qr-1",
    user_id: CURRENT_USER_ID,
    quiz_slug: "base-level",
    result_type: "각성 직전형",
    description:
      "관심은 생겼는데 아직 손이 안 가는 단계.\n딱 베이스만 잡으면 확 달라져요",
    top_percent: 34,
    answers: { q1: 2, q2: 1, q3: 3, q4: 2, q5: 2, q6: 1, q7: 3, q8: 2 },
    created_at: "8월 1일",
    starters: [
      { title: "눈썹 정리", hint: "5분 투자" },
      { title: "기본 스킨케어", hint: "토너 + 로션" },
      { title: "무지티 핏 잡기", hint: "어깨선 기준" },
    ],
  },
];

/** 유형테스트 문항 — quiz_results.answers의 키와 대응 */
export const quizQuestions = [
  { key: "q1", text: "아침에 거울 보고\n옷을 두 번 이상 갈아입는다" },
  { key: "q2", text: "머리 자를 때\n원하는 스타일을 말할 수 있다" },
  { key: "q3", text: "아침에 거울 보고\n머리를 만진다" },
  { key: "q4", text: "세수 후에\n바르는 게 하나라도 있다" },
  { key: "q5", text: "옷 살 때\n사이즈를 재고 산다" },
  { key: "q6", text: "눈썹을\n정리해 본 적 있다" },
  { key: "q7", text: "약속 전날\n입을 옷을 미리 정한다" },
  { key: "q8", text: "내 체형의 장단점을\n설명할 수 있다" },
];

export const quizChoices = ["전혀 아니다", "가끔 한다", "매일 한다"];

export const categories: Category[] = ["헤어", "패션", "스킨케어", "전반"];

// ─────────────────────────────────────────────────────────────
// 조회 함수 — 화면은 전부 여기만 호출한다.
// Supabase로 갈아탈 때 이 함수들의 본문만 교체하면 된다.
// ─────────────────────────────────────────────────────────────

/** posts.body의 첫 줄을 제목으로, 나머지를 본문으로 쪼갠다. */
export function splitBody(body: string): { title: string; detail: string | null } {
  const [title, ...rest] = body.split("\n");
  const detail = rest.join("\n").trim();
  return { title, detail: detail || null };
}

export function getCurrentUser(): User {
  return users.find((u) => u.id === CURRENT_USER_ID)!;
}

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

/** 피드 한 줄에 필요한 것만 조립 (실제로는 posts_feed 뷰) */
export type FeedItem = Post & {
  comment_count: number;
  vote_count: number;
  has_image: boolean;
  /** 1위 선택지 득표율. 투표가 없으면 null */
  leading_percent: number | null;
};

export function getFeed(category?: Category): FeedItem[] {
  return posts
    .filter((p) => !category || p.category === category)
    .map((p) => {
      const options = pollOptions.filter((o) => o.post_id === p.id);
      const total = options.reduce((sum, o) => sum + o.vote_count, 0);
      const top = Math.max(0, ...options.map((o) => o.vote_count));
      return {
        ...p,
        comment_count: comments.filter((c) => c.post_id === p.id).length,
        vote_count: total,
        has_image: postImages.some((i) => i.post_id === p.id),
        leading_percent: total > 0 ? Math.round((top / total) * 100) : null,
      };
    });
}

export function getFeedCount(): number {
  return 128;
}

export type PostDetail = {
  post: Post;
  images: PostImage[];
  options: PollOption[];
  total_votes: number;
  /** 내가 투표한 poll_option_id. 아직 투표 안 했으면 null */
  my_vote_option_id: string | null;
  is_mine: boolean;
  comments: (Comment & { author: User; is_best: boolean })[];
};

export function getPost(id: string): PostDetail | null {
  const post = posts.find((p) => p.id === id);
  if (!post) return null;

  const options = pollOptions
    .filter((o) => o.post_id === id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    post,
    images: postImages.filter((i) => i.post_id === id),
    options,
    total_votes: options.reduce((sum, o) => sum + o.vote_count, 0),
    my_vote_option_id: myVotes[id] ?? null,
    is_mine: post.author_id === CURRENT_USER_ID,
    comments: comments
      .filter((c) => c.post_id === id)
      .map((c) => ({
        ...c,
        author: getUser(c.author_id)!,
        is_best: post.best_comment_id === c.id,
      }))
      // 베스트 답변을 맨 위로
      .sort((a, b) => Number(b.is_best) - Number(a.is_best)),
  };
}

export function getPostIds(): string[] {
  return posts.map((p) => p.id);
}

export function getHeartTransactions(): HeartTransaction[] {
  return heartTransactions;
}

/** 마이 프로필의 "내 활동" 집계 — 실제로는 comments/reputation_events 집계 */
export function getMyActivity() {
  return { answers: 89, upvotes_received: 312, best_answers: 7, top_percent: 12 };
}

export type ExpertListItem = User & {
  expertise_area: Category;
  from_price: number;
  answers: number;
  best: number;
};

export function getExperts(): ExpertListItem[] {
  return users
    .filter((u) => u.is_expert)
    .map((u) => {
      const svcs = expertServices.filter((s) => s.expert_id === u.id && s.is_active);
      return {
        ...u,
        expertise_area: svcs[0]?.expertise_area ?? "전반",
        from_price: Math.min(...svcs.map((s) => s.price)),
        answers: expertStats[u.id].answers,
        best: expertStats[u.id].best,
      };
    })
    .sort((a, b) => b.temperature - a.temperature);
}

export type ExpertDetail = {
  expert: User;
  bio: string;
  top_percent: number;
  services: ExpertService[];
  reviews: Review[];
  review_count: number;
};

export function getExpert(id: string): ExpertDetail | null {
  const expert = users.find((u) => u.id === id && u.is_expert);
  if (!expert) return null;
  const stats = expertStats[id];
  return {
    expert,
    bio: stats.bio,
    top_percent: stats.top_percent,
    services: expertServices.filter((s) => s.expert_id === id && s.is_active),
    reviews,
    review_count: 28,
  };
}

export function getExpertIds(): string[] {
  return users.filter((u) => u.is_expert).map((u) => u.id);
}

export type BookingDetail = {
  booking: Booking;
  expert: User;
  service: ExpertService;
};

export function getBooking(id: string): BookingDetail | null {
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return null;
  return {
    booking,
    expert: getUser(booking.expert_id)!,
    service: expertServices.find((s) => s.id === booking.service_id)!,
  };
}

export function getBookingIds(): string[] {
  return bookings.map((b) => b.id);
}

export function getQuizResult(id: string): QuizResult | null {
  return quizResults.find((r) => r.id === id) ?? null;
}

export function getQuizResultIds(): string[] {
  return quizResults.map((r) => r.id);
}

/** 테스트 인트로에 쓰는 참여자 수 */
export function getQuizTakerCount(): number {
  return 1247;
}
