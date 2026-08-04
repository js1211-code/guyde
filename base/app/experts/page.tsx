import Link from "next/link";
import { StarIcon } from "@/components/icons";
import { AppShell, NoticeBar, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import { EXPERT_TOP_PERCENT } from "@/lib/constants";
import { CONSULTING_PRICE, getExperts } from "@/lib/mock";

/**
 * ⑭ 고수 목록.
 *
 * v3에서 전문분야 필터가 사라졌다. 지금 여는 컨설팅은 '옷' 하나뿐이고
 * 가격도 전원 동일해서, 고를 축이 "누구에게 맡길까" 밖에 없다.
 * 필터 칩을 남겨두면 선택지가 하나뿐인 필터가 돼서 오히려 헷갈린다.
 */
export default function ExpertsPage() {
  const experts = getExperts();

  return (
    <AppShell>
      <PageTitle>컨설팅</PageTitle>
      <NoticeBar>
        온도 상위 {EXPERT_TOP_PERCENT}%만 고수가 될 수 있어요
      </NoticeBar>

      <ScreenBody className="px-4 pt-3">
        <p className="mb-3 text-[12.5px] leading-relaxed text-neutral-600">
          설문을 넣으면 48시간 안에 진단·피해야 할 것·착장 1세트가 도착해요.
          <br />
          답변이 불만족스러우면 100% 환불돼요.
        </p>

        {experts.map((e) => (
          <Link
            key={e.id}
            href={`/experts/${e.id}`}
            className="card mb-3 block rounded-2xl p-4"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-bold">{e.nickname}</span>
              <Temperature value={e.temperature} size={13} />
              <span className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold">
                <StarIcon />
                {e.rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700">
              {e.intro}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-neutral-500">
                답변 {e.answered_count}건
              </span>
              <span className="cond rounded-md bg-brand px-3 py-1.5 text-[13px] font-bold text-white">
                ₩{e.price.toLocaleString("ko-KR")}
              </span>
            </div>
          </Link>
        ))}

        <p className="mt-1 mb-4 text-center text-[11.5px] text-neutral-500">
          컨설팅은 건당 ₩{CONSULTING_PRICE.toLocaleString("ko-KR")} 단일가예요
        </p>
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}
