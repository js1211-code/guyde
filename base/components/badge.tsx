/**
 * 뱃지 — 익명 / D-day / 카테고리 / 등급 / BEST / 채택됨 등 전부 여기서 나온다.
 * 모서리는 전부 직각(디자인 시스템 규칙).
 */

type Variant =
  | "outline" // 익명, 카테고리 — 회색 테두리
  | "accent" // D-day, BEST — 강조색 채움
  | "ink" // 내가 쓴 글, 마스터 — 먹색 채움
  | "outline-accent" // 성실 답변러, 채택하기 — 강조색 테두리
  | "soft"; // 안내 배너 톤 — 연한 강조 배경

const VARIANTS: Record<Variant, string> = {
  outline: "border border-neutral-400 text-neutral-600",
  accent: "bg-accent text-white",
  ink: "bg-ink text-white",
  "outline-accent": "border border-accent text-accent-700",
  soft: "bg-accent-100 border border-accent-200 text-neutral-700",
};

export function Badge({
  children,
  variant = "outline",
  cond = false,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  /** 영문·숫자 라벨이면 Barlow Condensed로 */
  cond?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px text-[10.5px] font-semibold ${
        VARIANTS[variant]
      } ${cond ? "cond tracking-[0.08em] font-bold" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

/** 카테고리 칩 — 글쓰기 화면의 선택 가능한 큰 뱃지 */
export function CategoryChip({
  children,
  selected = false,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      className={`px-2.5 py-1 text-[12.5px] ${
        selected
          ? "bg-accent font-bold text-white"
          : "border border-neutral-400 text-neutral-600"
      }`}
    >
      {children}
    </Tag>
  );
}

/** 하트 잔액 칩 — 피드 헤더의 "♥ 12" */
export function HeartCount({
  value,
  children,
}: {
  value: number;
  children?: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 border border-neutral-400 px-2 py-1">
      {children}
      <span className="cond text-[15px] leading-none font-bold text-accent-700">
        {value}
      </span>
    </span>
  );
}
