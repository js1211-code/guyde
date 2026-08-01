import { ImageIcon, UserIcon } from "@/components/icons";

/**
 * 사진 자리표시자. 아직 Storage 연결 전이라 전 화면이 이걸 쓴다.
 * 실제 이미지가 붙으면 src를 받아 <img>로 바꾸면 된다.
 */
export function PhotoBox({
  className = "",
  iconSize = 18,
  /** 좌상단에 붙는 A/B 같은 표식 */
  tag,
  /** 하단 캡션 */
  caption,
}: {
  className?: string;
  iconSize?: number;
  tag?: string;
  caption?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 border border-neutral-400 bg-accent-100 ${className}`}
    >
      {tag && (
        <span className="cond absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center bg-ink text-[13px] font-bold text-white">
          {tag}
        </span>
      )}
      <ImageIcon size={iconSize} className="text-accent-400" />
      {caption && (
        <span className="cond text-[11px] tracking-wide text-accent-600">
          {caption}
        </span>
      )}
    </div>
  );
}

/** 프로필 아바타 자리표시자 */
export function AvatarBox({
  size = 56,
  iconSize = 26,
}: {
  size?: number;
  iconSize?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center border border-neutral-500 bg-accent-100"
      style={{ width: size, height: size }}
    >
      <UserIcon size={iconSize} className="text-accent-400" />
    </div>
  );
}
