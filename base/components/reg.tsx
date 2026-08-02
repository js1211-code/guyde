/**
 * 등록마크(+) — 청사진 컨셉의 시그니처.
 * 인쇄 도면의 레지스트레이션 마크를 흉내낸 것으로, 박스 모서리 바깥에 걸친다.
 * 부모에 `relative`가 있어야 한다.
 *
 *   <div className="relative border border-neutral-400 p-3">
 *     <Reg corners="tl br" />
 *     ...
 *   </div>
 */

type Corner = "tl" | "tr" | "bl" | "br";

// 디자인 파일의 오프셋을 그대로 옮긴 값. 위/아래가 비대칭인 건
// 글자 baseline 때문이라 일부러 맞춰둔 것이다.
const POS: Record<Corner, string> = {
  tl: "-top-[8px] -left-[4px]",
  tr: "-top-[8px] -right-[4px]",
  bl: "-bottom-[10px] -left-[4px]",
  br: "-bottom-[10px] -right-[4px]",
};

const POS_SM: Record<Corner, string> = {
  tl: "-top-[7px] -left-[3px]",
  tr: "-top-[7px] -right-[3px]",
  bl: "-bottom-[9px] -left-[3px]",
  br: "-bottom-[9px] -right-[3px]",
};

export function Reg({
  corners = "tl br",
  size = "md",
  className = "",
}: {
  /** 공백으로 구분한 모서리 목록. 기본은 대각선 두 개. */
  corners?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const list = corners.split(/\s+/).filter(Boolean) as Corner[];
  const pos = size === "sm" ? POS_SM : POS;
  const fontSize = size === "sm" ? "text-[12px]" : "text-[14px]";

  return (
    <>
      {list.map((c) => (
        <span key={c} className={`reg ${pos[c]} ${fontSize} ${className}`}>
          +
        </span>
      ))}
    </>
  );
}
