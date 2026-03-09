import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { applyDiscount } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = (body.code as string)?.trim()?.toUpperCase();
    const subtotal = typeof body.subtotal === "number" ? body.subtotal : parseFloat(body.subtotal);
    if (!code) {
      return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
    }
    if (Number.isNaN(subtotal) || subtotal < 0) {
      return NextResponse.json({ valid: false, error: "Invalid subtotal" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: discount, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error || !discount) {
      return NextResponse.json({ valid: false, error: "Invalid or expired code" });
    }

    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ valid: false, error: "Code not yet active" });
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return NextResponse.json({ valid: false, error: "Code expired" });
    }
    if (discount.min_cart_value != null && subtotal < discount.min_cart_value) {
      return NextResponse.json({
        valid: false,
        error: `Minimum cart value: ${discount.min_cart_value} MVR`,
      });
    }
    if (discount.usage_limit != null && (discount.usage_count ?? 0) >= discount.usage_limit) {
      return NextResponse.json({ valid: false, error: "Code usage limit reached" });
    }

    const { discountTotal } = applyDiscount(subtotal, discount);
    return NextResponse.json({
      valid: true,
      discountCodeId: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountTotal,
    });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : "Validation failed" },
      { status: 500 }
    );
  }
}
