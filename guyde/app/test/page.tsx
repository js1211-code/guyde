import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 연결 테스트 페이지 (개발용 임시).
 * http://localhost:3000/test 에서 확인 후, 필요 없어지면 app/test 폴더째 삭제.
 */
export default async function TestPage() {
  const supabase = await createClient();

  const posts = await supabase
    .from("posts_feed")
    .select("*", { count: "exact" });
  const profiles = await supabase
    .from("profiles_public")
    .select("*", { count: "exact" });

  const ok = !posts.error && !profiles.error;

  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">GUYDE — Supabase 연결 테스트</h1>

      {ok ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
          <p className="font-semibold">✅ 연결 성공</p>
          <p className="mt-2 text-sm">
            피드(posts_feed): 글 {posts.count ?? 0}개
            <br />
            공개 프로필(profiles_public): {profiles.count ?? 0}명
          </p>
          <p className="mt-2 text-xs text-green-700">
            DB가 비어 있으면 0이 정상 — 에러 없이 이 화면이 뜨는 것 자체가 성공.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">❌ 연결 실패</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {posts.error?.message ?? profiles.error?.message}
          </pre>
          <p className="mt-2 text-xs">
            .env.local의 URL/키 값과 patch_v11.sql 실행 여부를 확인.
          </p>
        </div>
      )}
    </main>
  );
}
