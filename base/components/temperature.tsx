import { TEMP_EXPERT_GATE, TEMP_START } from "@/lib/constants";

/**
 * 온도 — 저장값이 아니라 서버가 매번 계산해서 내려주는 값이다(F-06).
 *
 * v3부터 색이 두 단계다. 42.0°C(고수 게이트)를 넘으면 금색으로 바뀌어서
 * 숫자를 읽지 않고 색만 봐도 고수인지 구분된다.
 * 경계는 반드시 TEMP_EXPERT_GATE를 쓴다 — 여기 42를 직접 적으면
 * 나중에 게이트를 옮겼을 때 색과 자격이 어긋난다.
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
  const hot = value >= TEMP_EXPERT_GATE;
  return (
    <span
      className={`cond font-semibold ${hot ? "text-temp-hot" : "text-temp"} ${className}`}
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
      <div className="h-[8px] overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
