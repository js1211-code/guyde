"use client";

import { useState } from "react";
import { VoteChoices, VoteResults, type VoteOption } from "@/components/vote-bar";

/**
 * 투표하기 전에는 결과를 가리고, 투표하면 결과가 열린다.
 * 지금은 로컬 상태만 바꾸고, 나중에 votes insert + Realtime 구독으로 교체한다.
 */
export function PostVote({
  options,
  totalVotes,
  initialMyOptionId,
}: {
  options: VoteOption[];
  totalVotes: number;
  initialMyOptionId: string | null;
}) {
  const [myOptionId, setMyOptionId] = useState(initialMyOptionId);

  if (!myOptionId) {
    return (
      <div className="mt-3">
        <VoteChoices
          options={options}
          totalVotes={totalVotes}
          onVote={setMyOptionId}
        />
      </div>
    );
  }

  // 방금 투표했다면 내 한 표를 즉시 반영해서 보여준다.
  const justVoted = myOptionId !== initialMyOptionId;
  const shown = justVoted
    ? options.map((o) =>
        o.id === myOptionId ? { ...o, vote_count: o.vote_count + 1 } : o,
      )
    : options;

  return (
    <div className="mt-3">
      <VoteResults
        options={shown}
        totalVotes={justVoted ? totalVotes + 1 : totalVotes}
        myOptionId={myOptionId}
      />
    </div>
  );
}
