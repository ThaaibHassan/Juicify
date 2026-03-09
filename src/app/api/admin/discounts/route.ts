import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { code, type, value, min_cart_value, usage_limit, is_active } = body;
  if (!code || !type || value == null) {
    return NextResponse.json({ error: "code, type, value required" }, { status: 400 });
  }
  if (type !== "percentage" && type !== "fixed") {
    return NextResponse.json({ error: "type must be percentage or fixed" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code: String(code).trim().toUpperCase(),
      type,
      value: Number(value),
      min_cart_value: min_cart_value != null ? Number(min_cart_value) : null,
      usage_limit: usage_limit != null ? Number(usage_limit) : null,
      is_active: is_active !== false,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
