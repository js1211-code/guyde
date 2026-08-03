/**
 * 하트 충전 팩 (네이버웹툰 쿠키식 — 많이 살수록 보너스가 붙는다).
 * 서버(지급)와 클라이언트(진열) 둘 다 같은 정의를 써야 값이 어긋나지 않는다.
 *
 * ⚠️ 결제 PG는 붙이지 않는다. 지금은 데모라 구매를 누르면 바로 지급된다.
 */

export type HeartPack = {
  id: string;
  /** 기본 지급량 */
  hearts: number;
  /** 덤 */
  bonus: number;
  /** 원 */
  price: number;
};

export const HEART_PACKS: HeartPack[] = [
  { id: "h10", hearts: 10, bonus: 0, price: 1100 },
  { id: "h20", hearts: 20, bonus: 0, price: 2200 },
  { id: "h30", hearts: 30, bonus: 5, price: 3300 },
  { id: "h50", hearts: 50, bonus: 12, price: 5500 },
];

export function getPack(id: string): HeartPack | null {
  return HEART_PACKS.find((p) => p.id === id) ?? null;
}

export function packTotal(pack: HeartPack): number {
  return pack.hearts + pack.bonus;
}

/** 개당 단가 — 어느 팩이 이득인지 한눈에 보이게 */
export function pricePerHeart(pack: HeartPack): number {
  return Math.round(pack.price / packTotal(pack));
}
