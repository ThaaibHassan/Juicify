import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const redirectTo = new URL(next, request.url);

  const env = getSupabaseEnv();
  if (!env) return NextResponse.redirect(new URL("/login?error=config", request.url));

  if (code) {
    const response = NextResponse.redirect(redirectTo);
    const supabase = createServerClient(
      env.url,
      env.key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, { ...options, path: "/" })
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
