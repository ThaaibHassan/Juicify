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
  const delta = typeof body.delta === "number" ? body.delta : parseInt(body.delta, 10);
  if (Number.isNaN(delta)) {
    return NextResponse.json({ error: "delta required" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("product_variants")
    .select("stock_qty")
    .eq("id", id)
    .single();
  if (!row) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  const nextQty = Math.max(0, (row.stock_qty ?? 0) + delta);
  const { error } = await supabase
    .from("product_variants")
    .update({ stock_qty: nextQty })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ stock_qty: nextQty });
}
