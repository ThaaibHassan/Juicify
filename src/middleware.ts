import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  try {
    const env = getSupabaseEnv();
    if (!env) return response;

    const supabase = createServerClient(env.url, env.key, {
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
    });

    await supabase.auth.getUser();
  } catch {
    // Never throw: ensure we always return a response so the app loads
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (all Next.js internals: chunks, static, image)
     * - favicon.ico and static assets
     */
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
