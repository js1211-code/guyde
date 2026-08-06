"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PhotoBox } from "@/components/badge";
import { HeartIcon, MessageIcon, SearchIcon } from "@/components/icons";
import {
  GUIDE_PICK_MIN_LIKES,
  NANHAN_PICK_MIN_VOTES,
  NANHAN_PICK_PERCENT,
} from "@/lib/constants";
import { Logo } from "@/components/logo";
import { AppShell, Kicker, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import { fetchFeed, fetchPicks, type FeedItem, type PickItem } from "@/lib/api";
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
        '도서관'이라는 제목은 적지 않는다 — 하단 탭에 이미 켜져 있어서 같은 말을
        두 번 하는 셈이다. 대신 커뮤니티와 같은 머리(왼쪽 로고 · 오른쪽 검색)를
        둬서 탭을 옮겨도 화면 윗줄이 제자리에 있는 것처럼 보이게 한다.
      */}
      {/* 커뮤니티는 로고 밑에 태그라인이 있어 items-start로 위를 맞춘다.
          여기도 같은 정렬을 써야 탭을 옮길 때 로고가 위아래로 튀지 않는다. */}
      <header className="flex items-start justify-between px-4 pt-3 pb-2.5">
        <Logo size={24} />
        <Link
          href="/search"
          aria-label="글 검색"
          className="-mr-1 p-1 text-neutral-700 transition-transform duration-100 active:scale-90"
        >
          <SearchIcon size={21} />
        </Link>
      </header>

      {/* 커뮤니티 탭 줄과 같은 구조 — 회색 선은 감싸개, 선택 표시는 안쪽 2px. */}
      <div className="border-b border-neutral-400">
        <div className="flex gap-4 px-4">
          {SHELVES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShelf(s)}
              aria-current={shelf === s ? "page" : undefined}
              className={`shrink-0 border-b-2 pt-1 pb-2 text-[15px] ${
                shelf === s
                  ? "border-brand font-bold text-ink"
                  : "border-transparent text-neutral-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
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
      {getLatestArticles().map((a) =>
        /*
          준비중 글은 제목만 있고 본문이 없다. 누를 수 없게 <div>로 그린다 —
          <Link>로 두고 상세에서 404를 내면 눌러본 사람이 고장으로 읽는다.
          (주소를 직접 쳐도 안 열린다. getArticle()이 걸러낸다)
        */
        a.coming_soon ? (
          <div
            key={a.id}
            className="flex items-center gap-3 border-t border-dashed border-neutral-400 px-4 py-2.5"
          >
            {/* 표지가 없으므로 자리만 잡는다. 사진칸을 비워두면 발행된 글과
                줄 높이가 어긋나 목록이 들쭉날쭉해진다. */}
            <div className="h-[64px] w-[64px] shrink-0 rounded-xl bg-band" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-snug font-semibold text-neutral-500">
                {a.title}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span>{a.category}</span>
                <span className="rounded-xs bg-band px-1.5 py-0.5 font-semibold">
                  준비중
                </span>
              </p>
            </div>
          </div>
        ) : (
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
        ),
      )}

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
 * 무난템 — 판정이 끝난 것을 아이템 카드로 정리한 서가.
 *
 * 예전에는 판정글을 그대로 다시 보여줬는데, 판정글은 "이거 무난해요?"라는
 * **질문**이다. 답을 찾으러 온 사람에게 질문 목록을 주는 셈이었다.
 * 지금은 무엇을 / 얼마에 / 왜 무난한가를 카드가 정리해서 답한다.
 *
 * 🚨 추천수는 카드에 저장된 숫자가 아니라 **매인 판정글의 '무난해요' 표**다.
 *    카드에 박아넣으면 아무도 못 바꾸는 숫자가 화면에 뜨는데, 이 서비스는
 *    "판단자는 대중"이 전부라 그 숫자가 가짜면 서가째로 가짜가 된다.
 *    그래서 카드를 눌러도 상품 페이지가 아니라 **판정글**로 간다 — 근거를
 *    직접 확인할 수 있어야 카드를 믿을 이유가 생긴다.
 */
function Picks() {
  const [items, setItems] = useState<PickItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // 조건(60% · 종료 · 10표)은 서버가 건다. 화면에서 걸면 서가마다
    // 기준이 갈린다.
    fetchPicks({ limit: 50 })
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <p className="px-4 pt-3 pb-2 text-[13.5px] leading-relaxed text-neutral-600">
        판정이 끝난 글 중 {NANHAN_PICK_MIN_VOTES}표 이상 모여{" "}
        {NANHAN_PICK_PERCENT}% 넘게 무난하다고 나온 것만 정리했어요.
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
          아직 조건을 채운 게 없어요.
          <br />
          판정이 끝나고 {NANHAN_PICK_MIN_VOTES}표를 넘겨야 올라와요.
        </p>
      )}

      <div className="flex flex-col gap-2.5 px-4 pt-1 pb-4">
        {items?.map((item) => (
          <Link
            key={item.id}
            href={`/post/${item.post_id}`}
            className="rounded-2xl border border-neutral-400 p-3 transition-colors active:bg-brand/8"
          >
            <div className="flex gap-3">
              <PhotoBox
                src={item.thumb_url}
                alt=""
                className="h-[76px] w-[76px] shrink-0"
                iconSize={18}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <CategoryBadge>{item.category}</CategoryBadge>
                  <span className="rounded-xs border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[11.5px] font-bold text-brand-dark">
                    무난함 {item.nanhan_percent}%
                  </span>
                </div>
                <p className="text-[15.5px] leading-snug font-bold">{item.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">
                  {item.one_liner}
                </p>
                <p className="cond mt-1 text-[12.5px] text-neutral-500">
                  {item.price_band} · {item.vouch_count.toLocaleString("ko-KR")}명이
                  무난하대요
                </p>
              </div>
            </div>

            {/* 왜 무난한지가 이 서가의 존재 이유다. 접어두면 카드가 그냥
                상품 목록이 되므로 펼쳐 둔다. */}
            <p className="mt-2.5 border-t border-dashed border-neutral-400 pt-2.5 text-[13.5px] leading-relaxed text-neutral-700">
              {item.why}
            </p>

            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-band px-2 py-0.5 text-[11.5px] text-neutral-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
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
    // min_votes는 뷰의 reaction_count 하한이다. 정보공유 글에서 그 값은
    // 좋아요 수라, 무난템의 표 수 하한과 같은 조건을 그대로 쓴다.
    fetchFeed({
      post_type: "정보공유",
      min_votes: GUIDE_PICK_MIN_LIKES,
      sort: "reactions",
      limit: 50,
    })
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <p className="px-4 pt-3 pb-2 text-[13.5px] leading-relaxed text-neutral-600">
        좋아요를 {GUIDE_PICK_MIN_LIKES}개 받은 정보 공유 글만 모아놨어요.
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
          좋아요 {GUIDE_PICK_MIN_LIKES}개를 넘겨야 올라와요.
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
