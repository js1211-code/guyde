"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { CategoryBadge, PostTypeBadge } from "@/components/badge";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { fetchPost, updatePost } from "@/lib/api";

/**
 * 내 글 수정 — 제목과 본문만.
 *
 * 유형·카테고리·선택지·사진은 고칠 수 없다. 투표가 쌓인 글의 선택지를
 * 갈아끼우면 사람들이 고른 표가 엉뚱한 항목에 붙고, '자유' 글은 온도에서
 * 빠지므로 카테고리를 옮기는 것만으로 온도를 조작할 수 있다.
 * 못 고치는 것들은 지우지 말고 **회색으로 그대로 보여준다** — 사라지면
 * "수정하면 유형이 없어지나?"로 읽힌다.
 *
 * 글쓰기 화면을 재사용하지 않았다. 저쪽은 유형 선택부터 시작하는 흐름이라
 * 수정 모드를 끼워 넣으면 분기가 화면 전체에 퍼진다.
 */
export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loaded, setLoaded] = useState<{
    category: string;
    post_type: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost(id)
      .then((d) => {
        // 남의 글 주소를 직접 열었을 때 폼을 그려주면 저장 단계에서야 막힌다.
        if (!d.post.is_mine) {
          router.replace(`/post/${id}`);
          return;
        }
        setLoaded({ category: d.post.category, post_type: d.post.post_type });
        setTitle(d.post.title);
        setBody(d.post.body);
      })
      .catch(() => setError("글을 불러오지 못했어요"));
  }, [id, router]);

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !busy;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await updatePost(id, { title: title.trim(), body: body.trim() });
      // replace로 나간다 — 뒤로가기로 옛 내용이 담긴 폼에 돌아오면
      // 방금 고친 게 되돌아간 것처럼 보인다.
      router.replace(`/post/${id}`);
    } catch {
      setBusy(false);
      setError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <AppShell>
      <TopBar backHref={`/post/${id}`} title="글 수정" />

      {loaded === null ? (
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-500">
            {error ?? "불러오는 중…"}
          </p>
        </ScreenBody>
      ) : (
        <>
          <ScreenBody className="px-4 pt-3">
            {/* 못 고치는 항목. 눌리지 않는다는 게 보이도록 배지 그대로 둔다. */}
            <div className="mb-3 flex items-center gap-1.5">
              <CategoryBadge>{loaded.category}</CategoryBadge>
              <PostTypeBadge postType={loaded.post_type} />
              <span className="text-[11.5px] text-neutral-500">
                유형·카테고리는 바꿀 수 없어요
              </span>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 적어주세요"
              className="w-full border-b border-neutral-400 pb-2 text-[15px] font-medium"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="내용을 적어주세요"
              className="mt-2 h-[180px] w-full resize-none text-[13px] leading-relaxed"
            />

            {error && (
              <p className="mt-3 text-[12.5px] text-danger">{error}</p>
            )}
          </ScreenBody>

          <BottomBar>
            <PrimaryButton onClick={save} disabled={!canSave}>
              {busy ? "저장 중…" : "저장하기"}
            </PrimaryButton>
          </BottomBar>
        </>
      )}
    </AppShell>
  );
}
