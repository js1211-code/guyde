import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
  stripDevice,
} from "@/lib/api/http";

// 목록을 여기서 또 정의하면 카테고리를 추가할 때 한쪽만 고쳐서
// "탭은 생겼는데 저장은 거부"가 된다. 항상 lib/constants.ts 한 곳에서 가져온다.
import { CATEGORIES, POST_TYPES, type Category, type PostType } from "@/lib/constants";

/**
 * F-11·12·13 피드 조회
 * - ?category=옷        → 카테고리 탭
 * - ?post_type=무난함판정 → 무난무난 탭 (카테고리를 가로지른다)
 * - ?sort=reactions     → 반응 많은 순 (도서관의 정보공유 서가)
 * - ?min_nanhan=60      → 무난함 60% 이상만 (도서관의 무난템 서가)
 * - ?closed=true        → 종료된 투표만
 * - ?min_votes=10       → 표가 이만큼 이상 모인 글만
 * - ?q=후드            → 제목·본문 검색
 *
 * 피드의 정렬은 최신순 고정이다(F-13). sort는 도서관용으로 열어둔 것 —
 * 도서관은 흐름을 보는 곳이 아니라 쓸 만한 걸 찾는 곳이라 최신순이 맞지 않는다.
 * 집계는 posts_feed 뷰가 한 번에 준다(N+1 방지).
 */
export async function GET(req: Request) {
  const viewer = getDeviceId(req); // 없어도 된다 — 읽기는 열려 있다
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const postType = url.searchParams.get("post_type");
  const sort = url.searchParams.get("sort");
  const minNanhan = url.searchParams.get("min_nanhan");
  const q = url.searchParams.get("q")?.trim() ?? "";
  const closedOnly = url.searchParams.get("closed") === "true";
  const minVotes = url.searchParams.get("min_votes");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  if (category && !CATEGORIES.includes(category as Category)) {
    return fail("INVALID_CATEGORY", 400);
  }
  if (postType && !POST_TYPES.includes(postType as PostType)) {
    return fail("INVALID_POST_TYPE", 400);
  }

  if (sort && sort !== "latest" && sort !== "reactions") {
    return fail("INVALID_SORT", 400);
  }

  const db = createAdminClient();
  let query = db.from("posts_feed").select("*");

  // reaction_count는 뷰가 계산해 주는 컬럼이라 그대로 정렬에 쓸 수 있다.
  // 같은 수면 최신 글이 위로 — 안 그러면 순서가 매 요청마다 흔들린다.
  if (sort === "reactions") {
    query = query.order("reaction_count", { ascending: false });
  }
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (postType) query = query.eq("post_type", postType);
  // 0표라 판정이 없는 글은 nanhan_percent가 null이다. gte는 null을 걸러내므로
  // "아직 판정 안 난 글"이 무난템에 섞이지 않는다.
  if (minNanhan) query = query.gte("nanhan_percent", Number(minNanhan));

  /*
    무난템 서가가 쓰는 두 조건.

    종료: 아직 표가 들어오는 중인 글을 "무난한 것"으로 실으면, 다음에 봤을 때
    숫자가 달라져 있다. 결론이 난 글만 싣는다.

    표 수: 2표 중 2표가 무난해요면 100%지만 그건 대중의 판정이 아니다.
    %만 보면 표가 적을수록 극단값이 나와서 오히려 위로 올라온다.
  */
  if (closedOnly) query = query.eq("is_closed", true);
  if (minVotes) query = query.gte("reaction_count", Number(minVotes));

  // 검색 — 제목과 본문 둘 다 본다. 제목만 보면 "그 글 본문에 있었는데"가
  // 안 찾아지고, 이 앱의 글은 제목이 짧아서 정보 대부분이 본문에 있다.
  if (q) {
    const term = escapeForFilter(q);
    // 걸러내고 나면 아무것도 안 남는 검색어가 있다("%"처럼). 그때 필터를
    // 건너뛰면 전체 목록이 나오는데, 뭔가 입력했는데 전부 나오면 검색이 아니다.
    if (!term) return ok({ items: [] });
    query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) return fail("DB_ERROR", 500, error.message);

  const rows = data ?? [];

  /*
    무난함 %는 결과다. 상세에서 감춰놓고 목록 배지에 그대로 띄우면 감춘 게
    아무 의미가 없다 — 판정하지 않고도 카드만 보면 다 알 수 있다.

    그래서 여기서도 같은 규칙을 쓴다: 종료됐거나 내가 판정한 글만 %를 준다.
    내가 뭘 판정했는지는 한 번에 몰아서 물어본다(글마다 물으면 N+1이다).
  */
  const judged = new Set<string>();
  const judgeIds = rows
    .filter((r) => r.post_type === "무난함판정" && !r.is_closed)
    .map((r) => r.id);

  if (viewer && judgeIds.length) {
    const { data: mine } = await db
      .from("nanhan_votes")
      .select("post_id")
      .eq("device_id", viewer)
      .in("post_id", judgeIds);
    for (const v of mine ?? []) judged.add(v.post_id);
  }

  /*
    투표글의 선택지 사진.

    posts_feed의 thumbnail_url은 post_images만 본다. 그런데 투표글은 본문
    사진칸이 없고 사진이 poll_options.image_url에 붙으므로, 목록에서 사진이
    통째로 안 보였다 — A/B로 물어보는 글인데 정작 뭘 고르는지가 안 보인다.

    여기서도 한 번에 몰아서 가져온다(글마다 물으면 N+1). 순서는 sort_order를
    따른다 — 첫 장이 1번 선택지여야 카드와 상세가 같은 순서로 읽힌다.
  */
  const optionImages = new Map<string, string[]>();
  const pollIds = rows.filter((r) => r.post_type === "선택지투표").map((r) => r.id);

  if (pollIds.length) {
    const { data: opts } = await db
      .from("poll_options")
      .select("post_id, image_url, sort_order")
      .in("post_id", pollIds)
      .not("image_url", "is", null)
      .order("sort_order");
    for (const o of opts ?? []) {
      const list = optionImages.get(o.post_id) ?? [];
      list.push(o.image_url as string);
      optionImages.set(o.post_id, list);
    }
  }

  return ok({
    items: rows.map((row) => {
      const hide =
        row.post_type === "무난함판정" &&
        !row.is_closed &&
        !judged.has(row.id);
      const withPhotos = {
        ...row,
        option_images: optionImages.get(row.id) ?? [],
      };
      return stripDevice(
        hide ? { ...withPhotos, nanhan_percent: null } : withPhotos,
        viewer,
      );
    }),
  });
}

/**
 * PostgREST의 or 필터는 값에 쉼표·괄호가 들어가면 문법이 깨진다.
 * "후드,셔츠"를 그대로 넣으면 조건이 하나 더 있는 것으로 파싱된다.
 * %와 _는 ilike의 와일드카드라 그대로 두면 아무 글이나 걸린다.
 *
 * 걸러내는 쪽을 택했다 — 이스케이프 규칙을 흉내 내다 틀리면 조용히 엉뚱한
 * 결과가 나오는데, 검색어에서 이 문자들을 빼도 사람이 찾으려던 말은 남는다.
 * 길이도 자른다. 긴 문자열은 인덱스 없이 훑는 비용만 키운다.
 */
function escapeForFilter(raw: string): string {
  return raw.replace(/[,()%_"\\*]/g, " ").trim().slice(0, 40);
}

/**
 * F-20~24 글 작성
 * 글 insert + 선택지 insert가 create_post 안에서 한 트랜잭션이다.
 * 하트는 폐기했다(patch_v3_3) — 답을 받으러 온 사람 앞에 관문을 두지 않는다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let body: {
    category?: string;
    post_type?: string;
    title?: string;
    body?: string;
    options?: string[];
    /** 선택지와 나란한 배열. 사진을 안 고른 자리는 null. */
    option_images?: (string | null)[];
    image_urls?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (!CATEGORIES.includes(body.category as Category)) {
    return fail("INVALID_CATEGORY", 400, "카테고리를 선택해주세요");
  }
  if (!POST_TYPES.includes(body.post_type as PostType)) {
    return fail("INVALID_POST_TYPE", 400, "글 유형을 선택해주세요");
  }
  if (!body.title?.trim()) return fail("TITLE_REQUIRED", 400);
  if (!body.body?.trim()) return fail("BODY_REQUIRED", 400);

  // filter(Boolean)로 빈 칸을 걷어내므로, 사진 배열도 **같은 자리**를 걷어내야
  // 짝이 어긋나지 않는다. 인덱스를 살려둔 채 함께 거른다.
  const kept = (body.options ?? [])
    .map((o, i) => ({ text: o.trim(), image: body.option_images?.[i] ?? null }))
    .filter((o) => o.text.length > 0);

  const options = kept.length ? kept.map((o) => o.text) : null;
  // 아무 선택지에도 사진이 없으면 배열을 통째로 보내지 않는다 —
  // null만 든 배열을 넘기면 DB가 길이 검사만 한 번 더 할 뿐이다.
  const optionImages =
    options && kept.some((o) => o.image) ? kept.map((o) => o.image) : null;

  const db = createAdminClient();
  const { data: postId, error } = await db.rpc("create_post", {
    p_device: deviceId,
    p_category: body.category,
    p_type: body.post_type,
    p_title: body.title.trim(),
    p_body: body.body.trim(),
    p_options: options,
    p_option_images: optionImages,
  });

  if (error) return fromDbError(error.message);

  // 사진은 선택 항목이라 글이 만들어진 뒤에 붙인다(F-22).
  const urls = body.image_urls ?? [];
  if (urls.length > 0) {
    const { error: imgError } = await db.from("post_images").insert(
      urls.map((url, i) => ({ post_id: postId, url, sort_order: i })),
    );
    if (imgError) return fail("IMAGE_INSERT_FAILED", 500, imgError.message);
  }

  return ok({ id: postId }, 201);
}
