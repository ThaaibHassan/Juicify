import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [revenueRes, ordersCountRes, pendingRes, readyRes] = await Promise.all([
    supabase.from("orders").select("confirmed_revenue").eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["ready_for_dispatch"]),
  ]);

  const revenue = (revenueRes.data ?? []).reduce((s: number, r: { confirmed_revenue: number | null }) => s + (r.confirmed_revenue ?? 0), 0);
  const confirmedOrders = revenueRes.data?.length ?? ordersCountRes.count ?? 0;
  let profit = 0;
  const { data: orders } = await supabase.from("orders").select("id").eq("payment_status", "success");
  const ids = (orders ?? []).map((o: { id: number }) => o.id);
  if (ids.length > 0) {
    const { data: profitRows } = await supabase.from("order_items").select("line_profit").in("order_id", ids);
    profit = (profitRows ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
  }
  const awaitingPayment = pendingRes.count ?? 0;
  const readyForDispatch = readyRes.count ?? 0;

  return NextResponse.json({
    confirmedRevenue: revenue,
    confirmedOrders,
    totalProfit: profit,
    awaitingPaymentVerification: awaitingPayment,
    readyForDispatch,
  });
}
