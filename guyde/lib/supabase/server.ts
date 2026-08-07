import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(서버 컴포넌트 · Route Handler)용 Supabase 클라이언트.
 * 로그인 세션(쿠키)을 읽어 "현재 사용자" 권한으로 DB에 접근한다 — RLS가 적용됨.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 쿠키 쓰기가 막힐 수 있음 — 무시해도 됨
            // (세션 갱신은 나중에 middleware에서 처리)
          }
        },
      },
    }
  );
}
