import { TEMP_EXPERT_GATE, TEMP_START } from "@/lib/constants";

/**
 * 온도 — 저장값이 아니라 서버가 매번 계산해서 내려주는 값이다(F-06).
 * 색은 항상 브릭(--color-temp). 브랜드 버건디와 구분되어야 한다.
 */
export function Temperature({
  value,
  size = 11,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`cond font-semibold text-temp ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      {value.toFixed(1)}°C
    </span>
  );
}

/** 고수 자격까지의 진행 바 (F-71) — 범위는 36.5 ~ 42.0 */
export function TemperatureProgress({ value }: { value: number }) {
  const remaining = Math.max(0, TEMP_EXPERT_GATE - value);
  const pct = Math.min(
    100,
    Math.max(0, ((value - TEMP_START) / (TEMP_EXPERT_GATE - TEMP_START)) * 100),
  );

  return (
    <div className="mt-2.5">
      <p className="mb-1.5 text-[12px] text-neutral-600">
        {remaining > 0
          ? `고수 자격까지 ${remaining.toFixed(1)}도 남았어요`
          : "고수 자격을 갖췄어요"}
      </p>
      <div className="h-[8px] border border-neutral-400">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
