/** v3에서 쓰는 아이콘만. 전부 currentColor라 색은 text-* 로 준다. */

type P = { size?: number; className?: string; strokeWidth?: number };

function S({
  size = 20,
  className,
  strokeWidth = 1.5,
  children,
}: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const HeartIcon = (p: P) => (
  <S {...p}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </S>
);

/**
 * 투표 — 투표함에 용지를 넣는 모양.
 * 체크·막대그래프도 후보였지만, 체크는 완료(CheckIcon)와 겹치고
 * 막대그래프는 통계로 읽힌다. "표를 던졌다"가 바로 읽히는 쪽을 골랐다.
 */
export const VoteIcon = (p: P) => (
  <S {...p}>
    <path d="M4 14h16v6H4z" />
    <path d="M9 14V4h6v10" />
    <path d="M12 7v4" />
  </S>
);

export const HomeIcon = (p: P) => (
  <S {...p}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 9.5V21h14V9.5" />
  </S>
);

export const BookIcon = (p: P) => (
  <S {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </S>
);

export const BriefcaseIcon = (p: P) => (
  <S {...p}>
    <rect x="2" y="7" width="20" height="14" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </S>
);

export const UserIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </S>
);

export const PlusIcon = (p: P) => (
  <S {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </S>
);

export const ChevronLeftIcon = (p: P) => (
  <S strokeWidth={1.8} {...p}>
    <path d="m15 18-6-6 6-6" />
  </S>
);

export const ChevronRightIcon = (p: P) => (
  <S {...p}>
    <path d="m9 18 6-6-6-6" />
  </S>
);

export const MoreIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </S>
);

export const MessageIcon = (p: P) => (
  <S {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </S>
);

export const ThumbsUpIcon = (p: P) => (
  <S {...p}>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </S>
);

export const CheckIcon = (p: P) => (
  <S strokeWidth={2} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);

export const ImageIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="3" width="18" height="18" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </S>
);

export const PencilIcon = (p: P) => (
  <S {...p}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </S>
);

export const LockIcon = (p: P) => (
  <S strokeWidth={1.8} {...p}>
    <rect x="3" y="11" width="18" height="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </S>
);

export const RefreshIcon = (p: P) => (
  <S strokeWidth={1.8} {...p}>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </S>
);

export const ArrowUpRightIcon = (p: P) => (
  <S strokeWidth={1.8} {...p}>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </S>
);

/** 별점 — 유일하게 채워서 쓰는 아이콘 */
export const StarIcon = ({ size = 13, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2l2.9 6.9 7.1.6-5.4 4.6 1.6 7-6.2-3.8L6 21.1l1.6-7L2.2 9.5l7.1-.6z" />
  </svg>
);
