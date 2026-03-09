import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { type, value, min_cart_value, usage_limit, is_active } = body;
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (type !== undefined) updates.type = type;
  if (value !== undefined) updates.value = Number(value);
  if (min_cart_value !== undefined) updates.min_cart_value = min_cart_value != null ? Number(min_cart_value) : null;
  if (usage_limit !== undefined) updates.usage_limit = usage_limit != null ? Number(usage_limit) : null;
  if (is_active !== undefined) updates.is_active = is_active;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const { error } = await supabase.from("discount_codes").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
