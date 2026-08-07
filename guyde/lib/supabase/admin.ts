import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ⚠️ 서버 전용 관리자 클라이언트 (RLS 우회).
 * - 반드시 Route Handler(app/api/...)에서만 import 할 것. 클라이언트 컴포넌트에서 import 금지.
 * - 하트 차감/지급(spend_hearts/earn_hearts RPC), 글 작성 트랜잭션 등 돈이 걸린 로직 전용.
 * - .env.local에 SUPABASE_SECRET_KEY 필요 (Supabase 대시보드 → Settings → API Keys → Secret keys).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
