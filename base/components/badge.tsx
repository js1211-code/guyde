import Image from "next/image";
import { ImageIcon } from "@/components/icons";

/** 카테고리 뱃지 — 회색 테두리. 주제(옷·스킨케어·바디&향수·자유). */
export function CategoryBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-xs border border-neutral-400 px-1.5 py-px text-[10.5px] font-semibold text-neutral-600">
      {children}
    </span>
  );
}

/**
 * 글 유형 뱃지 (F-16) — 카드와 상세 헤더가 같은 문구를 쓴다.
 *   선택지투표  → [투표]           브랜드 채움
 *   무난함판정  → [무난함 82%]     틴트. 0표면 % 없이 [무난함]
 *   정보공유    → [정보]           테두리만. 질문이 아니라는 표시
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
      <span className="rounded-xs bg-brand px-1.5 py-px text-[10.5px] font-bold text-white">
        투표
      </span>
    );
  }
  if (postType === "정보공유") {
    // 질문글 사이에서 "이건 답이 있는 글"이라고 알리는 게 목적이라
    // 채움 없이 테두리만 준다 — 투표 뱃지보다 조용해야 한다.
    return (
      <span className="rounded-xs border border-brand px-1.5 py-px text-[10.5px] font-bold text-brand">
        정보
      </span>
    );
  }
  if (postType === "무난함판정") {
    return (
      <span className="rounded-xs border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[10.5px] font-bold text-brand-dark">
        {nanhanPercent === null || nanhanPercent === undefined
          ? "무난함"
          : `무난함 ${nanhanPercent}%`}
      </span>
    );
  }
  return null;
}

/**
 * 고수 뱃지.
 *
 * ⚠️ 온도로 판별하지 말 것. 42.0도는 고수가 되기 위한 **자격 조건**이지
 * 고수라는 뜻이 아니다. 실제 고수는 `experts`에 행이 있는 사람이고,
 * 그 값이 뷰의 is_expert로 내려온다.
 * 온도로 붙이면 42도 넘긴 일반 유저에게 고수 표시가 달린다 —
 * 이 서비스에서 제일 하면 안 되는 거짓 표시다.
 *
 * 색은 고수 온도와 같은 금색. 숫자를 안 읽어도 같은 신호로 보이게.
 */
export function ExpertBadge() {
  return (
    <span className="rounded-xs bg-temp-hot px-1.5 py-px text-[10px] font-bold text-brand-dark">
      고수
    </span>
  );
}

/** 내가 쓴 댓글 표시 */
export function MineBadge() {
  return (
    <span className="ml-1 rounded-xs border border-neutral-400 px-1 py-px text-[10px] font-semibold text-neutral-500">
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
  // 선택돼도 테두리는 유지하고 브랜드 틴트로 연하게 채운다.
  // 꽉 찬 색으로 바꾸면 박스 선이 사라져서 뭐가 선택된 건지 흐려진다.
  const cls = `rounded-full border px-2.5 py-1 text-[12px] ${
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
 */
export function PhotoBox({
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
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-neutral-400 bg-brand-tint ${className}`}
    >
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
    "flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-400 text-neutral-500";

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
