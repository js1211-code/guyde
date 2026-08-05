"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PhotoBox } from "@/components/badge";

/**
 * 사진을 눌러 원본 비율로 크게 본다.
 *
 * 목록에서는 카드 높이를 맞추려고 `object-cover`로 잘라서 보여준다.
 * 그런데 무난함 판정글은 잘린 부분을 보고 판단할 수가 없다 —
 * 신발만 잘려나간 전신 사진에 "무난해요"를 누르라고 할 수는 없다.
 * 그래서 누르면 잘리지 않은 원본을 덮어 띄운다(`object-contain`).
 *
 * 새 라우트를 만들지 않는다. 주소가 바뀌면 뒤로가기로 닫히는 대신
 * 글 목록까지 돌아가버린다.
 */
export function ZoomablePhoto({
  src,
  alt = "",
  className = "",
  iconSize = 18,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  iconSize?: number;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  // 확대가 어디서 출발할지. 누른 순간의 위치를 재둔다.
  const [origin, setOrigin] = useState<DOMRect | null>(null);

  // 사진이 없으면 확대할 것도 없다.
  if (!src) return <PhotoBox className={className} iconSize={iconSize} />;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOrigin(btnRef.current?.getBoundingClientRect() ?? null)}
        aria-label="사진 크게 보기"
        className={`block w-full ${className}`}
      >
        <PhotoBox src={src} alt={alt} className="h-full w-full" iconSize={iconSize} />
      </button>

      {origin && (
        <Overlay
          src={src}
          alt={alt}
          origin={origin}
          onClose={() => setOrigin(null)}
        />
      )}
    </>
  );
}

/** 열고 닫는 데 걸리는 시간. 더 길면 확대가 아니라 기다림이 된다. */
const DURATION = 280;
const EASE = "cubic-bezier(0.2, 0, 0.2, 1)";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 글 안의 작은 사진에서 전체 화면으로 자라난다(FLIP).
 *
 * 먼저 최종 위치에 그려놓고, 처음 한 프레임만 **누른 사진의 자리와 크기로
 * 되돌려놓은 다음** 원위치로 애니메이션한다. 반대로 하면(작은 데서 시작해
 * 커지게 하면) 매 프레임 레이아웃이 다시 잡혀서 끊긴다.
 *
 * 크기는 transform으로만 바꾼다 — width/height를 애니메이션하면 프레임마다
 * 레이아웃과 이미지 리샘플링이 일어난다.
 */
function Overlay({
  src,
  alt,
  origin,
  onClose,
}: {
  src: string;
  alt: string;
  origin: DOMRect;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // 닫는 중에 또 누르면 애니메이션이 겹친다.
  const closing = useRef(false);

  useEffect(() => {
    // 뒤에 깔린 글이 같이 스크롤되면 닫았을 때 엉뚱한 위치에 가 있다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /**
   * 최종 상자를 "누른 사진과 똑같이 보이는 상태"로 되돌리는 값.
   *
   * 배율만으로는 안 된다. 목록의 사진은 object-cover로 **잘려** 있어서
   * 가로세로 비율이 확대본과 다르다(예: 398×160 대 477×747). 배율만 주면
   * 시작 프레임이 썸네일과 전혀 다른 모양이라 "그 자리에서 자란다"로 안 보인다.
   *
   * 그래서 clip-path로 보이는 창까지 같이 좁힌다. 배율은 **이미지 내용의 크기**가
   * 맞도록 폭 기준으로 잡고(찌그러지지 않게 균일하게), 창은 그 배율을 되돌린
   * 로컬 좌표에서 썸네일 높이만큼만 남긴다. 두 개를 같이 주면 시작 프레임이
   * 썸네일과 픽셀 단위로 겹친다.
   *
   * clip-path는 transform보다 **먼저** 적용되므로 인셋은 변환 전 좌표로 쓴다.
   */
  function originKeyframe(box: DOMRect) {
    const scale = origin.width / box.width;
    const dx = origin.left + origin.width / 2 - (box.left + box.width / 2);
    const dy = origin.top + origin.height / 2 - (box.top + box.height / 2);

    // 화면에서 origin.height로 보이려면 변환 전에는 이만큼이어야 한다.
    const windowH = origin.height / scale;
    const cut = Math.max(0, (box.height - windowH) / 2);

    return {
      transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      clipPath: `inset(${cut}px 0px ${cut}px 0px)`,
    };
  }

  /**
   * 재는 동안에는 이 요소에 걸린 애니메이션이 없어야 한다.
   * 남아 있으면 getBoundingClientRect가 **변환이 적용된** 상자를 돌려줘서
   * 출발 지점을 자기 자신 기준으로 계산해버린다(배율이 1에 수렴한다).
   * 개발 모드는 이펙트를 두 번 실행하므로 실제로 이 일이 벌어졌다.
   */
  function measure(el: HTMLElement) {
    el.getAnimations().forEach((a) => a.cancel());
    return el.getBoundingClientRect();
  }

  // 열기 — 첫 프레임에만 썸네일 자리로 되돌렸다가 제자리로 온다.
  useEffect(() => {
    const box = boxRef.current;
    const backdrop = backdropRef.current;
    if (!box || !backdrop || prefersReducedMotion()) return;

    const from = originKeyframe(measure(box));
    box.animate(
      [
        { ...from, opacity: 0.85 },
        { transform: "none", clipPath: "inset(0px)", opacity: 1 },
      ],
      { duration: DURATION, easing: EASE },
    );
    backdrop.getAnimations().forEach((a) => a.cancel());
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: DURATION,
      easing: EASE,
    });
    // origin은 열릴 때 한 번 정해지고 바뀌지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (closing.current) return;
    closing.current = true;

    const box = boxRef.current;
    const backdrop = backdropRef.current;
    if (!box || !backdrop || prefersReducedMotion()) {
      onClose();
      return;
    }

    // fill:"forwards" — 애니메이션이 끝난 뒤 원래 자리로 튀어 보이지 않게
    // 마지막 프레임을 붙잡고 있다가 그대로 사라진다.
    const opts = { duration: DURATION, easing: EASE, fill: "forwards" as const };
    const to = originKeyframe(measure(box));
    box.animate(
      [
        { transform: "none", clipPath: "inset(0px)", opacity: 1 },
        { ...to, opacity: 0.85 },
      ],
      opts,
    );
    backdrop.getAnimations().forEach((a) => a.cancel());
    const fade = backdrop.animate([{ opacity: 1 }, { opacity: 0 }], opts);
    fade.onfinish = onClose;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // 셸이 max-w-[430px]이라 fixed가 아니면 그 폭 안에 갇힌다.
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100]">
      <div
        ref={backdropRef}
        onClick={close}
        className="absolute inset-0 bg-black/90"
      />

      <div
        ref={boxRef}
        onClick={close}
        // 여기가 '최종 자리'다. 애니메이션은 이 상자를 출발점으로 되돌렸다가
        // 놓아주는 것뿐이라, 레이아웃은 처음부터 끝까지 이 값 그대로다.
        className="absolute inset-3 will-change-[transform,clip-path]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          // contain이라 잘리지 않는다. 세로로 긴 사진도 전체가 들어온다.
          className="object-contain"
        />
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="닫기"
        className="absolute top-[max(0.75rem,var(--safe-top))] right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[20px] leading-none text-white"
      >
        ×
      </button>
    </div>
  );
}
