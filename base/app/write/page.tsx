import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CloseIcon, EyeIcon } from "@/components/icons";
import { WriteForm } from "@/components/write-form";
import { getCurrentUser } from "@/lib/mock";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ hearts?: string }>;
}) {
  const me = getCurrentUser();
  // ?hearts=0 으로 하트 부족 상태(디자인 07)를 그대로 열어볼 수 있다.
  const { hearts } = await searchParams;
  const heartBalance = hearts !== undefined ? Number(hearts) : me.heart_balance;

  return (
    <AppShell>
      <div className="relative flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-neutral-400 px-4 py-2">
          <Link href="/" aria-label="닫기">
            <CloseIcon size={20} />
          </Link>
          <span className="flex items-center gap-1 border border-neutral-400 px-2 py-1 text-[11.5px] font-semibold text-neutral-600">
            <EyeIcon size={12} />
            익명으로 올라가요
          </span>
        </header>

        <WriteForm heartBalance={Number.isFinite(heartBalance) ? heartBalance : 0} />
      </div>
    </AppShell>
  );
}
