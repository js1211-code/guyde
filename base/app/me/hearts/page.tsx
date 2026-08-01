import { AppShell, ScreenBody, SectionGap, TopBar } from "@/components/app-shell";
import { HeartLedger } from "@/components/heart-ledger";
import { AD_REWARD_HEARTS } from "@/lib/constants";
import { getCurrentUser, getHeartTransactions } from "@/lib/mock";

export default function HeartsPage() {
  const me = getCurrentUser();

  return (
    <AppShell>
      <TopBar backHref="/me" title="하트 내역" />

      <ScreenBody>
        <section className="px-4 pt-4 pb-4">
          <div className="flex items-center justify-between border border-neutral-500 p-4">
            <div>
              <p className="cond text-[12px] tracking-[0.12em] text-neutral-600">
                MY HEARTS
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="cond text-[36px] leading-none font-bold text-accent-700">
                  {me.heart_balance}
                </span>
                <span className="text-[13px] text-neutral-600">개</span>
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="bg-accent px-3 py-1.5 text-center text-[12px] font-semibold text-white"
              >
                충전
              </button>
              <button
                type="button"
                className="border border-neutral-400 px-3 py-1.5 text-center text-[12px] font-semibold text-neutral-700"
              >
                광고 보기 +{AD_REWARD_HEARTS}
              </button>
            </div>
          </div>
        </section>

        <SectionGap />

        <HeartLedger items={getHeartTransactions()} />
      </ScreenBody>
    </AppShell>
  );
}
