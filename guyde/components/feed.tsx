"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryBadge, PhotoBox, PostTypeBadge } from "@/components/badge";
import { HeartIcon, MessageIcon, VoteIcon } from "@/components/icons";
import { Temperature } from "@/components/temperature";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import {
  FEED_PAGE_SIZE,
  FEED_TABS,
  isTypeTab,
  TYPE_TABS,
  type Category,
  type FeedTab,
} from "@/lib/constants";

type Sort = "최신순" | "인기순";

/** 탭 이름 → 서버 필터. 첫 쪽과 다음 쪽이 같은 조건을 써야 한다. */
function filterFor(tab: FeedTab) {
  if (tab === "전체") return {};
  if (isTypeTab(tab)) return { post_type: TYPE_TABS[tab] };
  return { category: tab as Category };
}

export function Feed() {
  const [tab, setTab] = useState<FeedTab>("전체");
  const [sort, setSort] = useState<Sort>("최신순");
  // 어느 탭의 결과인지 같이 들고 있는다. 탭이 바뀌면 그 자체가 로딩 신호라
  // 이펙트 안에서 상태를 한 번 더 비울 필요가 없다.
  //
  // done = 서버에 더 없다. 마지막 쪽이 덜 차서 온 걸로 판단한다 — 개수를
  // 따로 물어보면 요청이 한 번 더 늘고, 그 사이 글이 올라오면 어차피 어긋난다.
  const [loaded, setLoaded] = useState<
    { tab: FeedTab; rows: FeedItem[]; done: boolean } | null
  >(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchFeed({ ...filterFor(tab), limit: FEED_PAGE_SIZE })
      .then(
        (rows) =>
          alive && setLoaded({ tab, rows, done: rows.length < FEED_PAGE_SIZE }),
      )
      .catch(() => alive && setLoaded({ tab, rows: [], done: true }));
    return () => {
      alive = false;
    };
  }, [tab]);

  const items = loaded?.tab === tab ? loaded.rows : null;
  const done = loaded?.tab === tab ? loaded.done : true;

  /*
    다음 쪽. 한 번만 요청하고 끝내면 서버 기본값 밖의 글이 전체 게시판에서
    통째로 사라진다 — 실제로 무난템 서가(limit 50)에는 있는데 커뮤니티
    '전체'에는 없는 글이 스무 개쯤 있었다.

    중복 요청은 ref로 막는다. state 가드는 같은 프레임에 두 번 들어오면
    둘 다 옛 값을 읽고 통과한다(댓글이 두 개씩 달렸던 것과 같은 함정).
  */
  const fetching = useRef(false);
  const loadMore = useCallback(() => {
    if (fetching.current || !loaded || loaded.tab !== tab || loaded.done) return;
    fetching.current = true;
    setLoadingMore(true);

    fetchFeed({ ...filterFor(tab), limit: FEED_PAGE_SIZE, offset: loaded.rows.length })
      .then((rows) =>
        setLoaded((prev) => {
          // 불러오는 사이 탭을 옮겼으면 남의 탭 결과다. 버린다.
          if (!prev || prev.tab !== tab) return prev;
          // 쪽을 넘기는 사이 새 글이 올라오면 뒤로 밀린 글이 두 번 온다.
          // key가 겹치면 React가 화면을 잘못 재사용하므로 id로 걸러낸다.
          const seen = new Set(prev.rows.map((r) => r.id));
          const fresh = rows.filter((r) => !seen.has(r.id));
          return {
            tab,
            rows: [...prev.rows, ...fresh],
            // 한 건도 새로 안 왔으면 거기서 멈춘다. 안 그러면 offset이 제자리라
            // 같은 쪽을 계속 다시 부르는 무한 요청이 된다.
            done: rows.length < FEED_PAGE_SIZE || fresh.length === 0,
          };
        }),
      )
      // 실패해도 done으로 두지 않는다 — 다시 바닥에 닿으면 또 시도한다.
      .catch(() => {})
      .finally(() => {
        fetching.current = false;
        setLoadingMore(false);
      });
  }, [loaded, tab]);

  /*
    바닥이 보이면 알아서 이어 붙인다. '더 보기'를 누르게 하면 안 누른 사람에게는
    목록이 여전히 30건에서 끝난 것으로 보인다 — 그게 지금 고치는 증상이다.
    버튼은 그대로 두되(관찰자가 없는 브라우저의 유일한 길), 평소엔 눌리기 전에
    관찰자가 먼저 부른다.

    loaded가 바뀔 때마다 loadMore가 새로 만들어져 이 이펙트도 다시 돈다.
    한 쪽을 붙인 뒤에도 바닥이 여전히 보이면(화면이 길거나 쪽이 짧을 때)
    그 자리에서 다음 쪽으로 이어진다.
  */
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      // 바닥에 닿기 전에 미리 부른다. 닿고 나서 부르면 빈 화면을 한 박자 본다.
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // 서버는 최신순으로만 준다(F-13). 인기순은 반응+댓글로 클라이언트에서 정렬.
  // 정렬 대상은 **지금까지 받아온 글**이다. 바닥까지 내려 다 받고 나면 전체가
  // 대상이 된다 — 서버가 반응 수만 보고 정렬해 주는 것과 기준이 달라서
  // (여기는 반응+댓글) 쪽 나누기를 서버에 맡기지 않았다.
  const visible =
    items && sort === "인기순"
      ? [...items].sort(
          (a, b) =>
            b.reaction_count + b.comment_count - (a.reaction_count + a.comment_count),
        )
      : items;

  return (
    <>
      {/*
        게시판 줄은 목록과 같이 스크롤되지 않고 위에 붙어 있는다.
        옷 게시판을 한참 내려보다 헤어로 가려면 맨 위까지 다시 올려야 했다.

        sticky의 기준은 가장 가까운 스크롤 조상(ScreenBody)이라 top-0이면
        목록 위에 정확히 붙는다. 배경색을 꼭 줘야 한다 — 투명하면 밑을 지나가는
        글이 탭 글자에 겹쳐 보인다.

        rail: scroll-area(overflow-y:auto)를 쓰면 가로 탭 줄에 세로 스크롤까지
        붙어 손가락이 위아래로 밀린다. 가로만 흐르게 하고 세로는 잠근다.
      */}
      {/*
        ⚠️ 회색 밑줄은 **스크롤 영역 바깥**(이 감싸개)에 둔다.
        .rail은 세로를 잘라내는데(overflow: auto hidden), 선택 표시를
        음수 마진으로 회색 선 위에 겹치려 하면 그 1px이 잘려 나가서
        도서관 탭보다 얇아 보인다. 실제로 그렇게 어긋나 있었다.

        대신 선택 표시는 스크롤 영역 안에서 온전한 2px로 그리고, 회색 선은
        그 밑에 따로 깐다. 도서관도 같은 구조라 두 화면이 똑같이 보인다.
      */}
      <div className="sticky top-0 z-10 border-b border-neutral-400 bg-paper">
        <div className="rail flex gap-4 px-4">
          {FEED_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              // 안 고른 탭에도 같은 두께의 투명 밑줄을 둬야 높이가 안 튄다.
              className={`shrink-0 border-b-2 pt-1 pb-2 text-[15px] whitespace-nowrap ${
                tab === t
                  ? "border-brand font-bold text-ink"
                  : "border-transparent text-neutral-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/*
        탭마다 안내 띠를 두지 않는다. 탭 이름이 이미 그 뜻이라 한 줄 더 붙이면
        같은 말을 두 번 하는 셈이고, 탭을 옮길 때마다 목록 시작 위치가 들쭉날쭉해진다.
        (무난무난은 설명 자체가 틀리기도 했다 — 이 탭은 판정글을 전부 보여준다.
         60% 이상만 모은 곳은 도서관의 무난템 서가다.)
      */}
      {/*
        정렬 줄 밑에 얇은 선을 둔다. 없으면 '최신순 인기순'이 첫 글의 머리처럼
        붙어 읽혀서, 그게 목록 전체에 걸리는 스위치라는 게 안 보인다.

        ⚠️ 색은 게시판 탭 줄(neutral-400)보다 한 단계 연하게 둔다. 같은 색이면
           가로선 두 개가 나란히 놓여 어느 쪽이 위 묶음인지 흐려진다.
      */}
      <div className="flex items-center gap-3 border-b border-neutral-300 px-4 py-2">
        {(["최신순", "인기순"] as Sort[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`text-[13.5px] ${
              sort === s ? "font-bold text-brand" : "text-neutral-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div>
        {visible === null && (
          <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
            불러오는 중…
          </p>
        )}
        {visible?.length === 0 && (
          <p className="px-4 py-10 text-center text-[14px] leading-relaxed text-neutral-600">
            아직 글이 없어요.
            <br />
            오른쪽 아래 + 버튼으로 첫 글을 남겨보세요.
          </p>
        )}
        {visible?.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}

        {/* 더 받을 게 남았을 때만 그린다. 다 받은 뒤에도 남겨두면 목록 끝에
            영영 눌리지 않는 버튼이 붙어 아직 더 있는 것처럼 보인다. */}
        {items !== null && !done && (
          <div ref={sentinel} className="px-4 py-6 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-[13.5px] text-neutral-600"
            >
              {loadingMore ? "불러오는 중…" : "더 보기"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * 카드 오른쪽 68px 썸네일. 사진이 여러 장이면 **칸 안에서 넘겨 본다.**
 *
 * 왜 칸을 안 키우나 — 목록은 훑는 자리다. 사진을 카드 폭만큼 키우면 글 하나가
 * 화면을 다 먹어서 한 번에 두세 개밖에 안 보이고, 사진 있는 글과 없는 글의
 * 높이가 크게 갈려 목록이 들쭉날쭉해진다. 크게 보는 건 상세에서 한다.
 *
 * 투표글은 선택지마다 사진이 붙어서 여러 장인 경우가 많은데, 첫 장만 보여주면
 * 나머지가 있다는 것조차 알 수 없다. 그래서 인스타처럼 넘길 수 있게 하고
 * 오른쪽 위에 `1/2`를 띄운다 — **넘길 게 더 있다는 표시가 곧 개수 표시다.**
 *
 * 점(dot)을 안 쓰는 이유: 68px 밑에 점을 달면 그만큼 카드가 높아져서 사진 있는
 * 글만 줄이 밀린다. 칸 안에 얹는 숫자는 자리를 차지하지 않는다.
 */
function ThumbStrip({ urls }: { urls: string[] }) {
  const [now, setNow] = useState(0);

  // 한 장이면 넘길 것도 셀 것도 없다. 스크롤 칸을 만들지 않는다 —
  // 한 장짜리에 `1/1`이 뜨면 더 있는 줄 안다.
  if (urls.length <= 1) {
    /* ⚠️ 68px을 변수로 빼서 `h-[${n}px]`처럼 조립하지 말 것 — Tailwind는
       소스를 글자로 훑어서 클래스를 만들기 때문에 조립한 이름은 못 찾고
       스타일이 통째로 빠진다. 아래 감싸개와 같은 값을 손으로 맞춘다. */
    return <PhotoBox src={urls[0]} alt="" className="h-[68px] w-[68px] shrink-0" />;
  }

  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          // 칸 폭으로 나눠 지금 몇 번째인지 센다. scrollLeft를 그대로 쓰면
          // 넘기는 도중에도 값이 계속 바뀌어 숫자가 떨린다.
          setNow(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="rail flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {/*
          ⚠️ 카드 전체가 <Link>다. `-webkit-user-drag: none`을 안 주면 사진을
             끌었을 때 브라우저 기본 드래그가 걸려 **링크째 끌려간다** —
             넘기려던 동작이 드래그가 된다.
        */}
        {urls.map((u) => (
          <div
            key={u}
            className="h-full w-full shrink-0 snap-center [&_img]:[-webkit-user-drag:none] [&_img]:select-none"
          >
            <PhotoBox src={u} alt="" className="h-full w-full" iconSize={14} />
          </div>
        ))}
      </div>

      {/* 사진 위에 얹히므로 어두운 판을 깔아야 흰 사진에서도 읽힌다. */}
      <span className="cond pointer-events-none absolute top-1 right-1 rounded-full bg-black/55 px-1.5 text-[10px] leading-[15px] font-semibold text-white">
        {now + 1}/{urls.length}
      </span>
    </div>
  );
}

/**
 * 피드 카드. 검색 결과도 이걸 쓴다 — 같은 글이 화면마다 다르게 생기면
 * 검색이 별개의 목록처럼 읽힌다.
 */
export function FeedCard({ item }: { item: FeedItem }) {
  /*
    사진은 **유형과 상관없이** 오른쪽 68px 칸에 뜬다. 목록은 훑는 자리라
    한 글이 화면을 다 먹으면 안 되고, 유형마다 크기가 다르면 같은 목록이
    두 가지 리듬으로 읽힌다.

    사진의 출처만 유형에 따라 다르다:
      선택지투표 → poll_options.image_url (본문 사진칸이 없다)
      나머지     → post_images (= posts_feed 의 thumbnail_url)

    투표글이 thumbnail_url 에 안 잡히는 건 그래서다. 출처가 다를 뿐 보여주는
    자리는 같으므로 여기서 목록 하나로 합친다 — 여러 장이면 ThumbStrip 이
    칸 안에서 넘기게 해준다.
  */
  const photos =
    item.post_type === "선택지투표"
      ? (item.option_images ?? [])
      : item.thumbnail_url
        ? [item.thumbnail_url]
        : [];

  const hasPhoto = photos.length > 0;
  // 썸네일이 없을 때만 본문 2줄 미리보기를 보여준다 (F-15)
  const showPreview = !hasPhoto && item.body.trim().length > 0;

  const meta = (
    <div className="mt-2 flex items-center gap-3 text-[12.5px] text-neutral-600">
      {/* 영문 라벨 대신 모양으로 보여준다. 하트=좋아요, 투표함=투표.
          숫자 옆에 뭐가 붙었는지 읽지 않고도 구분돼야 한다. */}
      {item.post_type === "선택지투표" && (
        <span className="flex items-center gap-1">
          <VoteIcon size={12} />
          {item.reaction_count}
        </span>
      )}
      {item.post_type === "정보공유" && item.reaction_count > 0 && (
        <span className="flex items-center gap-1">
          <HeartIcon size={12} />
          {item.reaction_count}
        </span>
      )}
      {item.comment_count > 0 && (
        <span className="flex items-center gap-1">
          <MessageIcon size={12} />
          {item.comment_count}
        </span>
      )}
    </div>
  );

  const author = (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="text-[13px] font-semibold">{item.nickname}</span>
      <Temperature value={item.temperature} />
    </div>
  );

  return (
    <Link
      href={`/post/${item.id}`}
      /*
        글 사이를 크림색 띠로 나눈다. 앱 바탕이 흰색이라 틈을 비워두면
        아무것도 안 보이므로, 구분선이 자기 색을 직접 들고 있어야 한다.

        선 대신 두꺼운 띠인 이유: 얇은 선은 글 하나하나에 테두리를 두른 것처럼
        보여 목록이 촘촘해지고, 사진 있는 카드와 없는 카드의 높이 차이가
        선 때문에 더 도드라진다.
      */
      className="block border-b-[5px] border-band bg-white px-4 py-3.5"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <CategoryBadge>{item.category}</CategoryBadge>
        <PostTypeBadge
          postType={item.post_type}
          nanhanPercent={item.nanhan_percent}
        />
        <span className="ml-auto text-[12px] text-neutral-600">
          {timeAgo(item.created_at)}
        </span>
      </div>

      {hasPhoto ? (
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] leading-snug font-medium">{item.title}</p>
            {meta}
            {author}
          </div>
          <ThumbStrip urls={photos} />
        </div>
      ) : (
        <>
          <p className="text-[16px] leading-snug font-medium">{item.title}</p>
          {showPreview && (
            <p className="line-clamp-2 mt-1 text-[14px] leading-relaxed text-neutral-600">
              {item.body}
            </p>
          )}
          {meta}
          {author}
        </>
      )}
    </Link>
  );
}
