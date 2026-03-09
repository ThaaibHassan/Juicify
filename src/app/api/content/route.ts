import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { SiteContentMap } from "@/types/api";

const DEFAULT_CONTENT: SiteContentMap = {
  announcement: { enabled: false, text: "" },
  hero_banners: [],
  promo_strips: [],
  featured_slugs: [],
  bestseller_slugs: [],
  popular_categories: [],
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("site_content")
      .select("key, value");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map: SiteContentMap = { ...DEFAULT_CONTENT };
    for (const row of rows ?? []) {
      const key = row.key as keyof SiteContentMap;
      if (key && row.value != null) {
        (map as Record<string, unknown>)[key] = row.value;
      }
    }
    return NextResponse.json(map);
  } catch (err) {
    console.error("Content API error:", err);
    return NextResponse.json(DEFAULT_CONTENT);
  }
}
