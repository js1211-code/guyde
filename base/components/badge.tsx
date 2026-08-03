import Image from "next/image";
import { ImageIcon } from "@/components/icons";
import { Reg } from "@/components/reg";

/** 카테고리 뱃지 — 회색 테두리. 주제(옷·스킨케어·바디&향수·자유). */
export function CategoryBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-neutral-400 px-1.5 py-px text-[10.5px] font-semibold text-neutral-600">
      {children}
    </span>
  );
}

/**
 * 글 유형 뱃지 (F-16) — 카드와 상세 헤더가 같은 문구를 쓴다.
 *   선택지투표  → [투표]           브랜드 채움
 *   무난함판정  → [무난함 82%]     틴트. 0표면 % 없이 [무난함]
 *   일반질문    → 뱃지 없음 (없는 것 자체가 "그냥 질문글" 신호)
 */
export function PostTypeBadge({
  postType,
  nanhanPercent,
}: {
  postType: string;
  nanhanPercent?: number | null;
}) {
  if (postType === "선택지투표") {
    return (
      <span className="bg-brand px-1.5 py-px text-[10.5px] font-bold text-white">
        투표
      </span>
    );
  }
  if (postType === "무난함판정") {
    return (
      <span className="border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[10.5px] font-bold text-brand-dark">
        {nanhanPercent === null || nanhanPercent === undefined
          ? "무난함"
          : `무난함 ${nanhanPercent}%`}
      </span>
    );
  }
  return null;
}

/** 내가 쓴 댓글 표시 */
export function MineBadge() {
  return (
    <span className="ml-1 border border-neutral-400 px-1 py-px text-[10px] font-semibold text-neutral-500">
      나
    </span>
  );
}

/** 선택 가능한 카테고리 칩 (글쓰기·고수 필터) */
export function Chip({
  children,
  selected = false,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  // 선택돼도 테두리는 유지하고 버건디 틴트로 연하게 채운다.
  // 꽉 찬 색으로 바꾸면 박스 선이 사라져서 뭐가 선택된 건지 흐려진다.
  const cls = `border px-2.5 py-1 text-[12px] ${
    selected
      ? "border-brand bg-brand/15 font-bold text-brand-dark"
      : "border-neutral-400 text-neutral-600"
  }`;
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cls}>
      {children}
    </button>
  );
}

/**
 * 사진 박스. url이 있으면 실제 이미지를, 없으면 자리표시자를 그린다.
 * 등록마크는 큰 박스에만 붙인다 — 작은 썸네일에 붙이면 지저분해진다.
 */
export function PhotoBox({
  src,
  alt = "",
  className = "",
  iconSize = 18,
  marks = true,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  iconSize?: number;
  marks?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-neutral-400 bg-brand-tint ${className}`}
    >
      {marks && <Reg size="sm" />}
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 430px) 100vw, 430px"
          className="object-cover"
        />
      ) : (
        <ImageIcon size={iconSize} className="text-brand-dark" />
      )}
    </div>
  );
}

/**
 * 빈 사진 추가 슬롯.
 * onPick을 주면 파일 선택창이 열린다(input은 감춰두고 라벨로 감싼다).
 */
export function PhotoSlot({
  onClick,
  onPick,
  disabled = false,
}: {
  onClick?: () => void;
  onPick?: (file: File) => void;
  disabled?: boolean;
}) {
  const cls =
    "flex h-[64px] w-[64px] cursor-pointer items-center justify-center border border-dashed border-neutral-400 text-neutral-500";

  if (onPick) {
    return (
      <label className={`${cls} ${disabled ? "opacity-50" : ""}`} aria-label="사진 추가">
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = "";
          }}
        />
        <PlusGlyph />
      </label>
    );
  }

  if (!onClick) return <div className={cls}><PlusGlyph /></div>;
  return (
    <button type="button" onClick={onClick} className={cls} aria-label="사진 추가">
      <PlusGlyph />
    </button>
  );
}

function PlusGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
