import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { SiteContentMap } from "@/types/api";

const ALLOWED_KEYS: (keyof SiteContentMap)[] = [
  "announcement",
  "hero_banners",
  "promo_strips",
  "featured_slugs",
  "bestseller_slugs",
  "popular_categories",
];

export async function GET() {
  await requireAdmin();
  try {
    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("site_content")
      .select("key, value, updated_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map: Record<string, unknown> = {};
    for (const row of rows ?? []) {
      if (row.key && row.value != null) {
        map[row.key] = row.value;
      }
    }
    return NextResponse.json(map);
  } catch (err) {
    console.error("Admin content GET error:", err);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    for (const key of Object.keys(body)) {
      if (!ALLOWED_KEYS.includes(key as keyof SiteContentMap)) continue;
      const value = body[key];
      const { error } = await supabase
        .from("site_content")
        .upsert({ key, value: value ?? {}, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin content PATCH error:", err);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
