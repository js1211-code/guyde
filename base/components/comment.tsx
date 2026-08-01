import { Badge } from "@/components/badge";
import { CheckIcon, ThumbsUpIcon } from "@/components/icons";
import { Temperature } from "@/components/temperature";
import type { Comment, User } from "@/lib/mock";

export type CommentWithAuthor = Comment & { author: User; is_best: boolean };

/**
 * 댓글 한 개. 답변은 익명이 아니라 닉네임+온도로 노출된다(정체성 비대칭).
 * - best: 베스트 답변으로 강조
 * - adopted: 질문자가 채택한 답변(온도 상승분까지 표시)
 * - adoptable: 질문자 시점에서 아직 채택 안 된 댓글
 */
export function CommentItem({
  comment,
  variant = "plain",
}: {
  comment: CommentWithAuthor;
  variant?: "plain" | "best" | "adopted" | "adoptable";
}) {
  const highlighted = variant === "best" || variant === "adopted";

  return (
    <div
      className={
        highlighted
          ? "border border-accent bg-accent-100 p-3"
          : "border-b border-dashed border-neutral-400 py-3"
      }
    >
      <div className="flex items-center gap-1.5">
        {variant === "best" && (
          <Badge variant="accent" cond className="py-0.5">
            BEST
          </Badge>
        )}
        {variant === "adopted" && (
          <Badge variant="accent" cond className="py-0.5">
            <CheckIcon size={10} strokeWidth={2.5} />
            채택됨
          </Badge>
        )}
        <span className="text-[13px] font-semibold">
          {comment.author.nickname}
        </span>
        <Temperature value={comment.author.temperature} />
        {variant === "adopted" && (
          <span className="cond border border-temp-hot px-1 py-px text-[11px] font-bold text-temp-hot">
            ▲ +0.3
          </span>
        )}
        <span className="ml-auto text-[11px] text-neutral-600">
          {comment.created_at}
        </span>
      </div>

      <p className="mt-1.5 text-[14px] leading-relaxed">{comment.body}</p>

      <div className="mt-2 flex items-center">
        <span
          className={`flex items-center gap-1 text-[12px] ${
            highlighted ? "text-accent-700" : "text-neutral-600"
          }`}
        >
          <ThumbsUpIcon size={13} />
          <span className={`cond ${highlighted ? "text-[13px] font-semibold" : ""}`}>
            {comment.upvotes}
          </span>
        </span>

        {variant === "adopted" && (
          <span className="ml-auto text-[11.5px] text-neutral-600">
            채택 완료 · 하트 1개가 전달됐어요
          </span>
        )}
        {variant === "adoptable" && (
          <button
            type="button"
            className="ml-auto border border-accent px-2.5 py-1 text-[12px] font-bold text-accent-700"
          >
            채택하기
          </button>
        )}
      </div>
    </div>
  );
}
