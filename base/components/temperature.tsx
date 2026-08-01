/**
 * 온도(매너온도) 표시. 36.5에서 시작해 38.5가 상한.
 * 색 기준은 디자인 문서의 tc() 함수와 동일하다.
 */

const TEMP_MIN = 36.5;
const TEMP_MAX = 38.5;

export function tempColorClass(value: number): string {
  if (value >= 37.5) return "text-temp-hot";
  if (value >= 37) return "text-temp-mid";
  return "text-temp-low";
}

/** 게이지 채움 비율(0~100) */
export function tempPercent(value: number): number {
  const pct = ((value - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** 닉네임 옆에 붙는 "37.9°C" */
export function Temperature({
  value,
  size = 12,
}: {
  value: number;
  size?: number;
}) {
  return (
    <span
      className={`cond font-bold ${tempColorClass(value)}`}
      style={{ fontSize: `${size}px` }}
    >
      {value.toFixed(1)}°C
    </span>
  );
}

/** 마이 프로필의 눈금 달린 온도 게이지 */
export function TemperatureGauge({ value }: { value: number }) {
  return (
    <div>
      <div className="relative mt-3 h-3 border border-neutral-400">
        <div
          className="absolute inset-y-0 left-0 bg-temp-hot"
          style={{ width: `${tempPercent(value)}%` }}
        />
        {[0, 25, 50, 75].map((left) => (
          <div
            key={left}
            className={`absolute -top-1 h-5 w-px ${
              left === 0 ? "bg-neutral-600" : "bg-neutral-400"
            }`}
            style={{ left: `${left}%` }}
          />
        ))}
      </div>
      <div className="cond mt-1.5 flex justify-between text-[11px] tracking-wide text-neutral-600">
        <span>36.5 START</span>
        <span>37.5</span>
        <span>38.5 MAX</span>
      </div>
    </div>
  );
}

/** 고수 카드의 짧은 가로 막대 */
export function TemperatureMeter({ value }: { value: number }) {
  return (
    <div className="relative h-1.5 w-24 border border-neutral-400">
      <div
        className="absolute inset-y-0 left-0 bg-temp-hot"
        style={{ width: `${tempPercent(value)}%` }}
      />
    </div>
  );
}
