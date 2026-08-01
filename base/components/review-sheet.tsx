"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { StarIcon } from "@/components/icons";

/**
 * 상담 완료 후 후기 작성 시트(디자인 15).
 * 상담이 막 끝난 화면이라 처음부터 열린 상태로 뜬다.
 * 별점은 reviews.rating, 본문은 reviews.body로 들어간다.
 */
export function ReviewSheet({
  expertName,
  serviceTitle,
}: {
  expertName: string;
  serviceTitle: string;
}) {
  const [open, setOpen] = useState(true);
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState("");

  return (
    <>
      {!open && (
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 w-full items-center justify-center bg-accent text-[15px] font-bold text-white"
          >
            후기 남기기
          </button>
        </div>
      )}

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="상담은 어땠나요?"
        subtitle={`${expertName} · ${serviceTitle}`}
      >
        <div className="my-3 flex items-center justify-center gap-2 border border-dashed border-neutral-400 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n}점`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
            >
              <StarIcon
                size={28}
                filled={n <= rating}
                className={n <= rating ? "text-accent" : "text-neutral-400"}
              />
            </button>
          ))}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="고수에게 들은 팁을 남겨주세요 (선택)"
          className="h-[72px] w-full resize-none border border-neutral-400 p-3 text-[13.5px]"
        />

        <button
          type="button"
          className="mt-3 flex h-12 w-full items-center justify-center bg-accent text-[15px] font-bold text-white"
        >
          후기 남기기
        </button>
        <p className="mt-2.5 text-center text-[11.5px] text-neutral-600">
          후기는 닉네임으로 공개돼요
        </p>
      </BottomSheet>
    </>
  );
}
