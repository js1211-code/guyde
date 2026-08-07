"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed";
import { SearchIcon } from "@/components/icons";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { fetchFeed, type FeedItem } from "@/lib/api";
import {
  FEED_PAGE_SIZE,
  FEED_TABS,
  isTypeTab,
  TYPE_TABS,
  type Category,
  type FeedTab,
} from "@/lib/constants";

/** 고른 게시판을 API 조건으로 옮긴다. 두 축(카테고리·유형)이 섞여 있다. */
function boardFilter(board: FeedTab) {
  if (board === "전체") return {};
  if (isTypeTab(board)) return { post_type: TYPE_TABS[board] };
  return { category: board as Category };
}

/**
 * 글 검색 — 제목과 본문에서 찾는다.
 *
 * 피드 안에 검색창을 끼워 넣지 않고 화면을 따로 뒀다. 피드는 훑는 곳이고
 * 검색은 찾는 곳이라 목적이 다르다 — 한 화면에 섞으면 탭·정렬·검색어가
 * 서로를 덮어써서 지금 뭘 보고 있는지 알기 어려워진다.
 *
 * 결과 카드는 피드와 **같은 컴포넌트**를 쓴다. 같은 글이 화면마다 다르게
 * 생기면 검색 결과가 별개의 목록처럼 읽힌다.
 */
export default function SearchPage() {
  const [term, setTerm] = useState("");
  // 어느 게시판에서 찾을지. '전체'면 게시판을 안 가린다.
  const [board, setBoard] = useState<FeedTab>("전체");
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = term.trim();
  /*
    어떤 질문의 답인지. 검색어와 게시판이 같이 바뀌므로 둘을 묶어 들고 다닌다 —
    피드가 `tab`을 같이 들고 있는 것과 같은 장치다. 이게 있으면 늦게 도착한
    옛 검색의 응답이 새 검색 결과를 덮어쓰지 못하고, 검색어를 고치는 순간
    결과가 저절로 비어 '찾는 중…'으로 돌아간다.
  */
  const key = `${board}\0${trimmed}`;
  const [found, setFound] = useState<
    { key: string; rows: FeedItem[]; done: boolean } | null
  >(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!trimmed) return;

    let alive = true;
    // 한 글자 칠 때마다 부르면 "무난한가요"에 요청이 여섯 번 나간다.
    // 한글은 조합 중에도 input 이벤트가 계속 뜨므로 더 심하다.
    const timer = setTimeout(() => {
      fetchFeed({ q: trimmed, limit: FEED_PAGE_SIZE, ...boardFilter(board) })
        .then((rows) => {
          if (!alive) return;
          setFound({ key, rows, done: rows.length < FEED_PAGE_SIZE });
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    }, 350);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [trimmed, board, key]);

  // 검색어를 지우면 결과도 지운다. 안 그러면 빈 검색창 밑에 옛 결과가 남는다.
  const results = trimmed && found?.key === key ? found.rows : null;
  const done = found?.key === key ? found.done : true;

  /*
    다음 쪽. 검색도 한 번만 부르고 끝내면 **찾는 글이 있는데 없다고 나온다** —
    피드보다 나쁘다. 피드에서 못 본 글을 찾으러 오는 곳이 검색인데 여기서도
    앞쪽 몇 건에서 잘리면 어디서도 그 글에 닿을 수 없다.

    중복 요청은 ref로 막는다(state 가드는 같은 프레임에 둘 다 옛 값을 읽는다).
  */
  const fetching = useRef(false);
  const loadMore = useCallback(() => {
    if (fetching.current || !found || found.key !== key || found.done) return;
    fetching.current = true;
    setLoadingMore(true);

    fetchFeed({
      q: trimmed,
      limit: FEED_PAGE_SIZE,
      offset: found.rows.length,
      ...boardFilter(board),
    })
      .then((rows) =>
        setFound((prev) => {
          // 불러오는 사이 검색어나 게시판이 바뀌었으면 남의 질문의 답이다.
          if (!prev || prev.key !== key) return prev;
          // 쪽을 넘기는 사이 새 글이 올라오면 뒤로 밀린 글이 두 번 온다.
          const seen = new Set(prev.rows.map((r) => r.id));
          const fresh = rows.filter((r) => !seen.has(r.id));
          return {
            key,
            rows: [...prev.rows, ...fresh],
            // 새로 온 게 없으면 멈춘다 — offset이 제자리라 무한 요청이 된다.
            done: rows.length < FEED_PAGE_SIZE || fresh.length === 0,
          };
        }),
      )
      // 실패해도 done으로 두지 않는다. 다시 바닥에 닿으면 또 시도한다.
      .catch(() => {})
      .finally(() => {
        fetching.current = false;
        setLoadingMore(false);
      });
  }, [found, key, trimmed, board]);

  // 바닥이 보이면 알아서 이어 붙인다. 버튼은 관찰자가 없는 브라우저용 대비책.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  function pickBoard(next: FeedTab) {
    // 같은 칩을 다시 누르면 해제된다 — 끄는 방법이 따로 없으면 갇힌다.
    // 결과를 여기서 비우지 않아도 key가 달라져 저절로 '찾는 중…'이 된다.
    setBoard((prev) => (prev === next ? "전체" : next));
  }

  return (
    <AppShell>
      <TopBar backHref="/" title="검색" />

      <div className="border-b border-neutral-400 px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-neutral-400 px-3.5 py-2">
          <SearchIcon size={16} className="shrink-0 text-neutral-500" />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            // 검색하러 들어온 화면이라 바로 칠 수 있어야 한다.
            autoFocus
            enterKeyHint="search"
            placeholder="제목·내용으로 찾기"
            className="min-w-0 flex-1 text-[15px]"
          />
          {term && (
            <button
              type="button"
              aria-label="지우기"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
              className="shrink-0 text-[16px] leading-none text-neutral-500"
            >
              ×
            </button>
          )}
        </div>

        {/*
          게시판 고르기. 가로로만 스크롤한다(.rail) — 세로로 밀리면 검색창이
          같이 움직여서 입력하다 말고 손이 미끄러진다.
        */}
        <div className="rail mt-2.5 flex gap-1.5">
          {FEED_TABS.map((t) => {
            const on = board === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => pickBoard(t)}
                aria-pressed={on}
                // 선택은 테두리를 유지한 채 연하게 채운다. 꽉 찬 색으로 바꾸면
                // 박스 선이 사라져 뭐가 골라졌는지 흐려진다.
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[13.5px] whitespace-nowrap ${
                  on
                    ? "border-brand bg-brand/15 font-bold text-brand-dark"
                    : "border-neutral-400 text-neutral-600"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <ScreenBody>
        {!trimmed && (
          <p className="px-4 py-12 text-center text-[14px] leading-relaxed text-neutral-500">
            찾고 싶은 말을 적어보세요.
            <br />
            제목과 내용에서 함께 찾아요.
          </p>
        )}

        {trimmed && results === null && !failed && (
          <p className="px-4 py-12 text-center text-[14px] text-neutral-500">
            찾는 중…
          </p>
        )}

        {failed && (
          <p className="px-4 py-12 text-center text-[14px] text-neutral-600">
            검색하지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {results?.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-[14px] leading-relaxed text-neutral-600">
              <b>{trimmed}</b> 에 대한 글이 없어요.
              {board !== "전체" && (
                // 게시판을 좁혀놓고 못 찾은 건지 원래 없는 건지 구분돼야 한다.
                <>
                  <br />
                  <span className="text-[13px] text-neutral-500">
                    지금은 <b>{board}</b> 게시판에서만 찾고 있어요.
                  </span>
                </>
              )}
            </p>
            {/* 빈 결과에서 그냥 돌려보내지 않는다 — 못 찾았다는 건 아직 아무도
                안 물어봤다는 뜻이라, 그 자리에서 물어보게 하는 게 맞다. */}
            <Link
              href="/write"
              className="mt-4 inline-block rounded-md bg-brand px-4 py-2.5 text-[14px] font-bold text-white"
            >
              직접 물어보기
            </Link>
          </div>
        )}

        {results && results.length > 0 && (
          <>
            {/* 아직 더 남았으면 '이상'을 붙인다. 받아온 만큼만 세어놓고 딱
                떨어지는 숫자로 적으면 그게 전부인 줄 알고 내려보지 않는다. */}
            <p className="px-4 pt-2.5 pb-1 text-[13px] text-neutral-600">
              {results.length}건{done ? "" : " 이상"}
            </p>
            {results.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}

            {!done && (
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
          </>
        )}
      </ScreenBody>
    </AppShell>
  );
}
