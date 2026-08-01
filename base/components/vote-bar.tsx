import { CheckIcon } from "@/components/icons";

export type VoteOption = {
  id: string;
  label: string;
  vote_count: number;
};

const LETTERS = ["A", "B", "C", "D"];

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

/**
 * 피드용 한 줄 막대. 1위 득표율만 색으로 채우고 나머지는 해칭.
 * 글 상세로 안 들어가도 여론의 방향이 보이게 하는 게 목적.
 */
export function FeedVoteBar({
  leadingPercent,
}: {
  leadingPercent: number;
}) {
  return (
    <div className="mt-2 flex h-[20px] border border-neutral-400 text-[11px] font-bold">
      <div
        className="flex items-center pl-1.5 text-white bg-accent"
        style={{ width: `${leadingPercent}%` }}
      >
        A {leadingPercent}%
      </div>
      <div className="hatch flex flex-1 items-center pl-1.5 text-neutral-600">
        B
      </div>
    </div>
  );
}

/**
 * 투표 결과 막대. 1위는 강조색으로 채우고, 나머지는 해칭으로 열세를 표현한다.
 * 내가 고른 선택지에는 체크가 붙는다.
 */
export function VoteResults({
  options,
  totalVotes,
  myOptionId,
  compact = false,
}: {
  options: VoteOption[];
  totalVotes: number;
  myOptionId?: string | null;
  compact?: boolean;
}) {
  const topCount = Math.max(...options.map((o) => o.vote_count));
  const myIndex = options.findIndex((o) => o.id === myOptionId);

  return (
    <div className="flex flex-col gap-1.5">
      {options.map((option, i) => {
        const pct = percent(option.vote_count, totalVotes);
        const isLeading = option.vote_count === topCount;
        const isMine = option.id === myOptionId;

        return (
          <div
            key={option.id}
            className={`relative overflow-hidden ${compact ? "h-9" : "h-10"} border ${
              isLeading ? "border-neutral-500" : "border-neutral-400"
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 ${isLeading ? "bg-accent" : "hatch"}`}
              style={{ width: `${pct}%` }}
            />
            <div
              className={`absolute inset-0 flex items-center justify-between px-3 ${
                compact ? "text-[12.5px]" : "text-[13px]"
              } ${isLeading ? "font-bold" : "font-semibold text-neutral-600"}`}
            >
              <span
                className={`flex items-center gap-1.5 ${isLeading ? "text-white" : ""}`}
              >
                {LETTERS[i]} {option.label}
                {isMine && isLeading && <CheckIcon size={13} />}
              </span>
              <span
                className={`cond ${compact ? "text-[15px]" : "text-[16px]"} ${
                  isLeading ? "text-accent-700" : ""
                }`}
              >
                {pct}%
              </span>
            </div>
          </div>
        );
      })}

      <div className="cond mt-0.5 text-[12px] tracking-wide text-neutral-600">
        {totalVotes} VOTES
        {myIndex >= 0 && ` · 나는 ${LETTERS[myIndex]}에 투표함`}
      </div>
    </div>
  );
}

/** 아직 투표 전 — 결과를 가리고 선택지만 보여준다. */
export function VoteChoices({
  options,
  totalVotes,
  onVote,
}: {
  options: VoteOption[];
  totalVotes: number;
  onVote?: (optionId: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onVote?.(option.id)}
            className="flex h-10 items-center justify-center border border-ink text-[13px] font-bold"
          >
            {LETTERS[i]}에 투표
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-neutral-600">
        {totalVotes}명 참여 · 투표하면 결과가 보여요
      </p>
    </div>
  );
}
