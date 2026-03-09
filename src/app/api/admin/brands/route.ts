import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { name, slug, description, is_active } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const slugVal = (slug ?? name).toString().trim() || slugify(name);
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: name.trim(),
      slug: slugify(slugVal),
      description: description?.trim() || null,
      is_active: is_active !== false,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
