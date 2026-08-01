import Link from "next/link";
import { AppShell, ScreenBody } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { InfoIcon, SearchIcon } from "@/components/icons";
import { AvatarBox } from "@/components/photo";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import { EXPERT_TOP_PERCENT } from "@/lib/constants";
import { getExperts } from "@/lib/mock";

export default function ExpertsPage() {
  const experts = getExperts();

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <h1 className="text-[19px] font-bold">컨설팅</h1>
        <button type="button" aria-label="고수 검색">
          <SearchIcon size={20} />
        </button>
      </header>

      <p className="mx-4 mb-3 flex items-center gap-1.5 border border-accent-200 bg-accent-100 px-3 py-2 text-[12px] text-neutral-700">
        <InfoIcon size={13} className="shrink-0 text-accent-700" />
        온도 상위 {EXPERT_TOP_PERCENT}%만 고수가 될 수 있어요
      </p>

      <ScreenBody>
        {experts.map((e) => (
          <Link
            key={e.id}
            href={`/experts/${e.id}`}
            className="mx-4 mb-2.5 flex items-center gap-3 border border-neutral-500 p-3.5"
          >
            <AvatarBox size={48} iconSize={22} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold">{e.nickname}</span>
                <Temperature value={e.temperature} />
                <Badge>{e.expertise_area}</Badge>
              </div>
              <p className="mt-1 text-[12px] text-neutral-600">
                답변{" "}
                <span className="cond font-semibold text-neutral-700">
                  {e.answers}
                </span>{" "}
                · 베스트{" "}
                <span className="cond font-semibold text-neutral-700">
                  {e.best}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="cond text-[16px] leading-none font-bold text-accent-700">
                ₩{e.from_price.toLocaleString("ko-KR")}
              </p>
              <p className="mt-1 text-[10.5px] text-neutral-600">부터</p>
            </div>
          </Link>
        ))}
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}
