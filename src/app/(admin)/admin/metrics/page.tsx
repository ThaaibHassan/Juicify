import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminOverviewFigures } from "../admin-overview-figures";
import { RevenueChart } from "../revenue-chart";
import { MetricsDashboard } from "../metrics-dashboard";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export default async function AdminMetricsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [
    revenueRes,
    ordersRes,
    profitRes,
    overviewOrdersRes,
    refundBillsRes,
    voidBillsRes,
    currentOverviewRes,
    currentRefundRes,
    currentVoidRes,
    dailyRes,
    dailyOrdersRes,
    prevRevenueRes,
    prevOrdersRes,
    prevProfitRes,
  ] = await Promise.all([
    supabase.from("orders").select("confirmed_revenue").eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success"),
    supabase.from("orders").select("id").eq("payment_status", "success"),
    supabase.from("orders").select("subtotal, discount_total, delivery_fee, tax_total, total").eq("payment_status", "success"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "refunded"),
    supabase.from("orders").select("id", { count: "exact", head: true }).or("status.eq.cancelled,payment_status.eq.failed"),
    supabase.from("orders").select("subtotal, discount_total, delivery_fee, tax_total, total").eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "refunded").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).or("status.eq.cancelled,payment_status.eq.failed").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("v_daily_revenue").select("day, revenue, profit").order("day", { ascending: false }).limit(90),
    supabase
      .from("orders")
      .select("created_at")
      .eq("payment_status", "success")
      .gte("created_at", ninetyDaysAgo.toISOString()),
    supabase.from("orders").select("confirmed_revenue, created_at").eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id").eq("payment_status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const confirmedOrders = ordersRes.count ?? revenueRes.data?.length ?? 0;
  const orderIds = (profitRes.data ?? []).map((o: { id: number }) => o.id);
  let totalProfit = 0;
  let totalCost = 0;
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit, line_cost")
      .in("order_id", orderIds);
    totalProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
    totalCost = (items ?? []).reduce((s: number, r: { line_cost: number }) => s + (r.line_cost ?? 0), 0);
  }

  const overviewRows = overviewOrdersRes.data ?? [];
  const revenueExTax = overviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null }) => s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0)),
    0
  );
  const revenueExTaxFees = overviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null; delivery_fee: number | null }) =>
      s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0) - Number(r.delivery_fee ?? 0)),
    0
  );
  const discounts = overviewRows.reduce(
    (s: number, r: { discount_total: number | null }) => s + Number(r.discount_total ?? 0),
    0
  );
  const taxCollected = overviewRows.reduce(
    (s: number, r: { tax_total: number | null }) => s + Number(r.tax_total ?? 0),
    0
  );
  const feesCollected = overviewRows.reduce(
    (s: number, r: { delivery_fee: number | null }) => s + Number(r.delivery_fee ?? 0),
    0
  );
  const salesIncTax = overviewRows.reduce(
    (s: number, r: { total: number | null }) => s + Number(r.total ?? 0),
    0
  );

  const dailyRevenue = dailyRes.error ? [] : (dailyRes.data ?? []);

  const dailyOrderCountsRaw = dailyOrdersRes.error ? [] : (dailyOrdersRes.data ?? []);
  const ordersCountByDay = new Map<string, number>();
  for (const row of dailyOrderCountsRaw as { created_at: string }[]) {
    const d = row.created_at.slice(0, 10);
    ordersCountByDay.set(d, (ordersCountByDay.get(d) ?? 0) + 1);
  }

  const currentPeriodRevenue = (prevRevenueRes.data ?? []).reduce(
    (s: number, r: { confirmed_revenue: number | null }) => s + (r.confirmed_revenue ?? 0),
    0
  );
  const currentPeriodOrders = prevOrdersRes.count ?? 0;
  const currentPeriodOrderIds = (prevProfitRes.data ?? []).map((o: { id: number }) => o.id);
  let currentPeriodProfit = 0;
  let currentPeriodCost = 0;
  if (currentPeriodOrderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit, line_cost")
      .in("order_id", currentPeriodOrderIds);
    currentPeriodProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
    currentPeriodCost = (items ?? []).reduce((s: number, r: { line_cost: number }) => s + (r.line_cost ?? 0), 0);
  }

  const currentOverviewRows = currentOverviewRes.data ?? [];
  const currentRevenueExTax = currentOverviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null }) => s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0)),
    0
  );
  const currentRevenueExTaxFees = currentOverviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null; delivery_fee: number | null }) =>
      s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0) - Number(r.delivery_fee ?? 0)),
    0
  );
  const currentDiscounts = currentOverviewRows.reduce(
    (s: number, r: { discount_total: number | null }) => s + Number(r.discount_total ?? 0),
    0
  );
  const currentTaxCollected = currentOverviewRows.reduce(
    (s: number, r: { tax_total: number | null }) => s + Number(r.tax_total ?? 0),
    0
  );
  const currentFeesCollected = currentOverviewRows.reduce(
    (s: number, r: { delivery_fee: number | null }) => s + Number(r.delivery_fee ?? 0),
    0
  );
  const currentSalesIncTax = currentOverviewRows.reduce(
    (s: number, r: { total: number | null }) => s + Number(r.total ?? 0),
    0
  );

  const [
    prevRevRes,
    prevOrdRes,
    prevProfRes,
    prevOverviewOrdersRes,
    prevRefundBillsRes,
    prevVoidBillsRes,
  ] = await Promise.all([
    supabase.from("orders").select("confirmed_revenue").eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id").eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("subtotal, discount_total, delivery_fee, tax_total, total").eq("payment_status", "success").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "refunded").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).or("status.eq.cancelled,payment_status.eq.failed").gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const prevPeriodOrders = prevOrdRes.count ?? 0;
  const prevPeriodOrderIds = (prevProfRes.data ?? []).map((o: { id: number }) => o.id);
  let prevPeriodProfit = 0;
  let prevPeriodCost = 0;
  if (prevPeriodOrderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit, line_cost")
      .in("order_id", prevPeriodOrderIds);
    prevPeriodProfit = (items ?? []).reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
    prevPeriodCost = (items ?? []).reduce((s: number, r: { line_cost: number }) => s + (r.line_cost ?? 0), 0);
  }

  const prevOverviewRows = prevOverviewOrdersRes.data ?? [];
  const prevRevenueExTax = prevOverviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null }) => s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0)),
    0
  );
  const prevRevenueExTaxFees = prevOverviewRows.reduce(
    (s: number, r: { total: number | null; tax_total: number | null; delivery_fee: number | null }) =>
      s + (Number(r.total ?? 0) - Number(r.tax_total ?? 0) - Number(r.delivery_fee ?? 0)),
    0
  );
  const prevDiscounts = prevOverviewRows.reduce(
    (s: number, r: { discount_total: number | null }) => s + Number(r.discount_total ?? 0),
    0
  );
  const prevTaxCollected = prevOverviewRows.reduce(
    (s: number, r: { tax_total: number | null }) => s + Number(r.tax_total ?? 0),
    0
  );
  const prevFeesCollected = prevOverviewRows.reduce(
    (s: number, r: { delivery_fee: number | null }) => s + Number(r.delivery_fee ?? 0),
    0
  );
  const prevSalesIncTax = prevOverviewRows.reduce(
    (s: number, r: { total: number | null }) => s + Number(r.total ?? 0),
    0
  );

  const overviewFigures = {
    revenueExTax,
    revenueExTaxFees,
    cost: totalCost,
    profit: totalProfit,
    discounts,
    taxCollected,
    feesCollected,
    salesIncTax,
    salesCount: confirmedOrders,
    refundBills: refundBillsRes.count ?? 0,
    voidBills: voidBillsRes.count ?? 0,
  };

  const overviewTrends = {
    revenueExTax: pctChange(currentRevenueExTax, prevRevenueExTax),
    revenueExTaxFees: pctChange(currentRevenueExTaxFees, prevRevenueExTaxFees),
    cost: pctChange(currentPeriodCost, prevPeriodCost),
    profit: pctChange(currentPeriodProfit, prevPeriodProfit),
    discounts: pctChange(currentDiscounts, prevDiscounts),
    taxCollected: pctChange(currentTaxCollected, prevTaxCollected),
    feesCollected: pctChange(currentFeesCollected, prevFeesCollected),
    salesIncTax: pctChange(currentSalesIncTax, prevSalesIncTax),
    salesCount: pctChange(currentPeriodOrders, prevPeriodOrders),
    refundBills: pctChange(currentRefundRes.count ?? 0, prevRefundBillsRes.count ?? 0),
    voidBills: pctChange(currentVoidRes.count ?? 0, prevVoidBillsRes.count ?? 0),
  };

  const chartData = dailyRevenue.map((r: { day: string; revenue: number; profit: number }) => {
    const dayKey = r.day.slice(0, 10);
    return {
      day: r.day,
      revenue: Number(r.revenue),
      profit: Number(r.profit),
      ordersCount: ordersCountByDay.get(dayKey) ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sales metrics</h1>
      <p className="text-sm text-muted-foreground">
        Click a value from below to see the trend over time.
      </p>
      <MetricsDashboard figures={overviewFigures} trends={overviewTrends} chartData={chartData} />
    </div>
  );
}

