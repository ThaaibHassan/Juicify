import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReserveLine {
  variantId: number;
  qty: number;
}

export async function reserveStock(
  supabase: SupabaseClient,
  lines: ReserveLine[]
): Promise<{ ok: boolean; error?: string }> {
  for (const line of lines) {
    const { data: row, error: fetchError } = await supabase
      .from("product_variants")
      .select("stock_qty")
      .eq("id", line.variantId)
      .single();
    if (fetchError || !row) return { ok: false, error: fetchError?.message ?? "Variant not found" };
    const current = row.stock_qty ?? 0;
    if (current < line.qty) {
      return { ok: false, error: `Insufficient stock for variant ${line.variantId}` };
    }
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_qty: current - line.qty })
      .eq("id", line.variantId);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function restock(
  supabase: SupabaseClient,
  lines: ReserveLine[]
): Promise<{ ok: boolean; error?: string }> {
  for (const line of lines) {
    const { data: row, error: fetchError } = await supabase
      .from("product_variants")
      .select("stock_qty")
      .eq("id", line.variantId)
      .single();
    if (fetchError || !row) return { ok: false, error: fetchError?.message ?? "Variant not found" };
    const current = row.stock_qty ?? 0;
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_qty: current + line.qty })
      .eq("id", line.variantId);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}
