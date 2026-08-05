"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  // 사진이 없으면 확대할 것도 없다.
  if (!src) return <PhotoBox className={className} iconSize={iconSize} />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="사진 크게 보기"
        className={`block w-full ${className}`}
      >
        <PhotoBox src={src} alt={alt} className="h-full w-full" iconSize={iconSize} />
      </button>

      {open && <Overlay src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

function Overlay({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    // 뒤에 깔린 글이 같이 스크롤되면 닫았을 때 엉뚱한 위치에 가 있다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    // 셸이 max-w-[430px]이라 fixed가 아니면 그 폭 안에 갇힌다.
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3"
    >
      <div className="relative h-full w-full">
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
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-[max(0.75rem,var(--safe-top))] right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[20px] leading-none text-white"
      >
        ×
      </button>
    </div>
  );
}
