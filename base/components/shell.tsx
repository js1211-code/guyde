import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * 모바일 퍼스트 셸(390px 기준). 데스크톱에서는 가운데 컬럼으로만 두고
 * 기기 프레임은 그리지 않는다 — 디자인 파일의 아이폰 프레임은 에디터 장식이다.
 *
 * ⚠️ 높이를 h-dvh로 주지 말 것. 설치형 iOS에서 첫 페인트 때 dvh가 안전 영역을
 * 뺀 높이(화면 − 노치 − 홈 인디케이터)를 돌려준다. 그러면 셸이 화면보다
 * 90pt쯤 짧아져서 탭바 밑이 텅 빈 채로 뜨고, 한 번 스크롤해서 다시 계산될 때
 * 비로소 화면 끝까지 늘어난다 — 실제 기기에서 그랬다.
 *
 * position:fixed + inset-0 은 dvh를 거치지 않고 화면(정확히는 visual viewport)에
 * 직접 맞춘다. 가로 가운데 정렬은 left/right:0 + margin-inline:auto 로 여전히 된다.
 *
 * 높이를 고정하는 목적은 그대로다: 셸이 내용만큼 늘어나면 ScreenBody의
 * overflow-y:auto가 발동할 일이 없어서 문서 전체가 스크롤되고, 탭바와 글쓰기
 * FAB이 화면이 아니라 문서 맨 아래에 붙는다(글이 많으면 끝까지 내려야 보인다).
 * 스크롤은 오직 ScreenBody 안에서만 일어나야 한다.
 *
 * ⚠️ 상단 pt-[var(--safe-top)]을 빼지 말 것. 설치형에서 화면이 상태바 밑까지
 * 올라가기 때문에, 없으면 노치·다이내믹 아일랜드가 상단바를 덮어 뒤로가기
 * 버튼이 안 눌린다. box-sizing이 border-box라 셸 높이는 그대로 유지된다 —
 * 여백만큼 내용 영역이 줄어들 뿐 화면 밖으로 넘치지 않는다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-paper pt-[var(--safe-top)] text-ink">
      <DemoRibbon />
      {children}
    </div>
  );
}

/**
 * 데모 배포본 표시.
 *
 * 고수 버전과 일반 버전을 두 창에 나란히 띄우고 시연하는데, 겉모습이 거의
 * 같아서 어느 쪽을 조작 중인지 헷갈린다. 발표 중에 반대쪽을 눌러버리면
 * 되돌리기가 어렵다. 그래서 고정 계정으로 배포한 쪽에만 띠를 붙인다.
 *
 * NEXT_PUBLIC_DEMO_LABEL이 없으면 아무것도 그리지 않는다 —
 * 실서비스 빌드에는 흔적이 남지 않는다.
 */
function DemoRibbon() {
  const label = process.env.NEXT_PUBLIC_DEMO_LABEL?.trim();
  if (!label) return null;

  return (
    // 절대 배치는 padding box 기준이라 그냥 두면 노치 밑으로 들어간다.
    <div className="pointer-events-none absolute top-[var(--safe-top)] right-0 z-50">
      <span className="block rounded-bl-lg bg-temp-hot px-2.5 py-1 text-[11px] font-bold text-brand-dark">
        {label}
      </span>
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
              ? "cond text-[17.5px] font-semibold tracking-[0.1em]"
              : "text-[17.5px] font-semibold"
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
      <h1 className="cond text-[24px] leading-none font-bold tracking-[0.1em]">
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
      // 설치형(standalone)에서는 홈 인디케이터가 이 자리에 겹친다.
      className={`px-4 pt-2 pb-[max(0.75rem,var(--safe-bottom))] ${
        bordered ? "border-t border-neutral-400" : ""
      }`}
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
  const cls = `cond block w-full rounded-md py-3.5 text-center text-[16px] font-bold ${
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
      className={`cond text-[13px] font-semibold tracking-wide text-neutral-600 ${className}`}
    >
      {children}
    </p>
  );
}

/** 브랜드 틴트 안내 띠 */
export function NoticeBar({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-y border-brand-tint-b bg-brand-tint px-4 py-2.5 text-[13.5px] text-brand-dark">
      {children}
    </p>
  );
}
