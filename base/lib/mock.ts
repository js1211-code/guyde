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

/**
 * 본문 삽화. has_image가 켜진 문단에 이 사진이 붙는다.
 *
 * 표지를 다시 쓰지 않는다 — 같은 사진이 한 화면에 두 번 나오면 글이 짧아
 * 보인다. 검정·흰 반팔이 겹쳐 개어진 컷이라 "무채색 두세 벌 로테이션"
 * 문단과 내용이 맞물린다.
 */
export const ARTICLE_FIGURE = {
  url: "https://images.unsplash.com/photo-1716541425064-b07b68f436de?auto=format&fit=crop&crop=entropy&w=900&h=600&q=70",
  by: "TuanAnh Blue",
} as const;

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
  /**
   * 제목만 있고 본문이 없는 글. 목록에는 나오지만 열 수 없다.
   * getArticle()·getArticleIds()가 걸러내므로 주소를 직접 쳐도 404다 —
   * 화면에서만 막으면 빈 글이 열린다.
   */
  coming_soon?: boolean;
};

const articles: Article[] = [
  // ══════════════════════════════════════════════════════════
  // 발행된 글 3편
  //
  // 짧게 여러 편 두는 대신 길게 세 편을 뒀다. 서너 줄짜리 글이 일곱 편
  // 있으면 목록은 꽉 차 보여도 하나를 열어보는 순간 빈다 — 도서관은
  // 목록을 훑는 곳이 아니라 하나를 붙잡고 읽는 곳이다.
  // ══════════════════════════════════════════════════════════
  {
    id: "a-laundry",
    cover_url:
      "https://images.unsplash.com/photo-1622473590925-e3616c0a41bf?auto=format&fit=crop&crop=entropy&w=900&h=600&q=70",
    cover_by: "Raychan",
    title: "여름 빨래에서 냄새가 나는 건 세제 탓이 아니다",
    lead: "같은 옷을 같은 세제로 빨았는데 겨울엔 괜찮고 여름엔 쉰내가 난다. 세제를 바꾸기 전에 볼 게 네 가지 있다.",
    category: "자유",
    read_minutes: 6,
    is_hero: true,
    published_at: "2026.08.05",
    sections: [
      {
        heading: "냄새의 정체는 덜 마른 물이다",
        body: "쉰내는 세균이 만든다. 정확히는 옷에 남은 물기에서 번식한 세균이 만드는 대사산물이다. 그래서 이 문제는 무엇으로 빨았느냐가 아니라 얼마나 빨리 말랐느냐로 갈린다.\n\n여름이 겨울보다 나쁜 이유가 여기 있다. 기온이 높아 세균이 빨리 늘어나는데, 습도까지 높아서 마르는 속도는 오히려 느리다. 겨울엔 하루 널어두면 마르던 게 여름 장마철엔 이틀이 걸린다. 그 이틀 동안 옷은 젖은 채로 따뜻하게 방치된다.\n\n세제를 바꿔서 해결되는 경우가 드문 것도 같은 이유다. 세제는 빨래가 끝나는 시점까지만 일하고, 냄새는 그 뒤에 생긴다.",
        has_image: true,
      },
      {
        heading: "1. 세탁이 끝나면 30분 안에 꺼낸다",
        body: "가장 크고 가장 자주 어기는 규칙이다. 세탁이 끝난 통 안은 물기와 온기가 가득한 밀폐 공간이다. 세균이 늘어나기에 이보다 좋은 조건이 없다.\n\n30분이 기준인 이유는 그쯤부터 냄새가 옷에 배기 시작해서다. 한 번 밴 냄새는 다시 빨아도 잘 안 빠진다. 섬유 안쪽까지 들어간 상태라 표면을 씻는 것으로는 닿지 않는다.\n\n밤에 돌려놓고 자는 습관이 있다면 예약 세탁으로 바꾸는 걸 권한다. 일어나는 시간에 맞춰 끝나게 해두면 이 규칙 하나로 절반은 해결된다.",
      },
      {
        heading: "2. 건조기가 없으면 바람이라도 만든다",
        body: "여름 실내 자연 건조는 사실상 안 마른다고 보는 게 맞다. 습도가 70%를 넘으면 공기가 더 이상 물을 가져가지 못한다. 창문을 열어두는 것만으로는 부족하다.\n\n선풍기를 빨래 쪽으로 돌려놓는 것만으로도 건조 시간이 절반 가까이 줄어든다. 바람이 젖은 표면의 습한 공기층을 계속 걷어내기 때문이다. 제습기가 있으면 더 좋지만, 없으면 선풍기 한 대가 세제 바꾸는 것보다 훨씬 큰 차이를 만든다.\n\n널 때 간격도 중요하다. 옷끼리 붙어 있으면 그 사이는 마르지 않는다. 손바닥 하나가 들어갈 만큼은 띄운다.",
      },
      {
        heading: "3. 섬유유연제를 늘리는 건 역효과다",
        body: "냄새가 나니까 향으로 덮으려고 섬유유연제를 더 넣는 경우가 많은데, 이건 상황을 나쁘게 만든다.\n\n섬유유연제는 섬유 표면에 얇은 막을 남겨서 부드럽게 만드는 물건이다. 그 막이 두꺼워지면 물이 잘 통과하지 못해서 다음 세탁에서 헹굼이 덜 된다. 덜 헹궈진 잔여물은 그 자체로 세균의 먹이가 된다.\n\n권장량의 절반만 써도 대부분 충분하다. 수건은 아예 안 쓰는 게 낫다 — 막이 생기면 물을 안 먹어서 수건 구실을 못 한다.",
      },
      {
        heading: "4. 한 달에 한 번은 세탁기를 빤다",
        body: "위 세 가지를 다 지켰는데도 냄새가 난다면 원인은 옷이 아니라 세탁기다.\n\n통과 외벽 사이 틈에는 세제 찌꺼기와 물때가 계속 쌓인다. 눈에 보이는 안쪽은 깨끗해도 그 뒤는 아니다. 여기서 자란 것이 매 세탁마다 옷에 옮겨붙는다.\n\n전용 세정제를 넣고 통세척 코스를 한 번 돌리면 된다. 없으면 과탄산소다 한 컵을 넣고 온수 최고 온도로 빈 세탁을 돌려도 비슷한 효과가 난다. 끝나고 문은 열어둔다. 닫아두면 안쪽이 계속 젖어 있다.\n\n순서를 정리하면 이렇다. 바로 꺼내기 → 바람 만들기 → 유연제 줄이기 → 한 달에 한 번 통세척. 세제 바꾸기는 이 넷을 다 하고 나서 생각해도 늦지 않다.",
      },
    ],
    related: ["자취방 여름 빨래 냄새 잡는 법 정리해봄"],
  },
  {
    id: "a-sunscreen",
    cover_url:
      "https://images.unsplash.com/photo-1623676714504-edd78728155e?auto=format&fit=crop&crop=entropy&w=900&h=600&q=70",
    cover_by: "Onela Ymeri",
    title: '"남자가 무슨 선크림이야?" 에 대한 대답',
    lead: "미용 얘기가 아니라 손상 얘기다. 바르기 싫은 이유를 하나씩 짚었다.",
    category: "스킨케어",
    read_minutes: 7,
    is_hero: false,
    published_at: "2026.08.03",
    sections: [
      {
        heading: "이건 관리가 아니라 손상 얘기다",
        body: "선크림을 꾸미는 물건으로 알고 있으면 안 바르는 게 당연하다. 그런데 자외선이 하는 일은 피부를 예쁘지 않게 만드는 게 아니라 망가뜨리는 쪽에 가깝다.\n\n자외선A는 진피까지 들어가 콜라겐을 끊는다. 이게 쌓이면 주름과 처짐이 된다. 자외선B는 표피에서 화상을 만든다. 여름에 등이 벗겨지는 게 그거다. 둘 다 되돌아오지 않는다 — 피부는 끊어진 콜라겐을 원래대로 복구하지 못한다.\n\n피부과에서 노화의 8할이 자외선이라고 말하는 건 과장이 아니다. 평생 햇빛을 덜 받은 부위와 많이 받은 부위를 비교해보면 차이가 눈에 보인다.",
        has_image: true,
      },
      {
        heading: "\"번거롭다\" — 30초면 끝난다",
        body: "얼굴 전체에 필요한 양은 손가락 두 마디 길이만큼이다. 이마·양볼·코·턱 다섯 군데에 점 찍듯 올리고 펴 바르면 된다. 문지르지 말고 두드리듯 펴는 게 요령이다.\n\n습관으로 만드는 방법은 하나뿐이다. 이미 하고 있는 행동 바로 뒤에 붙이는 것. 세수하고 로션 바르는 자리 옆에 선크림을 같이 두면 손이 자동으로 간다. 서랍에 넣어두면 백 퍼센트 잊는다.\n\n출근길에 바르겠다고 가방에 넣어두는 건 잘 안 통한다. 나가는 길에 여유가 있는 사람은 드물다.",
      },
      {
        heading: "\"하얗게 뜬다\" — 제품 문제가 맞다",
        body: "이건 핑계가 아니라 실제 문제다. 다만 선크림 전체의 문제가 아니라 종류의 문제다.\n\n무기자차는 티타늄디옥사이드·징크옥사이드 같은 흰 가루로 자외선을 튕겨낸다. 흰 가루라서 하얗게 뜬다. 유기자차는 자외선을 흡수해서 열로 바꾸는 방식이라 백탁이 거의 없다. 대신 눈이 시린 경우가 있다.\n\n제품을 고를 때 성분표에서 티타늄디옥사이드와 징크옥사이드를 찾아보면 된다. 없으면 유기자차다. 그리고 톤업이라고 적힌 제품은 백탁이 부작용이 아니라 기능이다 — 아무리 잘 발라도 안 없어지니 이건 피한다.\n\n바르는 법으로도 줄일 수 있다. 한 번에 두껍게 바르지 말고 점 찍어 올린 뒤 30초 두었다가 두드려 펴면 훨씬 덜하다.",
      },
      {
        heading: "\"끈적인다\" — 제형을 바꾼다",
        body: "크림 타입만 써보고 포기한 경우가 많다. 지성 피부라면 처음부터 다른 제형으로 가는 게 맞다.\n\n젤이나 에센스 타입은 훨씬 가볍고 흡수가 빠르다. 무광 마무리라고 적힌 제품은 바르고 나서 번들거림이 덜하다. 스틱 타입은 손에 안 묻어서 덧바를 때 편하지만, 얼굴 전체를 이걸로만 채우려면 양이 부족해지기 쉽다.\n\n덧바르기는 실내에 계속 있는 날이면 굳이 안 해도 된다. 바깥에 오래 있거나 땀을 많이 흘린 날만 신경 쓰면 충분하다.",
      },
      {
        heading: "숫자는 이 정도만 알면 된다",
        body: "SPF는 자외선B를, PA는 자외선A를 막는 정도다. SPF50과 SPF30의 차단율 차이는 생각보다 작다 — 각각 98%와 97% 수준이다.\n\n그래서 높은 숫자를 찾아다니는 것보다 충분한 양을 바르는 게 훨씬 중요하다. SPF50 제품을 절반만 바르면 실제로는 SPF20 정도밖에 안 된다. 표기된 숫자는 정량을 발랐을 때 기준이다.\n\n출퇴근 위주라면 SPF30 PA+++ 정도면 충분하고, 야외 활동이 긴 날만 SPF50으로 올리면 된다. 매일 바르는 게 목적이니 바르기 싫지 않은 제품이 제일 좋은 제품이다.",
      },
    ],
    related: ["선크림 이거 백탁 심한가요?", "선크림 매일 바르는 사람 있음?"],
  },
  {
    id: "a-table",
    cover_url:
      "https://images.unsplash.com/photo-1785119774026-b6066d7835f5?auto=format&fit=crop&crop=entropy&w=900&h=600&q=70",
    cover_by: "Erik Mclean",
    title: "밥 먹는 자리에서 감점당하지 않는 법",
    lead: "고급 레스토랑 매너가 아니라, 소개팅·상견례·회식에서 상대가 실제로 보는 것들.",
    category: "자유",
    read_minutes: 6,
    is_hero: false,
    published_at: "2026.08.01",
    sections: [
      {
        heading: "가점이 아니라 감점의 문제다",
        body: "밥 먹는 자리에서 매너로 점수를 따는 일은 거의 없다. 반대로 잃는 일은 흔하다. 그래서 목표는 우아해 보이는 게 아니라 걸리는 데가 없는 것이다.\n\n식사 자리가 유독 인상에 오래 남는 이유가 있다. 한 시간 넘게 마주 앉아 있고, 그동안 상대는 딱히 볼 게 없어서 계속 이쪽을 본다. 옷은 처음 3분이면 판단이 끝나는데 식사 습관은 한 시간 내내 노출된다.",
        has_image: true,
      },
      {
        heading: "소리 — 가장 크게 걸리는 지점",
        body: "쩝쩝 소리, 후루룩 소리, 그릇에 수저 부딪히는 소리. 이 셋이 압도적이다. 본인은 거의 못 듣는다는 게 문제다.\n\n입을 다물고 씹는 것 하나로 대부분 해결된다. 의식하면 어색하니 밥 한 술에 한 번만 확인하는 식으로 시작하면 된다. 뜨거운 국물은 식혀서 먹는다 — 후루룩 소리는 뜨거워서 나는 거라 온도를 낮추면 저절로 사라진다.\n\n말하면서 먹지 않는 것도 같은 얘기다. 입에 든 게 보이면 그 장면이 남는다. 질문을 받았으면 씹던 걸 삼키고 답해도 늦지 않다. 오히려 그 짧은 정적이 신중해 보인다.",
      },
      {
        heading: "속도 — 상대에게 맞춘다",
        body: "혼자 먼저 다 먹고 앉아 있으면 상대가 급해진다. 반대로 혼자 너무 느리면 상대가 기다리게 된다. 둘 다 상대를 불편하게 만든다.\n\n기준은 간단하다. 상대 그릇을 한 번씩 보고 비슷하게 맞춘다. 빨리 먹는 편이라면 중간에 물을 마시거나 질문을 하나 던져서 속도를 늦춘다.\n\n다 먹고 나서 수저를 상 위에 그냥 내려놓지 않는다. 그릇에 걸치거나 받침에 올린다. 이건 사소한데 안 하면 눈에 띈다.",
      },
      {
        heading: "덜어 먹는 자리에서",
        body: "같이 먹는 음식이 나오면 규칙이 하나 늘어난다. 본인 젓가락을 공용 그릇에 넣지 않는 것.\n\n앞접시와 공용 집게가 있으면 그걸 쓴다. 없으면 요청해도 된다 — 이걸 요청하는 게 오히려 좋은 인상으로 남는다. 상견례처럼 어른이 있는 자리에서는 특히 그렇다.\n\n먼저 덜어서 상대에게 건네는 것도 좋지만 과하면 부담이 된다. 처음 한 번만 하고 그 뒤엔 각자 두는 게 자연스럽다.",
      },
      {
        heading: "자리와 계산",
        body: "어른이 있는 자리라면 안쪽 자리를 양보한다. 출입구에서 먼 쪽이 상석이다. 이건 모르면 그냥 늦게 앉으면 해결된다 — 남는 자리에 앉으면 된다.\n\n계산은 미리 정해두는 게 제일 깔끔하다. 소개팅이라면 계산대 앞에서 실랑이하는 그림이 제일 안 좋다. 먼저 일어나서 조용히 계산하거나, 나눠 내기로 미리 말해두거나 둘 중 하나다.\n\n정리하면 소리·속도·공용 젓가락 세 가지다. 나머지는 몰라도 티가 잘 안 난다.",
      },
    ],
    related: [],
  },

  // ══════════════════════════════════════════════════════════
  // 준비중
  //
  // 왜 빈 껍데기를 목록에 두나 — 도서관이 세 편만 있으면 "이게 다인가"가
  // 되고, 가짜 본문을 채워 넣으면 열어본 사람이 속는다. 제목만 두고
  // 준비중이라고 밝히면 무엇을 다루는 곳인지는 전해지면서 거짓말은 안 된다.
  //
  // `coming_soon`이 켜진 글은 목록에서 누를 수 없고 상세 주소도 안 만든다
  // (getArticle/getArticleIds가 걸러낸다). 켜둔 채 sections를 채워도
  // 화면에 안 나오므로, 발행할 땐 이 플래그부터 지운다.
  // ══════════════════════════════════════════════════════════
  ...([
    ["a-soon-shorts", "옷", "반바지 기장, 무릎 위 몇 cm까지가 안전한가"],
    ["a-soon-sandal", "옷", "남자 샌들이 아저씨처럼 보이는 진짜 이유"],
    ["a-soon-size", "옷", "쇼핑몰 사이즈표 읽는 법 — 숫자 네 개만 안다면"],
    ["a-soon-white", "옷", "흰 티가 비치는 기준은 원단 중량 200g"],
    ["a-soon-haircut", "헤어", "미용실에서 말이 통하는 세 가지 표현"],
    ["a-soon-wax", "헤어", "왁스가 떡지는 건 양이 아니라 순서 문제다"],
    ["a-soon-sweat", "바디&향수", "땀 냄새와 향수가 섞이면 생기는 일"],
    ["a-soon-deo", "바디&향수", "데오드란트 스틱과 롤온, 뭐가 다른가"],
    ["a-soon-summer", "바디&향수", "여름에 향수를 피부에 안 뿌리는 방법"],
    ["a-soon-acne", "스킨케어", "이마에만 올라오는 여드름은 세안 문제가 아니다"],
    ["a-soon-toner", "스킨케어", "토너를 꼭 써야 하는가 — 경우를 나눠봤다"],
    ["a-soon-closet", "자유", "옷장에 검정 티가 여섯 장 있는 이유"],
  ] as const).map(([id, category, title]) => ({
    id,
    cover_url: "",
    cover_by: "",
    title,
    lead: "",
    category: category as Category,
    read_minutes: 0,
    is_hero: false,
    published_at: "",
    sections: [],
    related: [],
    coming_soon: true,
  })),
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
// 준비중 글은 본문이 없다. 상세로 들어오면 404가 나야 한다 —
// 빈 글이 열리는 것보다 없는 편이 낫다.
export const getArticle = (id: string) =>
  articles.find((a) => a.id === id && !a.coming_soon) ?? null;
export const getArticleIds = () =>
  articles.filter((a) => !a.coming_soon).map((a) => a.id);

export const getQuizzes = () => quizzes;
export const getQuiz = (slug: string) => quizzes.find((q) => q.slug === slug) ?? null;
export const getQuizResults = (slug: string) => quizResults[slug] ?? null;
export const getQuizSlugs = () => Object.keys(quizResults);
