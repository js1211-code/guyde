import Link from "next/link";
import { AppShell, ScreenBody } from "@/components/app-shell";
import { HeartCount } from "@/components/badge";
import { FeedList } from "@/components/feed-list";
import { BellIcon, HeartIcon } from "@/components/icons";
import { TabBar } from "@/components/tab-bar";
import { getCurrentUser, getFeed, getFeedCount } from "@/lib/mock";

export default function HomePage() {
  const me = getCurrentUser();
  const feed = getFeed();

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <div>
          <div className="cond text-[24px] leading-none font-bold tracking-[0.14em]">
            BASE<span className="text-accent">+</span>
          </div>
          <p className="mt-0.5 text-[10px] tracking-wide text-neutral-600">
            일단, 베이스부터.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/me/hearts" aria-label="하트 내역">
            <HeartCount value={me.heart_balance}>
              <HeartIcon size={14} className="text-accent-700" />
            </HeartCount>
          </Link>
          <button type="button" aria-label="알림">
            <BellIcon size={21} />
          </button>
        </div>
      </header>

      <ScreenBody>
        <FeedList items={feed} totalCount={getFeedCount()} />
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}
