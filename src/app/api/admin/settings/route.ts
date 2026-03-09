import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const settings = await getSiteSettings(supabase);
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { tax_percentage, default_delivery_fee, currency } = body;

  const updates: { tax_percentage?: number; default_delivery_fee?: number; currency?: string } = {};
  if (tax_percentage != null) {
    const pct = Number(tax_percentage);
    if (pct < 0 || pct > 100) {
      return NextResponse.json({ error: "Tax percentage must be between 0 and 100" }, { status: 400 });
    }
    updates.tax_percentage = pct;
  }
  if (default_delivery_fee != null) {
    const fee = Number(default_delivery_fee);
    if (fee < 0) {
      return NextResponse.json({ error: "Delivery fee cannot be negative" }, { status: 400 });
    }
    updates.default_delivery_fee = fee;
  }
  if (currency != null) updates.currency = String(currency).trim() || "MVR";

  const supabase = await createSupabaseServerClient();
  const { error } = await updateSiteSettings(supabase, updates);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const settings = await getSiteSettings(supabase);
  return NextResponse.json(settings);
}
