"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed";
import { SearchIcon } from "@/components/icons";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { fetchFeed, type FeedItem } from "@/lib/api";

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
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = term.trim();

  useEffect(() => {
    if (!trimmed) return;

    let alive = true;
    // 한 글자 칠 때마다 부르면 "무난한가요"에 요청이 여섯 번 나간다.
    // 한글은 조합 중에도 input 이벤트가 계속 뜨므로 더 심하다.
    const timer = setTimeout(() => {
      fetchFeed({ q: trimmed, limit: 50 })
        .then((r) => {
          if (!alive) return;
          setItems(r);
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    }, 350);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [trimmed]);

  // 검색어를 지우면 결과도 지운다. 안 그러면 빈 검색창 밑에 옛 결과가 남는다.
  const results = trimmed ? items : null;

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
            className="min-w-0 flex-1 text-[14px]"
          />
          {term && (
            <button
              type="button"
              aria-label="지우기"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
              className="shrink-0 text-[15px] leading-none text-neutral-500"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <ScreenBody>
        {!trimmed && (
          <p className="px-4 py-12 text-center text-[13px] leading-relaxed text-neutral-500">
            찾고 싶은 말을 적어보세요.
            <br />
            제목과 내용에서 함께 찾아요.
          </p>
        )}

        {trimmed && results === null && !failed && (
          <p className="px-4 py-12 text-center text-[13px] text-neutral-500">
            찾는 중…
          </p>
        )}

        {failed && (
          <p className="px-4 py-12 text-center text-[13px] text-neutral-600">
            검색하지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {results?.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] leading-relaxed text-neutral-600">
              <b>{trimmed}</b> 에 대한 글이 없어요.
            </p>
            {/* 빈 결과에서 그냥 돌려보내지 않는다 — 못 찾았다는 건 아직 아무도
                안 물어봤다는 뜻이라, 그 자리에서 물어보게 하는 게 맞다. */}
            <Link
              href="/write"
              className="mt-4 inline-block rounded-md bg-brand px-4 py-2.5 text-[13px] font-bold text-white"
            >
              직접 물어보기
            </Link>
          </div>
        )}

        {results && results.length > 0 && (
          <>
            <p className="px-4 pt-2.5 pb-1 text-[12px] text-neutral-600">
              {results.length}건
            </p>
            {results.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </>
        )}
      </ScreenBody>
    </AppShell>
  );
}
