import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Environment = Record<string, string | undefined>;
type AdminClientOptions = {
  auth: {
    persistSession: false;
    autoRefreshToken: false;
    detectSessionInUrl: false;
  };
};
type AdminClientFactory<T> = (
  url: string,
  key: string,
  options: AdminClientOptions,
) => T;

const adminClientOptions: AdminClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

export function createSupabaseAdmin<T = SupabaseClient>(
  environment: Environment = process.env,
  clientFactory: AdminClientFactory<T> = createClient as unknown as AdminClientFactory<T>,
): T {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    environment.SUPABASE_SECRET_KEY?.trim() ||
    environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase admin configuration is missing");
  return clientFactory(url, key, adminClientOptions);
}
