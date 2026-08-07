"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PhotoBox, PostTypeBadge } from "@/components/badge";
import { HeartIcon, MessageIcon, VoteIcon } from "@/components/icons";
import { Temperature } from "@/components/temperature";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import {
  FEED_TABS,
  isTypeTab,
  TYPE_TABS,
  type Category,
  type FeedTab,
} from "@/lib/constants";

type Sort = "최신순" | "인기순";

export function Feed() {
  const [tab, setTab] = useState<FeedTab>("전체");
  const [sort, setSort] = useState<Sort>("최신순");
  // 어느 탭의 결과인지 같이 들고 있는다. 탭이 바뀌면 그 자체가 로딩 신호라
  // 이펙트 안에서 상태를 한 번 더 비울 필요가 없다.
  const [loaded, setLoaded] = useState<{ tab: FeedTab; rows: FeedItem[] } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchFeed(
      tab === "전체"
        ? {}
        : isTypeTab(tab)
          ? { post_type: TYPE_TABS[tab] }
          : { category: tab as Category },
    )
      .then((rows) => alive && setLoaded({ tab, rows }))
      .catch(() => alive && setLoaded({ tab, rows: [] }));
    return () => {
      alive = false;
    };
  }, [tab]);

  const items = loaded?.tab === tab ? loaded.rows : null;

  // 서버는 최신순으로만 준다(F-13). 인기순은 반응+댓글로 클라이언트에서 정렬.
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
      </div>
    </>
  );
}

/**
 * 피드 카드. 검색 결과도 이걸 쓴다 — 같은 글이 화면마다 다르게 생기면
 * 검색이 별개의 목록처럼 읽힌다.
 */
/**
 * 투표글 선택지 사진을 옆으로 넘겨 보는 띠.
 *
 * 왜 카드에서 미리 보여주나 — 투표글은 "이 둘 중에 뭐가 나아?"를 묻는 글인데
 * 목록에서 사진이 안 보이면 제목만으로는 무엇을 고르는 건지 알 수 없다.
 * 열어봐야 아는 카드는 목록에서 걸러지지 않는다.
 *
 * 한 장씩 보여주고 넘기게 한 이유: 390px 폭에 두 장을 나란히 놓으면 한 장이
 * 180px가 되어 옷의 핏이 안 보인다. 어차피 카드는 훑는 자리고 나란히 놓고
 * 비교하는 건 상세에서 한다.
 *
 * ⚠️ 이 띠는 <Link> 안에 있다. 손가락으로 미는 건 스크롤이라 클릭이 안 뜨지만,
 *    사진을 브라우저 기본 드래그로 끌면 링크째 끌려간다 — `draggable={false}`로 막는다.
 */
function OptionPhotos({ urls }: { urls: string[] }) {
  const [now, setNow] = useState(0);

  return (
    <div className="mt-2">
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          // 칸 폭으로 나눠 지금 몇 번째인지 센다. scrollLeft를 그대로 쓰면
          // 넘기는 도중에도 값이 계속 바뀌어 점이 떨린다.
          setNow(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="rail flex snap-x snap-mandatory gap-0 overflow-x-auto rounded-xl"
      >
        {/* -webkit-user-drag: none — 안 막으면 사진을 끌었을 때 브라우저 기본
            드래그가 걸려 링크째 끌려간다(넘기려던 게 드래그가 된다). */}
        {urls.map((u) => (
          <div
            key={u}
            className="w-full shrink-0 snap-center [&_img]:[-webkit-user-drag:none] [&_img]:select-none"
          >
            <PhotoBox src={u} alt="" className="h-[190px] w-full" iconSize={20} />
          </div>
        ))}
      </div>

      {/* 점은 두 장 이상일 때만. 한 장짜리에 점 하나가 뜨면 더 있는 줄 안다. */}
      {urls.length > 1 && (
        <div className="mt-1.5 flex justify-center gap-1">
          {urls.map((u, i) => (
            <span
              key={u}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === now ? "bg-brand" : "bg-neutral-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedCard({ item }: { item: FeedItem }) {
  // 투표글은 사진이 poll_options에 붙어서 thumbnail_url에 안 잡힌다.
  // 그쪽이 있으면 그걸 띠로 보여주고, 없을 때만 기존 68px 썸네일로 간다.
  const optionPhotos = item.option_images ?? [];
  const hasOptionPhotos = optionPhotos.length > 0;
  const hasPhoto = !hasOptionPhotos && Boolean(item.thumbnail_url);
  // 썸네일이 없을 때만 본문 2줄 미리보기를 보여준다 (F-15)
  const showPreview = !hasPhoto && !hasOptionPhotos && item.body.trim().length > 0;

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
          <PhotoBox
            src={item.thumbnail_url}
            alt=""
            className="h-[68px] w-[68px] shrink-0"
          />
        </div>
      ) : (
        <>
          <p className="text-[16px] leading-snug font-medium">{item.title}</p>
          {showPreview && (
            <p className="line-clamp-2 mt-1 text-[14px] leading-relaxed text-neutral-600">
              {item.body}
            </p>
          )}
          {hasOptionPhotos && <OptionPhotos urls={optionPhotos} />}
          {meta}
          {author}
        </>
      )}
    </Link>
  );
}
