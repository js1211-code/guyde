"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { HeartTransaction } from "@/lib/mock";

const FILTERS = ["전체", "적립", "사용"] as const;
type Filter = (typeof FILTERS)[number];

/** 하트 원장 목록. delta 부호로 적립/사용을 가른다. */
export function HeartLedger({ items }: { items: HeartTransaction[] }) {
  const [filter, setFilter] = useState<Filter>("전체");

  const visible = items.filter((t) =>
    filter === "전체" ? true : filter === "적립" ? t.delta > 0 : t.delta < 0,
  );

  return (
    <>
      <div className="mt-1 flex border-b border-neutral-400 px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`-mb-px px-3 pt-2 pb-2 text-[13.5px] ${
              filter === f
                ? "border-b-2 border-ink font-bold"
                : "text-neutral-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul>
        {visible.map((t) => {
          const earned = t.delta > 0;
          return (
            <li
              key={t.id}
              className="flex items-center gap-3 border-b border-dashed border-neutral-400 px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-400">
                {earned ? (
                  <PlusIcon size={14} strokeWidth={1.8} className="text-accent-700" />
                ) : (
                  <MinusIcon size={14} strokeWidth={1.8} className="text-neutral-600" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{t.label}</p>
                <p className="mt-0.5 text-[11.5px] text-neutral-600">
                  {t.created_at}
                </p>
              </div>
              <span
                className={`cond text-[16px] font-bold ${
                  earned ? "text-accent-700" : "text-ink"
                }`}
              >
                {earned ? `+${t.delta}` : t.delta}
              </span>
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="px-4 py-10 text-center text-[13px] text-neutral-600">
            내역이 없어요
          </li>
        )}
      </ul>
    </>
  );
}
