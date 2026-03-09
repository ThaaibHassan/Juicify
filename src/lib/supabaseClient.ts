import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export const createSupabaseBrowserClient = () => {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  return createBrowserClient(env.url, env.key);
};

