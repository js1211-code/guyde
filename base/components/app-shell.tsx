import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * 모바일 퍼스트 셸. 데스크톱에서는 폰 폭으로 가운데 정렬만 하고
 * 기기 프레임은 그리지 않는다(디자인 파일의 아이폰 프레임은 에디터 장식).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper text-ink">
      {children}
    </div>
  );
}

/** 스크롤되는 본문. 탭바가 있는 화면은 이 안에 넣는다. */
export function ScreenBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`scroll-area flex-1 ${className}`}>{children}</main>
  );
}

/**
 * 상단바. 화면마다 구성이 달라서 좌/중/우를 직접 넘긴다.
 * backHref를 주면 왼쪽에 뒤로가기 화살표를 그린다.
 */
export function TopBar({
  backHref,
  closeHref,
  title,
  right,
  bordered = true,
}: {
  backHref?: string;
  closeHref?: string;
  title?: React.ReactNode;
  right?: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <header
      className={`flex items-center justify-between px-4 py-2 ${
        bordered ? "border-b border-neutral-400" : ""
      }`}
    >
      <div className="flex w-6 items-center">
        {backHref && (
          <Link href={backHref} aria-label="뒤로">
            <ChevronLeftIcon size={20} />
          </Link>
        )}
        {closeHref && (
          <Link href={closeHref} aria-label="닫기">
            <CloseGlyph />
          </Link>
        )}
      </div>
      {title ? (
        <div className="text-[16px] font-semibold">{title}</div>
      ) : (
        <div />
      )}
      <div className="flex w-6 items-center justify-end">{right}</div>
    </header>
  );
}

function CloseGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** 화면 하단에 고정되는 액션 영역(제출 버튼 등) */
export function BottomBar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-t border-neutral-400 bg-paper px-4 pt-2 pb-3 ${className}`}>
      {children}
    </div>
  );
}

/** 섹션을 나누는 두꺼운 회색 띠 — 디자인의 border-bottom:8px */
export function SectionGap() {
  return <div className="h-2 bg-neutral-200" />;
}

/** 영문 소제목 (VOTE OPTIONS, ORDER, STATUS …) */
export function Kicker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`cond text-[12px] tracking-[0.1em] text-neutral-600 ${className}`}
    >
      {children}
    </div>
  );
}
