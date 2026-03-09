import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AdminStatsCards } from "./admin-stats-cards";
import { RevenueChart } from "./revenue-chart";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    revenueRes,
    ordersRes,
    profitRes,
    pendingRes,
    readyRes,
    dailyRes,
    prevRevenueRes,
    prevOrdersRes,
    prevProfitRes,
  ] = await Promise.all([
    supabase.from("orders").select("confirmed_revenue").eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success"),
    supabase.from("orders").select("id").eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["ready_for_dispatch"]),
    supabase.from("v_daily_revenue").select("day, revenue, profit").order("day", { ascending: false }).limit(90),
    supabase.from("orders").select("confirmed_revenue, created_at").eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id").eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const confirmedRevenue = (revenueRes.data ?? []).reduce(
    (s: number, r: { confirmed_revenue: number | null }) => s + (r.confirmed_revenue ?? 0),
    0
  );
  const confirmedOrders = ordersRes.count ?? revenueRes.data?.length ?? 0;
  const orderIds = (profitRes.data ?? []).map((o: { id: number }) => o.id);
  let totalProfit = 0;
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit")
      .in("order_id", orderIds);
    totalProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
  }
  const awaitingPayment = pendingRes.count ?? 0;
  const readyForDispatch = readyRes.count ?? 0;

  const dailyRevenue = dailyRes.error ? [] : (dailyRes.data ?? []);

  const currentPeriodRevenue = (prevRevenueRes.data ?? []).reduce(
    (s: number, r: { confirmed_revenue: number | null }) => s + (r.confirmed_revenue ?? 0),
    0
  );
  const currentPeriodOrders = prevOrdersRes.count ?? 0;
  const currentPeriodOrderIds = (prevProfitRes.data ?? []).map((o: { id: number }) => o.id);
  let currentPeriodProfit = 0;
  if (currentPeriodOrderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit")
      .in("order_id", currentPeriodOrderIds);
    currentPeriodProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
  }

  const [
    prevRevRes,
    prevOrdRes,
    prevProfRes,
  ] = await Promise.all([
    supabase.from("orders").select("confirmed_revenue").eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id").eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const prevPeriodRevenue = (prevRevRes.data ?? []).reduce(
    (s: number, r: { confirmed_revenue: number | null }) => s + (r.confirmed_revenue ?? 0),
    0
  );
  const prevPeriodOrders = prevOrdRes.count ?? 0;
  const prevPeriodOrderIds = (prevProfRes.data ?? []).map((o: { id: number }) => o.id);
  let prevPeriodProfit = 0;
  if (prevPeriodOrderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit")
      .in("order_id", prevPeriodOrderIds);
    prevPeriodProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
  }

  const revenueTrend = pctChange(currentPeriodRevenue, prevPeriodRevenue);
  const ordersTrend = pctChange(currentPeriodOrders, prevPeriodOrders);
  const profitTrendPct = pctChange(currentPeriodProfit, prevPeriodProfit);
  const growthTrendPct = prevPeriodRevenue > 0 ? pctChange(currentPeriodRevenue, prevPeriodRevenue) : 0;

  const chartData = dailyRevenue.map((r: { day: string; revenue: number; profit: number }) => ({
    day: r.day,
    revenue: Number(r.revenue),
    profit: Number(r.profit),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <AdminStatsCards
        confirmedRevenue={confirmedRevenue}
        confirmedOrders={confirmedOrders}
        totalProfit={totalProfit}
        awaitingPaymentVerification={awaitingPayment}
        readyForDispatch={readyForDispatch}
        revenueTrend={{ value: Math.abs(revenueTrend), label: "vs last period", isPositive: revenueTrend >= 0 }}
        ordersTrend={{ value: Math.abs(ordersTrend), label: "vs last period", isPositive: ordersTrend >= 0 }}
        profitTrend={{ value: Math.abs(profitTrendPct), label: "vs last period", isPositive: profitTrendPct >= 0 }}
        growthTrend={{ value: Math.abs(growthTrendPct), label: "revenue growth", isPositive: growthTrendPct >= 0 }}
      />
      <RevenueChart
        data={chartData}
        title="Total Revenue"
        subtitle="Revenue for the selected period"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/orders?status=payment_pending" className="block text-sm text-primary hover:underline">
              Orders awaiting payment ({awaitingPayment})
            </Link>
            <Link href="/admin/orders?status=ready_for_dispatch" className="block text-sm text-primary hover:underline">
              Ready for dispatch ({readyForDispatch})
            </Link>
            <Link href="/admin/products" className="block text-sm text-primary hover:underline">
              Manage products
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
