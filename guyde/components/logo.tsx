/**
 * GUYDE 브랜드 마크 — claude.ai/design "Guyde Logo"에서 가져왔다.
 *
 * 모양은 넥타이다. 위 두 원이 셔츠 깃, 가운데 작은 원이 매듭, 아래로 떨어지는
 * 좁은 삼각형이 타이. 지금 여는 컨설팅이 '옷' 하나라서 마크와 서비스가 맞물린다.
 *
 * 색은 원본 디자인 시스템(금색 accent)을 따르지 않고 currentColor를 쓴다.
 * 그 파일은 범용 템플릿이라 우리 팔레트가 아니고, 마크는 헤더(브라운)·앱
 * 아이콘(크림)·다크 타일에서 각각 다른 색으로 놓여야 한다.
 */

type Props = { size?: number; className?: string; strokeWidth?: number };

/**
 * 크기별 획 굵기. 원본의 "Minimum sizes" 검사에서 가져온 값이다.
 * 작아질수록 굵게 하지 않으면 획이 사라져서 얼룩으로 보인다 —
 * 72px에서 3.5인 굵기를 22px에 그대로 쓰면 마크가 뭉갠다.
 */
function strokeFor(size: number) {
  if (size >= 64) return 3.5;
  if (size >= 32) return 5;
  return 7;
}

export function LogoMark({ size = 24, className, strokeWidth }: Props) {
  const w = strokeWidth ?? strokeFor(size);
  // 아주 작을 때는 깃도 키운다. 원본의 22px 변형과 같은 처리다.
  const tiny = size < 32;
  const collarR = tiny ? 8 : 7;
  const collarY = tiny ? 18 : 17;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 셔츠 깃 */}
      <circle cx="14" cy="13" r={collarR} />
      <circle cx="86" cy="13" r={collarR} />
      {/* 깃에서 매듭으로 */}
      <path d={`M20 ${collarY} L50 55`} />
      <path d={`M80 ${collarY} L50 55`} />
      {/* 매듭 */}
      <circle cx="50" cy="55" r={tiny ? 4 : 3.5} strokeWidth={w * 0.86} />
      {/* 타이 */}
      <path d="M43 56 L50 92 L57 56" />
    </svg>
  );
}

/**
 * 마크 + 워드마크 잠금형(lockup).
 * 워드마크는 응축 서체(.cond)에 자간을 넓게 — 원본의 letter-spacing 0.06em.
 */
export function Logo({
  size = 26,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} className="text-brand" />
      <span
        className="cond leading-none font-bold tracking-[0.1em]"
        style={{ fontSize: `${size * 0.92}px` }}
      >
        GUYDE
      </span>
    </span>
  );
}
