"use client";

import { CloseIcon } from "@/components/icons";

/**
 * 딤 + 하단 시트. 하트 부족 안내와 후기 작성에 쓴다.
 * 모서리는 직각이고 상단만 헤어라인으로 끊는다(디자인 시스템 규칙).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute right-0 bottom-0 left-0 border-t border-neutral-500 bg-paper px-5 pt-5 pb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-bold">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-[13.5px] text-neutral-600">{subtitle}</p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">
            <CloseIcon size={20} className="text-neutral-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
