import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * 모바일 퍼스트 셸(390px 기준). 데스크톱에서는 가운데 컬럼으로만 두고
 * 기기 프레임은 그리지 않는다 — 디자인 파일의 아이폰 프레임은 에디터 장식이다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper text-ink">
      {children}
    </div>
  );
}

export function ScreenBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={`scroll-area flex-1 ${className}`}>{children}</main>;
}

/** 뒤로가기 + 가운데 제목. 제목은 응축 서체가 기본. */
export function TopBar({
  backHref,
  title,
  right,
  bordered = true,
  cond = true,
}: {
  backHref?: string;
  title?: React.ReactNode;
  right?: React.ReactNode;
  bordered?: boolean;
  cond?: boolean;
}) {
  return (
    <header
      className={`flex items-center justify-between px-4 py-2 ${
        bordered ? "border-b border-neutral-400" : ""
      }`}
    >
      <span className="flex w-5 items-center">
        {backHref && (
          <Link href={backHref} aria-label="뒤로">
            <ChevronLeftIcon size={20} />
          </Link>
        )}
      </span>
      {title ? (
        <span
          className={
            cond
              ? "cond text-[16px] font-semibold tracking-[0.1em]"
              : "text-[16px] font-semibold"
          }
        >
          {title}
        </span>
      ) : (
        <span />
      )}
      <span className="flex w-5 items-center justify-end">{right}</span>
    </header>
  );
}

/** 탭 화면의 큰 제목 (매거진 / 고수 / 내정보) */
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-2.5">
      <h1 className="cond text-[22px] leading-none font-bold tracking-[0.1em]">
        {children}
      </h1>
    </div>
  );
}

/** 화면 하단 고정 액션 */
export function BottomBar({
  children,
  bordered = true,
}: {
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={`px-4 pt-2 pb-3 ${bordered ? "border-t border-neutral-400" : ""}`}
    >
      {children}
    </div>
  );
}

/** 브랜드 색 꽉 찬 주 버튼 */
export function PrimaryButton({
  children,
  href,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = `cond block w-full rounded-md py-3.5 text-center text-[15px] font-bold ${
    disabled ? "bg-neutral-300 text-neutral-500" : "bg-brand text-white"
  }`;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** 섹션을 나누는 두꺼운 회색 띠 */
export function SectionGap() {
  return <div className="h-2 bg-neutral-200" />;
}

/** 영문 소제목 (LATEST, OPTIONS, REVIEWS …) */
export function Kicker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`cond text-[12px] font-semibold tracking-wide text-neutral-600 ${className}`}
    >
      {children}
    </p>
  );
}

/** 브랜드 틴트 안내 띠 */
export function NoticeBar({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-y border-brand-tint-b bg-brand-tint px-4 py-2.5 text-[12.5px] text-brand-dark">
      {children}
    </p>
  );
}
