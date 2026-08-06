"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PhotoBox } from "@/components/badge";
import { HeartIcon, MessageIcon, SearchIcon } from "@/components/icons";
import {
  NANHAN_PICK_MIN_VOTES,
  NANHAN_PICK_PERCENT,
} from "@/lib/constants";
import { AppShell, Kicker, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { getHeroArticle, getLatestArticles, getQuizzes } from "@/lib/mock";

const SHELVES = ["아티클", "무난템", "정보 공유"] as const;
type Shelf = (typeof SHELVES)[number];

/**
 * ⑪ 도서관 — 서가 두 개.
 *
 *   아티클   : 우리가 쓴 편집된 읽을거리 (아직 lib/mock.ts)
 *   무난템   : 무난함 판정에서 60% 이상 받은 것만
 *   정보 공유: 커뮤니티가 쌓은 글
 *
 * 커뮤니티 피드에도 '정보공유' 탭이 있지만 성격이 다르다.
 * 피드는 지금 뭐가 올라왔나를 보는 곳이라 최신순이고,
 * 여기는 쓸 만한 걸 찾는 곳이라 도움된 순이다.
 * 같은 글이 두 곳에 보이는 건 의도한 것 — 흐름과 서가는 용도가 다르다.
 *
 * 매거진에서 이름이 바뀐 이유도 같다. 매거진은 "이번 호"라 지나가면 끝인
 * 인상인데, 여기 글은 한 번 쓰면 계속 찾아보는 참고 자료에 가깝다.
 */
export default function LibraryPage() {
  const [shelf, setShelf] = useState<Shelf>("아티클");

  return (
    <AppShell>
      {/*
        제목을 적지 않는다. 하단 탭에 '도서관'이 이미 켜져 있어서 같은 말을
        두 번 하는 셈이고, 그 자리를 비우면 서가가 화면 위로 올라온다.
        대신 검색 입구를 오른쪽에 둔다 — 커뮤니티와 같은 자리다.
      */}
      <div className="flex items-center justify-end px-4 pt-3 pb-1">
        <Link
          href="/search"
          aria-label="글 검색"
          className="-mr-1 p-1 text-neutral-700 transition-transform duration-100 active:scale-90"
        >
          <SearchIcon size={21} />
        </Link>
      </div>

      <div className="flex gap-4 border-b border-neutral-400 px-4">
        {SHELVES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setShelf(s)}
            aria-current={shelf === s ? "page" : undefined}
            className={`-mb-px shrink-0 pt-1 pb-2 text-[15px] ${
              shelf === s
                ? "border-b-2 border-brand font-bold text-ink"
                : "text-neutral-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <ScreenBody>
        {shelf === "아티클" && <Articles />}
        {shelf === "무난템" && <Picks />}
        {shelf === "정보 공유" && <Guides />}
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}

/** 편집된 아티클 + 테스트 카드. 백엔드가 없어 아직 mock이다. */
function Articles() {
  const hero = getHeroArticle();

  return (
    <>
      <Link href={`/library/${hero.id}`} className="mt-3 block px-4">
        <PhotoBox src={hero.cover_url} alt="" className="h-[150px]" iconSize={24} />
        <span className="mt-2.5 inline-block">
          <CategoryBadge>{hero.category}</CategoryBadge>
        </span>
        <p className="mt-1.5 text-[18.5px] leading-snug font-bold">{hero.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
          {hero.lead}
        </p>
      </Link>

      <Kicker className="px-4 pt-5 pb-2">ALL</Kicker>
      {getLatestArticles().map((a) => (
        <Link
          key={a.id}
          href={`/library/${a.id}`}
          className="flex items-center gap-3 border-t border-dashed border-neutral-400 px-4 py-2.5"
        >
          <PhotoBox
            src={a.cover_url}
            alt=""
            className="h-[64px] w-[64px] shrink-0"
            iconSize={16}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-snug font-semibold">{a.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-600">
              <span>{a.category}</span>
              <span>· {a.read_minutes}분</span>
            </p>
          </div>
        </Link>
      ))}

      <Kicker className="px-4 pt-5 pb-2">TEST</Kicker>
      <div className="flex gap-3 overflow-x-auto px-4 pb-4">
        {getQuizzes().map((q) => (
          <Link
            key={q.id}
            href={`/library/quiz/${q.slug}`}
            className="min-w-[128px] flex-1 rounded-xl border border-neutral-400 p-3"
          >
            <p className="text-[14.5px] leading-snug font-bold">{q.title}</p>
            <p className="cond mt-2 text-[12px] text-neutral-600">
              {q.taker_count.toLocaleString("ko-KR")}명 참여
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

/**
 * 무난템 — 무난함 판정에서 합격선을 넘긴 것만.
 *
 * 커뮤니티의 '무난무난' 탭과 다르다. 그쪽은 판정을 **받는** 곳이라
 * 0표짜리도 전부 올라오고, 여기는 판정이 **끝난** 것만 모은다.
 * 무난한지 물어보러 온 사람에게 "이건 이미 통과했다"를 보여주는 자리다.
 */
function Picks() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchFeed({
      post_type: "무난함판정",
      min_nanhan: NANHAN_PICK_PERCENT,
      // 아직 표가 들어오는 중인 글을 "무난한 것"으로 실으면 다음에 봤을 때
      // 숫자가 달라져 있다. 결론이 난 글만 싣는다.
      closed: true,
      min_votes: NANHAN_PICK_MIN_VOTES,
      sort: "reactions",
      limit: 50,
    })
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <p className="px-4 pt-3 pb-2 text-[13.5px] leading-relaxed text-neutral-600">
        판정이 끝난 글 중 {NANHAN_PICK_MIN_VOTES}표 이상 모여{" "}
        {NANHAN_PICK_PERCENT}% 넘게 무난하다고 나온 것만 모았어요.
      </p>

      {failed && (
        <p className="px-4 py-10 text-center text-[14px] text-neutral-600">
          불러오지 못했어요
        </p>
      )}
      {!failed && items === null && (
        <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
          불러오는 중…
        </p>
      )}
      {items?.length === 0 && (
        <p className="px-4 py-10 text-center text-[14px] leading-relaxed text-neutral-600">
          아직 조건을 채운 글이 없어요.
          <br />
          판정이 끝나고 {NANHAN_PICK_MIN_VOTES}표를 넘겨야 올라와요.
        </p>
      )}

      {items?.map((item) => (
        <Link
          key={item.id}
          href={`/post/${item.id}`}
          className="flex items-center gap-3 border-t border-dashed border-neutral-400 px-4 py-3"
        >
          <PhotoBox
            src={item.thumbnail_url}
            alt=""
            className="h-[64px] w-[64px] shrink-0"
            iconSize={16}
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <CategoryBadge>{item.category}</CategoryBadge>
              <span className="rounded-xs border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[11.5px] font-bold text-brand-dark">
                무난함 {item.nanhan_percent}%
              </span>
            </div>
            <p className="text-[15px] leading-snug font-semibold">{item.title}</p>
            <p className="mt-1 text-[12.5px] text-neutral-500">
              {item.reaction_count}명 판정
            </p>
          </div>
        </Link>
      ))}
    </>
  );
}

/**
 * 커뮤니티가 쌓은 정보 공유 글.
 * 도움된 순으로 세운다 — 서가는 최신이 아니라 쓸모로 정렬돼야 한다.
 */
function Guides() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchFeed({ post_type: "정보공유", sort: "reactions", limit: 50 })
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <p className="px-4 pt-3 pb-2 text-[13.5px] leading-relaxed text-neutral-600">
        커뮤니티가 쌓은 정보 글이에요. 도움된 순으로 모아뒀어요.
      </p>

      {failed && (
        <p className="px-4 py-10 text-center text-[14px] text-neutral-600">
          불러오지 못했어요
        </p>
      )}
      {!failed && items === null && (
        <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
          불러오는 중…
        </p>
      )}
      {items?.length === 0 && (
        <p className="px-4 py-10 text-center text-[14px] leading-relaxed text-neutral-600">
          아직 정보 글이 없어요.
          <br />
          커뮤니티에서 &lsquo;정보 공유&rsquo;로 첫 글을 남겨보세요.
        </p>
      )}

      {items?.map((item) => (
        <Link
          key={item.id}
          href={`/post/${item.id}`}
          className="block border-t border-dashed border-neutral-400 px-4 py-3"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <CategoryBadge>{item.category}</CategoryBadge>
            {item.reaction_count > 0 && (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-brand">
                <HeartIcon size={11} className="text-brand" />
                {item.reaction_count}
              </span>
            )}
            {item.comment_count > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-neutral-600">
                <MessageIcon size={11} />
                {item.comment_count}
              </span>
            )}
          </div>

          <p className="text-[16px] leading-snug font-semibold">{item.title}</p>
          {item.body.trim() && (
            <p className="line-clamp-2 mt-1 text-[14px] leading-relaxed text-neutral-600">
              {item.body}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[13px] font-semibold">{item.nickname}</span>
            <Temperature value={item.temperature} />
          </div>
        </Link>
      ))}
    </>
  );
}
