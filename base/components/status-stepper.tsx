import { CheckIcon } from "@/components/icons";

export type Step = { label: string; done: boolean };

/**
 * 에스크로 상태 전이 표시 — bookings.status 상태머신을 사람이 읽는 형태로.
 * requested → paid_escrow → in_session → completed
 */
export function StatusStepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="contents">
          {i > 0 && (
            <div
              className={`mb-6 h-px flex-1 ${
                steps[i - 1].done && step.done ? "bg-accent" : "bg-neutral-400"
              }`}
            />
          )}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center ${
                step.done ? "bg-accent text-white" : "border border-neutral-400"
              }`}
            >
              {step.done ? (
                <CheckIcon size={14} />
              ) : (
                <span className="cond text-[12px] font-bold text-neutral-600">
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={`text-[11.5px] whitespace-nowrap ${
                step.done ? "font-bold" : "text-neutral-600"
              }`}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
