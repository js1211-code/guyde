import { notFound } from "next/navigation";
import { AppShell, ScreenBody, SectionGap, TopBar } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { CommentItem } from "@/components/comment";
import { InfoIcon, MoreIcon, SendIcon } from "@/components/icons";
import { PhotoBox } from "@/components/photo";
import { PostVote } from "@/components/post-vote";
import { VoteResults } from "@/components/vote-bar";
import { getPost, getPostIds, splitBody } from "@/lib/mock";

export function generateStaticParams() {
  return getPostIds().map((id) => ({ id }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getPost(id);
  if (!data) notFound();

  return data.is_mine ? <OwnerView data={data} /> : <VoterView data={data} />;
}

type Data = NonNullable<ReturnType<typeof getPost>>;

/** 디자인 02 — 남의 질문을 보는 시점 */
function VoterView({ data }: { data: Data }) {
  const { post, options, total_votes, my_vote_option_id, comments } = data;
  const { title, detail } = splitBody(post.body);

  return (
    <AppShell>
      <TopBar
        backHref="/"
        title={
          <span className="cond text-[16px] font-semibold tracking-[0.1em]">
            Q-{post.id}
          </span>
        }
        right={<MoreIcon size={20} />}
      />

      <ScreenBody>
        <article className="px-4 pt-3.5 pb-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Badge>익명</Badge>
            {post.post_type === "dday" && post.event_label && (
              <Badge variant="accent">{post.event_label}</Badge>
            )}
            <span className="ml-auto text-[11px] text-neutral-600">
              {post.created_at} · {post.category}
            </span>
          </div>

          <h1 className="text-[17px] leading-snug font-semibold">{title}</h1>
          {detail && (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600">
              {detail}
            </p>
          )}

          {options.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {options.map((o, i) => (
                <PhotoBox
                  key={o.id}
                  className="h-[150px]"
                  iconSize={20}
                  tag={i === 0 ? "A" : "B"}
                  caption={o.label}
                />
              ))}
            </div>
          )}

          {options.length > 0 && (
            <PostVote
              options={options}
              totalVotes={total_votes}
              initialMyOptionId={my_vote_option_id}
            />
          )}
        </article>

        <SectionGap />

        <section className="px-4 pt-3.5">
          <h2 className="mb-2.5 text-[14px] font-bold">
            댓글 <span className="cond text-accent-700">{comments.length}</span>
          </h2>
          <div className="flex flex-col">
            {comments.map((c, i) => (
              <CommentItem
                key={c.id}
                comment={c}
                variant={i === 0 && comments.length > 1 ? "best" : "plain"}
              />
            ))}
          </div>
        </section>
      </ScreenBody>

      <div className="flex items-center gap-2 border-t border-neutral-400 bg-paper px-4 py-2.5">
        <input
          className="h-9 flex-1 border border-neutral-400 px-3 text-[13px]"
          placeholder="닉네임으로 답변을 남겨요"
        />
        <button
          type="button"
          aria-label="답변 보내기"
          className="flex h-9 w-9 items-center justify-center bg-accent text-white"
        >
          <SendIcon size={16} />
        </button>
      </div>
    </AppShell>
  );
}

/** 디자인 14 — 내가 쓴 질문. 결과를 보고 답변을 채택한다. */
function OwnerView({ data }: { data: Data }) {
  const { post, options, total_votes, comments } = data;
  const { title } = splitBody(post.body);
  const leading = options.reduce(
    (best, o) => (o.vote_count > best.vote_count ? o : best),
    options[0],
  );
  const leadingLetter = options.indexOf(leading) === 0 ? "A" : "B";

  return (
    <AppShell>
      <TopBar
        backHref="/"
        title={
          <>
            내 질문{" "}
            <span className="cond tracking-[0.08em] text-neutral-600">
              Q-{post.id}
            </span>
          </>
        }
        right={<MoreIcon size={20} />}
      />

      <ScreenBody>
        <article className="px-4 pt-3.5 pb-3.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Badge variant="ink">내가 쓴 글</Badge>
            {post.post_type === "dday" && post.event_label && (
              <Badge variant="accent">{post.event_label}</Badge>
            )}
            <span className="ml-auto text-[11px] text-neutral-600">
              {post.created_at} · {post.category}
            </span>
          </div>

          <h1 className="text-[16px] leading-snug font-semibold">{title}</h1>

          <div className="mt-2.5">
            <VoteResults options={options} totalVotes={total_votes} compact />
          </div>
          <p className="cond mt-2 text-[12px] tracking-wide text-neutral-600">
            대중의 답은 {leadingLetter}예요
          </p>
        </article>

        <SectionGap />

        <section className="px-4 pt-3.5">
          <div className="mb-3 flex items-center gap-2 border border-accent-200 bg-accent-100 px-3 py-2">
            <InfoIcon size={14} className="shrink-0 text-accent-700" />
            <span className="text-[12.5px] text-neutral-700">
              도움된 답변을 채택하면 상대 온도가{" "}
              <span className="cond font-bold text-temp-hot">+0.3°C</span>{" "}
              올라가요
            </span>
          </div>

          <div className="flex flex-col">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                variant={c.is_best ? "adopted" : "adoptable"}
              />
            ))}
          </div>
        </section>
      </ScreenBody>
    </AppShell>
  );
}
