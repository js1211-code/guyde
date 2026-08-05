"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StarIcon } from "@/components/icons";
import { AppShell, NoticeBar, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import {
  CONSULTING_PRICE,
  CONSULTING_SLA_HOURS,
  TEMP_EXPERT_GATE,
} from "@/lib/constants";
import { fetchExperts, type ExpertListItem } from "@/lib/api/consulting-client";
import { useMe } from "@/lib/use-me";

/**
 * ⑭ 고수 목록.
 *
 * v3에서 전문분야 필터가 사라졌다. 지금 여는 컨설팅은 '옷' 하나뿐이고
 * 가격도 전원 동일해서, 고를 축이 "누구에게 맡길까" 밖에 없다.
 * 선택지가 하나뿐인 필터를 두면 오히려 헷갈린다.
 *
 * 고수가 여기 들어오면 받은 신청함으로 되돌린다. 자기 자신에게 신청하는
 * 화면이기 때문이다. 탭바에서도 갈라놓지만 그것만으로는 모자란다 —
 * 탭은 내 정보를 받아야 목적지를 정할 수 있어서, 앱을 켜자마자 누르면
 * 아직 모르는 상태라 신청 화면으로 보내버린다. 실제로 배포본에서 그랬다.
 */
export default function ExpertsPage() {
  const router = useRouter();
  const { me } = useMe();
  const [experts, setExperts] = useState<ExpertListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchExperts()
      .then(setExperts)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    // replace로 보낸다 — push면 뒤로가기가 다시 이 화면으로 돌아온다.
    if (me?.is_expert) router.replace("/consulting");
  }, [me?.is_expert, router]);

  return (
    <AppShell>
      <PageTitle>컨설팅</PageTitle>
      <NoticeBar>
        온도 {TEMP_EXPERT_GATE.toFixed(1)}℃ 이상만 고수가 될 수 있어요
      </NoticeBar>

      <ScreenBody className="px-4 pt-3">
        <p className="mb-3 text-[12.5px] leading-relaxed text-neutral-600">
          설문을 넣으면 {CONSULTING_SLA_HOURS}시간 안에 진단·피해야 할 것·착장
          1세트가 도착해요.
          <br />
          답변이 불만족스러우면 100% 환불돼요.
        </p>

        {failed && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            고수 목록을 불러오지 못했어요
          </p>
        )}

        {!failed && experts === null && (
          <p className="py-10 text-center text-[13px] text-neutral-500">
            불러오는 중…
          </p>
        )}

        {experts?.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            아직 등록된 고수가 없어요
          </p>
        )}

        {experts?.map((e) => (
          <Link
            key={e.id}
            href={`/experts/${e.id}`}
            className="card mb-3 block rounded-2xl p-4"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-bold">{e.nickname}</span>
              <Temperature value={e.temperature} size={13} />
              {e.rating !== null && (
                <span className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold">
                  <StarIcon />
                  {e.rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700">
              {e.intro}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-neutral-500">
                커뮤니티 답변 {e.answered_count}건
              </span>
              <span className="cond rounded-md bg-brand px-3 py-1.5 text-[13px] font-bold text-white">
                ₩{e.price.toLocaleString("ko-KR")}
              </span>
            </div>
          </Link>
        ))}

        {experts && experts.length > 0 && (
          <p className="mt-1 mb-4 text-center text-[11.5px] text-neutral-500">
            컨설팅은 건당 ₩{CONSULTING_PRICE.toLocaleString("ko-KR")} 단일가예요
          </p>
        )}
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}
