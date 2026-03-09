import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { name, slug, description, is_active } = body;
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slugify(slug.toString().trim());
  if (description !== undefined) updates.description = description?.trim() || null;
  if (is_active !== undefined) updates.is_active = is_active;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const { error } = await supabase.from("brands").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
