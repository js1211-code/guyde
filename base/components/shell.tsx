import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * 모바일 퍼스트 셸(390px 기준). 데스크톱에서는 가운데 컬럼으로만 두고
 * 기기 프레임은 그리지 않는다 — 디자인 파일의 아이폰 프레임은 에디터 장식이다.
 *
 * ⚠️ 높이는 h-dvh 고정이어야 한다. min-h-dvh로 두면 셸이 내용만큼 늘어나고,
 * 그러면 ScreenBody의 overflow-y:auto가 발동할 일이 없어서 문서 전체가
 * 스크롤된다. 결과적으로 탭바와 글쓰기 FAB이 화면이 아니라 문서 맨 아래에
 * 붙어서, 글이 많으면 끝까지 내려야 보인다.
 * 스크롤은 오직 ScreenBody 안에서만 일어나야 한다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-paper text-ink">
      {children}
    </div>
  );
}

/**
 * 화면의 유일한 스크롤 영역.
 * min-h-0이 없으면 flex 자식의 기본 min-height:auto 때문에 내용만큼 늘어나서
 * overflow가 안 잡힌다 — flex + overflow 조합에서 매번 걸리는 지점이다.
 */
export function ScreenBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`scroll-area min-h-0 flex-1 ${className}`}>{children}</main>
  );
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

/** 탭 화면의 큰 제목 (도서관 / 컨설팅 / 내정보) */
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
