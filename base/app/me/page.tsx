import Link from "next/link";
import { AppShell, ScreenBody, SectionGap } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import {
  ChevronRightIcon,
  HeartIcon,
  SettingsIcon,
  ThermometerIcon,
  TrophyIcon,
} from "@/components/icons";
import { AvatarBox } from "@/components/photo";
import { TabBar } from "@/components/tab-bar";
import { TemperatureGauge } from "@/components/temperature";
import { EXPERT_TOP_PERCENT } from "@/lib/constants";
import { getCurrentUser, getMyActivity } from "@/lib/mock";

// href가 없는 항목은 아직 화면이 없다(IA 밖). 죽은 링크 대신 비활성 행으로 둔다.
const MENU: { label: string; href?: string }[] = [
  { label: "내가 쓴 질문" },
  { label: "내 유형테스트 결과", href: "/quiz/result/qr-1" },
  { label: "공지사항" },
];

export default function MePage() {
  const me = getCurrentUser();
  const activity = getMyActivity();
  // 상위 10% 진입까지의 진행률
  const gateProgress = Math.round(
    ((100 - activity.top_percent) / (100 - EXPERT_TOP_PERCENT)) * 100,
  );

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="text-[19px] font-bold">마이</h1>
        <button type="button" aria-label="설정">
          <SettingsIcon size={21} />
        </button>
      </header>

      <ScreenBody>
        <section className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-3">
            <AvatarBox />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-bold">{me.nickname}</span>
                <Badge variant="outline-accent" cond>
                  {me.grade}
                </Badge>
              </div>
              <p className="mt-0.5 text-[12.5px] text-neutral-600">
                답변은 닉네임과 온도로 노출돼요
              </p>
            </div>
          </div>

          <div className="mt-4 border border-neutral-500 p-3">
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1 text-[13px] font-semibold text-neutral-600">
                <ThermometerIcon size={14} className="text-temp-hot" />내 온도
              </span>
              <span className="cond text-[26px] leading-none font-bold text-temp-hot">
                {me.temperature.toFixed(1)}°C
              </span>
            </div>
            <TemperatureGauge value={me.temperature} />
          </div>

          <div className="mt-2 flex items-center justify-between border border-neutral-400 p-3">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-600">
              <HeartIcon size={14} className="text-accent-700" />
              하트 잔액
            </span>
            <div className="flex items-center gap-2">
              <span className="cond text-[18px] leading-none font-bold text-accent-700">
                {me.heart_balance}
              </span>
              <Link
                href="/me/hearts"
                className="bg-accent px-2.5 py-1 text-[12px] font-semibold text-white"
              >
                충전
              </Link>
            </div>
          </div>
        </section>

        <SectionGap />

        <section className="px-4 pt-3.5 pb-4">
          <h2 className="mb-2.5 text-[14px] font-bold">내 활동</h2>
          <div className="grid grid-cols-3 border border-neutral-400 py-3">
            <Stat value={activity.answers} label="답변" />
            <Stat value={activity.upvotes_received} label="받은 추천" />
            <Stat value={activity.best_answers} label="베스트 답변" accent last />
          </div>

          <div className="mt-2.5 border border-accent-200 bg-accent-100 p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 font-semibold">
                <TrophyIcon size={14} />
                고수 등급 도전 중
              </span>
              <span className="cond text-[15px] font-bold text-accent-700">
                TOP {activity.top_percent}%
              </span>
            </div>
            <div className="relative mt-2 h-2 border border-accent-300 bg-white">
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: `${gateProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-600">
              상위 {EXPERT_TOP_PERCENT}% 진입 시 고수 뱃지가 달려요
            </p>
          </div>
        </section>

        <SectionGap />

        <nav className="px-4 pt-1.5">
          {MENU.map((item, i) => {
            const className = `flex items-center justify-between py-3 ${
              i < MENU.length - 1
                ? "border-b border-dashed border-neutral-400"
                : ""
            }`;
            const inner = (
              <>
                <span className="text-[14px]">{item.label}</span>
                <ChevronRightIcon size={16} className="text-neutral-500" />
              </>
            );

            return item.href ? (
              <Link key={item.label} href={item.href} className={className}>
                {inner}
              </Link>
            ) : (
              <div key={item.label} className={className}>
                {inner}
              </div>
            );
          })}
        </nav>
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}

function Stat({
  value,
  label,
  accent = false,
  last = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${
        last ? "" : "border-r border-dashed border-neutral-400"
      }`}
    >
      <span
        className={`cond text-[20px] leading-none font-bold ${
          accent ? "text-accent-700" : ""
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] text-neutral-600">{label}</span>
    </div>
  );
}
