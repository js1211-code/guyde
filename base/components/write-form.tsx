"use client";

import { useState } from "react";
import { BottomBar, Kicker } from "@/components/app-shell";
import { CategoryChip } from "@/components/badge";
import { BottomSheet } from "@/components/bottom-sheet";
import {
  CalendarIcon,
  CloseIcon,
  HeartIcon,
  ImageIcon,
  PlayIcon,
  PlusIcon,
} from "@/components/icons";
import {
  AD_REWARD_HEARTS,
  POST_COST_HEARTS,
  POST_IMAGE_MAX,
} from "@/lib/constants";
import { categories, type Category } from "@/lib/mock";

const LETTERS = ["A", "B", "C", "D"];

export function WriteForm({ heartBalance }: { heartBalance: number }) {
  const [category, setCategory] = useState<Category>("패션");
  const [body, setBody] = useState("");
  const [imageCount, setImageCount] = useState(1);
  const [options, setOptions] = useState(["화이트 옥스포드", ""]);
  const [dday, setDday] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canAfford = heartBalance >= POST_COST_HEARTS;

  function submit() {
    if (!canAfford) {
      setSheetOpen(true);
      return;
    }
    // TODO: Route Handler에서 spend_hearts + posts insert를 트랜잭션으로 처리
  }

  return (
    <>
      <div className="scroll-area flex-1 px-4 pt-3.5">
        <div className="flex gap-1.5">
          {categories.map((c) => (
            <CategoryChip
              key={c}
              selected={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </CategoryChip>
          ))}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="이거 무난한가요? 편하게 물어보세요"
          className="mt-3 h-[108px] w-full resize-none border border-neutral-400 p-3 text-[15px] leading-relaxed"
        />

        <div className="mt-3 flex gap-2">
          {Array.from({ length: imageCount }, (_, i) => (
            <div
              key={i}
              className="relative flex h-20 w-20 items-center justify-center border border-neutral-500 bg-accent-100"
            >
              <ImageIcon size={20} className="text-accent-400" />
              <button
                type="button"
                aria-label="사진 삭제"
                onClick={() => setImageCount((n) => n - 1)}
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-ink text-white"
              >
                <CloseIcon size={9} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {imageCount < POST_IMAGE_MAX && (
            <button
              type="button"
              onClick={() => setImageCount((n) => n + 1)}
              className="flex h-20 w-20 flex-col items-center justify-center gap-0.5 border border-dashed border-neutral-500 text-neutral-600"
            >
              <PlusIcon size={18} />
              <span className="cond text-[11px]">
                {imageCount}/{POST_IMAGE_MAX}
              </span>
            </button>
          )}
        </div>

        <Kicker className="mt-5 mb-1.5">VOTE OPTIONS</Kicker>
        <div className="flex flex-col gap-1.5">
          {options.map((value, i) => (
            <label
              key={i}
              className="flex h-11 items-center gap-2.5 border border-neutral-500 px-3"
            >
              <span className="cond flex h-5 w-5 shrink-0 items-center justify-center bg-ink text-[12px] font-bold text-white">
                {LETTERS[i]}
              </span>
              <input
                value={value}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((v, idx) => (idx === i ? e.target.value : v)),
                  )
                }
                placeholder={i === 1 ? "네이비 스트라이프" : "선택지를 적어주세요"}
                className="w-full text-[14px]"
              />
            </label>
          ))}
          {options.length < LETTERS.length && (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ""])}
              className="flex h-9 items-center justify-center gap-1 border border-dashed border-neutral-400 text-[12.5px] font-semibold text-neutral-600"
            >
              <PlusIcon size={13} />
              선택지 추가
            </button>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between py-1">
          <div>
            <p className="text-[14px] font-semibold">D-day 뱃지</p>
            <p className="mt-0.5 text-[12px] text-neutral-600">
              피드에서 더 빨리 답을 받아요
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dday}
            aria-label="D-day 뱃지"
            onClick={() => setDday((v) => !v)}
            className={`flex h-[22px] w-[38px] p-[3px] ${
              dday ? "justify-end bg-accent" : "justify-start bg-neutral-400"
            }`}
          >
            <span className="h-4 w-4 bg-white" />
          </button>
        </div>

        {dday && (
          <div className="mt-2 flex items-center gap-2 pb-4">
            <button
              type="button"
              className="flex items-center gap-1.5 border border-accent px-2.5 py-1.5 text-[12.5px] font-semibold text-accent-700"
            >
              <CalendarIcon size={13} />
              소개팅 · 8/3
            </button>
            <span className="text-[11.5px] text-neutral-600">
              탭해서 날짜 변경
            </span>
          </div>
        )}
      </div>

      <BottomBar>
        <button
          type="button"
          onClick={submit}
          className={`flex h-12 w-full items-center justify-center gap-1.5 text-[15px] font-bold text-white ${
            canAfford ? "bg-accent" : "bg-neutral-400"
          }`}
        >
          {canAfford && <HeartIcon size={15} strokeWidth={1.8} />}
          하트 {POST_COST_HEARTS}개로 올리기{" "}
          <span className="font-medium opacity-80">
            (내 하트 {heartBalance}개)
          </span>
        </button>
      </BottomBar>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="하트가 다 떨어졌어요"
        subtitle={`질문을 올리려면 하트 ${POST_COST_HEARTS}개가 필요해요`}
      >
        <div className="my-4 flex items-center justify-center gap-2 border border-dashed border-neutral-400 py-5">
          <HeartIcon size={24} className="text-neutral-400" />
          <span className="cond text-[32px] leading-none font-bold text-neutral-600">
            {heartBalance}
          </span>
          <span className="cond mb-1 self-end text-[12px] tracking-[0.1em] text-neutral-600">
            HEARTS LEFT
          </span>
        </div>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 bg-accent text-[15px] font-bold text-white"
        >
          <PlayIcon size={15} />
          광고 보고 하트 {AD_REWARD_HEARTS}개 받기
        </button>
        <button
          type="button"
          className="mt-2 flex h-12 w-full items-center justify-center border border-neutral-400 text-[14px] font-semibold text-neutral-600"
        >
          하트 구매하기
        </button>
      </BottomSheet>
    </>
  );
}
