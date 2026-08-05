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
 * 투표 — 체크한 투표용지.
 *
 * 후보를 여섯 개 그려서 12px로 나란히 놓고 골랐다. 투표함 계열은 작아지면
 * 도장·서류가방·다운로드로 읽히고, 손가락이나 선택지 목록은 획이 많아 뭉갠다.
 * 세로로 긴 용지 + 체크 하나가 이 크기에서 형태가 남는 유일한 조합이었다.
 *
 * CheckIcon(체크만)과는 용지 테두리가 있어서 구분된다.
 */
export const VoteIcon = (p: P) => (
  <S {...p}>
    <path d="M6 3h12v18H6z" />
    <path d="M9.5 11.5 12 14l4-4.5" />
  </S>
);

/**
 * 착장 슬롯 아이콘 3종.
 * 답변 작성·열람 화면에서 상의/하의/신발 옆에 붙는다.
 * 15~17px로 쓰이므로 안쪽 디테일은 넣지 않았다 — 이 크기에서는 실루엣만 남는다.
 */

/** 상의 — 티셔츠. 원본 디자인 파일이 쓰던 모양 그대로. */
export const ShirtIcon = (p: P) => (
  <S {...p}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />
  </S>
);

/** 하의 — 바지. 허리선 + 가랑이에서 갈라지는 두 다리. */
export const PantsIcon = (p: P) => (
  <S {...p}>
    <path d="M4.5 2h15l-.8 20h-5.4L12 11.5 10.7 22H5.3z" />
    <path d="M4.5 7.5h15" />
  </S>
);

/** 신발 — 옆에서 본 스니커즈. 발등에서 앞코로 이어지고 바닥이 받친다. */
export const ShoeIcon = (p: P) => (
  <S {...p}>
    <path d="M2.5 5.5H6l3 4.5h4c4.6 0 8 2.6 8.7 6.5h-19z" />
    <path d="M2 16.5h20V19a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
  </S>
);

/** 삭제 — 쓰레기통. 뚜껑·몸통·안쪽 세로선. */
export const TrashIcon = (p: P) => (
  <S {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </S>
);

/** 신고 — 경찰차 위 사이렌. 등피 + 받침 + 퍼지는 빛. */
export const SirenIcon = (p: P) => (
  <S {...p}>
    <path d="M9 15V9a3 3 0 0 1 6 0v6" />
    <path d="M6.5 15h11a1.5 1.5 0 0 1 1.5 1.5v2h-14v-2A1.5 1.5 0 0 1 6.5 15z" />
    <path d="M4 8.5 2.5 7.5" />
    <path d="M20 8.5 21.5 7.5" />
    <path d="M12 4V2.5" />
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
