"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "@/components/icons";
import { looksLikeUrl } from "@/lib/constants";

export type LinkPreview = {
  found: boolean;
  title?: string | null;
  description?: string | null;
  site?: string | null;
  image?: string | null;
};

/**
 * 붙여넣은 주소의 OG 태그를 읽어온다.
 *
 * 한 글자 칠 때마다 부르면 안 된다 — 주소를 손으로 고치는 동안 요청이
 * 수십 번 나간다. 입력이 멈추고 나서 한 번만 부른다.
 *
 * **못 읽는 건 오류가 아니다.** 29cm·쿠팡·올리브영처럼 상품 정보를
 * 자바스크립트로 그리는 곳은 서버가 받는 HTML에 상품이 아예 없다.
 * 그럴 때 빨간 문구를 띄우면 고수가 잘못한 것처럼 보인다 — 그냥 안 그린다.
 */
export function useLinkPreview(url: string, delay = 700) {
  // 결과에 어느 주소의 것인지를 같이 들고 있는다. 주소가 바뀌는 순간
  // 렌더에서 바로 짝이 안 맞는 걸 알 수 있어서, 이펙트 안에서 상태를
  // 되돌릴 필요가 없다(그게 곧 연쇄 렌더다).
  const [result, setResult] = useState<{ url: string; data: LinkPreview } | null>(
    null,
  );

  const trimmed = url.trim();
  const valid = looksLikeUrl(trimmed);

  useEffect(() => {
    if (!valid) return;

    let alive = true;
    const timer = setTimeout(async () => {
      let data: LinkPreview = { found: false };
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(trimmed)}`,
        );
        if (res.ok) data = await res.json();
      } catch {
        // 못 읽은 것과 같이 취급한다.
      }
      // 주소가 또 바뀌었으면 이 응답은 버린다 — 늦게 온 옛 응답이
      // 새 주소의 카드를 덮어쓰면 엉뚱한 상품이 뜬다.
      if (alive) setResult({ url: trimmed, data });
    }, delay);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [trimmed, valid, delay]);

  const fresh = result?.url === trimmed ? result.data : null;
  return { data: valid ? fresh : null, loading: valid && fresh === null };
}

/**
 * OG 제목에서 상품명만 남긴다.
 *
 * 쇼핑몰 제목에는 검색용 꼬리가 붙는다 —
 *   "숲(SOUP) 브이넥 니트(OY4SKT1) - 사이즈 & 후기 | 무신사"
 * 이걸 그대로 상품명 칸에 넣으면 받는 쪽 화면에서 두 줄로 넘친다.
 * 구분자 뒤를 떼되, **떼고 나서 빈 문자열이면 원본을 그대로 둔다** —
 * 제목 전체가 꼬리처럼 생긴 경우까지 지워버리면 칸이 비어버린다.
 */
export function toProductName(title: string): string {
  let out = title;
  for (const sep of [" | ", " - ", " – ", " :: "]) {
    const at = out.indexOf(sep);
    if (at > 0) out = out.slice(0, at);
  }
  out = out.trim();
  return out.length > 0 ? out : title.trim();
}

/**
 * 미리보기 카드.
 *
 * 읽히면 상품명을 그대로 옮겨 담을 수 있다 — 고수가 링크를 붙여넣고
 * 상품명을 다시 타이핑하는 게 이 화면에서 제일 손이 많이 가는 곳이다.
 * 못 읽으면 아무것도 그리지 않는다(null).
 */
export function LinkPreviewCard({
  url,
  onUseTitle,
}: {
  url: string;
  onUseTitle?: (title: string) => void;
}) {
  const { data, loading } = useLinkPreview(url);

  if (loading) {
    return (
      <p className="mt-1.5 text-[11.5px] text-neutral-500">
        링크 확인하는 중…
      </p>
    );
  }

  if (!data?.found || !data.title) return null;

  return (
    <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-brand-tint-b bg-brand-tint p-2">
      <span className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-brand-tint-b bg-bg">
        {data.image ? (
          // next/image를 쓰지 않는다. 어느 도메인이 올지 미리 알 수 없어서
          // remotePatterns에 등록할 수가 없다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt=""
            className="h-full w-full object-cover"
            // 이미지가 죽어 있어도 카드는 남아야 한다.
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <ImageIcon size={16} className="text-brand-dark" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-brand-dark">
          {data.title}
        </span>
        {data.site && (
          <span className="block truncate text-[11px] text-neutral-600">
            {data.site}
          </span>
        )}
      </span>

      {onUseTitle && (
        <button
          type="button"
          onClick={() => onUseTitle(toProductName(data.title!))}
          className="shrink-0 rounded-md border border-brand px-2 py-1.5 text-[11px] font-bold text-brand"
        >
          상품명에 넣기
        </button>
      )}
    </div>
  );
}
