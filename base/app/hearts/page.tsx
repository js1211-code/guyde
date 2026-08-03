"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";
import { Reg } from "@/components/reg";
import { AppShell, Kicker, ScreenBody, TopBar } from "@/components/shell";
import { apiFetch } from "@/lib/device";
import { HEART_PACKS, packTotal, pricePerHeart, type HeartPack } from "@/lib/hearts";
import { POST_COST_HEARTS } from "@/lib/constants";
import { useMe } from "@/lib/use-me";

/**
 * 하트 충전 — 커뮤니티 헤더의 하트 배지에서 들어온다.
 * 결제 PG는 아직 없다. 구매를 누르면 바로 지급되고 원장에 기록된다.
 */
export default function HeartShopPage() {
  const { me } = useMe();
  const [hearts, setHearts] = useState<number | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [done, setDone] = useState<{ granted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 구매 후에는 로컬 값이 최신이다
  const balance = hearts ?? me?.hearts ?? null;

  // 개당 단가가 가장 싼 팩에 "가장 이득" 표시
  const best = HEART_PACKS.reduce((a, b) =>
    pricePerHeart(b) < pricePerHeart(a) ? b : a,
  );

  async function buy(pack: HeartPack) {
    setBuying(pack.id);
    setError(null);
    setDone(null);
    try {
      const res = await apiFetch("/api/hearts/purchase", {
        method: "POST",
        body: JSON.stringify({ pack_id: pack.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHearts(data.hearts);
      setDone({ granted: data.granted });
    } catch {
      setError("충전하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setBuying(null);
  }

  return (
    <AppShell>
      <TopBar backHref="/" title="하트 충전" />

      <ScreenBody className="px-4 pt-4">
        <div className="relative border border-neutral-400 p-4">
          <Reg corners="tl tr bl br" />
          <Kicker className="text-[11px]">MY HEARTS</Kicker>
          <p className="mt-1 flex items-baseline gap-2">
            <HeartIcon size={20} className="text-brand" />
            <span className="cond text-[36px] leading-none font-bold text-brand">
              {balance ?? "–"}
            </span>
            <span className="text-[13px] text-neutral-600">개</span>
          </p>
          <p className="mt-2 text-[12px] text-neutral-600">
            질문 하나 올리는 데 하트 {POST_COST_HEARTS}개를 써요.
          </p>
        </div>

        {done && (
          <p className="mt-3 border border-brand bg-brand/15 px-3 py-2.5 text-[13px] font-semibold text-brand-dark">
            하트 {done.granted}개를 충전했어요
          </p>
        )}
        {error && (
          <p className="mt-3 border border-temp px-3 py-2.5 text-[13px] text-temp">
            {error}
          </p>
        )}

        <Kicker className="mt-6 mb-2">충전하기</Kicker>
        <ul className="flex flex-col gap-2">
          {HEART_PACKS.map((pack) => {
            const total = packTotal(pack);
            const isBest = pack.id === best.id;
            return (
              <li
                key={pack.id}
                className={`relative flex items-center gap-3 border p-3.5 ${
                  isBest ? "border-brand" : "border-neutral-400"
                }`}
              >
                {isBest && <Reg corners="tl br" />}
                <HeartIcon size={22} className="shrink-0 text-brand" />

                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-1">
                    <span className="cond text-[20px] leading-none font-bold">
                      {pack.hearts}
                    </span>
                    <span className="text-[13px]">개</span>
                    {pack.bonus > 0 && (
                      <span className="cond ml-1 border border-brand px-1.5 py-px text-[11px] font-bold text-brand">
                        +{pack.bonus} 보너스
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[11.5px] text-neutral-600">
                    총 {total}개 · 개당 {pricePerHeart(pack).toLocaleString("ko-KR")}원
                    {isBest && " · 가장 이득"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => buy(pack)}
                  disabled={buying !== null}
                  className="cond shrink-0 bg-brand px-3.5 py-2 text-[14px] font-bold text-white disabled:bg-neutral-300 disabled:text-neutral-500"
                >
                  {buying === pack.id
                    ? "충전 중…"
                    : `₩${pack.price.toLocaleString("ko-KR")}`}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 mb-6 text-[11.5px] leading-relaxed text-neutral-600">
          결제는 준비 중이에요. 지금은 데모라 구매를 누르면 바로 지급됩니다.
        </p>
      </ScreenBody>
    </AppShell>
  );
}
