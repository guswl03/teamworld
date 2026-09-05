import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isConfigured = Boolean(url && key);
let instance: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!url || !key)
    throw new Error(
      "GitHub 로그인을 위한 월드 연결 설정이 아직 완료되지 않았어요.",
    );
  if (!instance)
    instance = createClient(url, key, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  return instance;
}
