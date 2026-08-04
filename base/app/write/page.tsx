"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, PhotoBox, PhotoSlot } from "@/components/badge";
import { PlusIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  Kicker,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { AdReward } from "@/components/ad-reward";
import { ApiError, createPost, uploadImage } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import {
  CATEGORIES,
  POLL_OPTION_MAX,
  POLL_OPTION_MIN,
  POST_COST_HEARTS,
  POST_IMAGE_MAX,
  POST_TYPES,
  POST_TYPE_HINT,
  POST_TYPE_LABEL,
  isFreePost,
  type Category,
  type PostType,
} from "@/lib/constants";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * 글쓰기 — 유형을 먼저 고르고(③) 그 유형의 템플릿으로 넘어간다(④⑤⑥).
 * 유형은 작성 후 변경할 수 없어서 순서를 뒤집지 않는다(F-23).
 */
export default function WritePage() {
  const [postType, setPostType] = useState<PostType | null>(null);

  return postType ? (
    <Composer postType={postType} onBack={() => setPostType(null)} />
  ) : (
    <TypeSelect onNext={setPostType} />
  );
}

/** ③ 어떻게 물어볼까요 */
function TypeSelect({ onNext }: { onNext: (t: PostType) => void }) {
  const [picked, setPicked] = useState<PostType | null>(null);

  return (
    <AppShell>
      <TopBar backHref="/" title="글쓰기" />
      <ScreenBody className="px-4 pt-5">
        <h1 className="mb-4 text-[19px] leading-snug font-bold">
          어떻게 물어볼까요?
        </h1>
        <div className="flex flex-col gap-3">
          {POST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPicked(t)}
              aria-pressed={picked === t}
              className={`relative rounded-xl p-3.5 text-left ${
                picked === t
                  ? "border-2 border-brand bg-brand-tint"
                  : "border border-neutral-400"
              }`}
            >              <p className="text-[15px] font-bold">{POST_TYPE_LABEL[t]}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                {POST_TYPE_HINT[t]}
              </p>
            </button>
          ))}
        </div>
      </ScreenBody>
      <BottomBar bordered={false}>
        <PrimaryButton disabled={!picked} onClick={() => picked && onNext(picked)}>
          다음
        </PrimaryButton>
      </BottomBar>
    </AppShell>
  );
}

/** ④⑤⑥ 유형별 작성 템플릿 */
function Composer({
  postType,
  onBack,
}: {
  postType: PostType;
  onBack: () => void;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("옷");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, url]);
    } catch (e) {
      setError(
        e instanceof ApiError && e.detail ? e.detail : "사진을 올리지 못했어요",
      );
    }
    setUploading(false);
  }

  const { me } = useMe();
  const [hearts, setHearts] = useState<number | null>(null);
  const balance = hearts ?? me?.hearts ?? null;
  // 정보 공유는 하트를 쓰지 않는다(F-80). DB의 create_post()도 같은 규칙이라
  // 여기서 막으면 올릴 수 있는 글을 막아버린다.
  const free = isFreePost(postType);
  // 하트가 없으면 아예 올릴 수 없다. DB도 INSUFFICIENT_HEARTS로 막지만,
  // 다 써놓고 마지막에 막히면 헛수고라 여기서 먼저 알린다.
  const noHearts = !free && balance !== null && balance < POST_COST_HEARTS;

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const ready =
    !noHearts &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (postType !== "선택지투표" || filledOptions.length >= POLL_OPTION_MIN);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const { id } = await createPost({
        category,
        post_type: postType,
        title: title.trim(),
        body: body.trim(),
        options: postType === "선택지투표" ? filledOptions : undefined,
        image_urls: images,
      });
      router.push(`/post/${id}`);
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "INSUFFICIENT_HEARTS"
          ? "하트가 부족해요"
          : "등록하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between border-b border-neutral-400 px-4 py-2">
        <button type="button" onClick={onBack} aria-label="유형 다시 고르기">
          <BackGlyph />
        </button>
        <span className="cond text-[16px] font-semibold tracking-[0.1em]">
          {POST_TYPE_LABEL[postType]}
        </span>
        <span className="w-5" />
      </header>

      <ScreenBody className="px-4 pt-3">
        <div className="mb-3 flex gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={free ? "무엇에 대한 정보인가요?" : "제목을 적어주세요"}
          className="w-full border-b border-neutral-400 pb-2 text-[15px] font-medium"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            free
              ? "알게 된 것을 정리해서 적어주세요"
              : "어떤 점이 궁금한지 적어주세요"
          }
          className="mt-2 h-[92px] w-full resize-none text-[13px] leading-relaxed"
        />

        <div className="mt-3 flex items-center gap-2">
          {images.map((url, i) => (
            <span key={url} className="relative">
              <PhotoBox src={url} alt="" className="h-[64px] w-[64px]" />
              <button
                type="button"
                aria-label="사진 빼기"
                onClick={() => setImages((prev) => prev.filter((_, x) => x !== i))}
                className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center bg-ink text-[11px] leading-none text-white"
              >
                ×
              </button>
            </span>
          ))}
          {images.length < POST_IMAGE_MAX && (
            <PhotoSlot onPick={pickImage} disabled={uploading} />
          )}
          {uploading && (
            <span className="text-[12px] text-neutral-500">올리는 중…</span>
          )}
        </div>

        {postType === "선택지투표" && (
          <>
            <Kicker className="mt-4 mb-2">OPTIONS</Kicker>
            {options.map((value, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-ink text-[12px] font-bold text-white">
                  {LETTERS[i]}
                </span>
                <input
                  value={value}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((v, idx) => (idx === i ? e.target.value : v)),
                    )
                  }
                  placeholder={`선택지 ${LETTERS[i]}`}
                  className="flex-1 rounded-md border border-neutral-400 px-3 py-2 text-[14px]"
                />
              </div>
            ))}
            {options.length < POLL_OPTION_MAX && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ""])}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-400 py-2 text-[13px] font-semibold text-brand"
              >
                <PlusIcon size={13} />
                선택지 추가
              </button>
            )}
          </>
        )}

        {free && (
          <div className="mt-5 rounded-lg border border-brand-tint-b bg-brand-tint p-3">
            <p className="text-[12px] font-semibold text-brand-dark">
              정보 공유 글은 하트를 쓰지 않아요
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700">
              투표 대신 좋아요를 받고, 받은 좋아요는 내 온도에 쌓여요.
            </p>
          </div>
        )}

        {postType === "무난함판정" && (
          <div className="mt-5 rounded-lg border border-brand-tint-b bg-brand-tint p-3">
            <p className="mb-2 text-[12px] font-semibold text-brand-dark">
              무난해요 / 애매해요 두 버튼이 자동으로 붙어요
            </p>
            <div className="flex gap-2">
              {["무난해요", "애매해요"].map((label) => (
                <span
                  key={label}
                  className="flex-1 rounded-md border border-brand-tint-b bg-white py-2 text-center text-[13px] font-bold text-neutral-500"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 border border-temp px-3 py-2 text-[12.5px] text-temp">
            {error}
          </p>
        )}
      </ScreenBody>

      <BottomBar bordered={false}>
        {noHearts ? (
          <div className="rounded-xl border border-brand bg-brand/15 p-3.5">
            <p className="text-[13.5px] font-bold text-brand-dark">
              하트가 없어 글을 올릴 수 없어요
            </p>
            <p className="mt-1 mb-3 text-[12px] text-neutral-700">
              광고를 보거나 충전하면 바로 올릴 수 있어요.
            </p>
            <div className="bg-paper">
              <AdReward
                compact
                onGranted={(next) => setHearts(next)}
              />
            </div>
            <Link
              href="/hearts"
              className="mt-2 block bg-brand py-2.5 text-center text-[13px] font-bold text-white"
            >
              충전하러 가기
            </Link>
          </div>
        ) : (
          <>
            <PrimaryButton disabled={!ready || saving} onClick={submit}>
              {saving
                ? "올리는 중…"
                : free
                  ? "올리기"
                  : `하트 ${POST_COST_HEARTS}개로 올리기`}
            </PrimaryButton>
            <p className="mt-2 text-center text-[11.5px] text-neutral-600">
              {free
                ? "하트를 쓰지 않아요"
                : balance !== null
                  ? `내 하트 ${balance}개`
                  : ""}
            </p>
          </>
        )}
      </BottomBar>
    </AppShell>
  );
}

function BackGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
