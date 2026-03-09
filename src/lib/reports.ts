import type { SupabaseClient } from "@supabase/supabase-js";

function startOfDay(isoDate: string): string {
  return `${isoDate}T00:00:00.000Z`;
}
function endOfDay(isoDate: string): string {
  return `${isoDate}T23:59:59.999Z`;
}

export type DaySummaryData = {
  date: string;
  ordersCount: number;
  revenue: number;
  profit: number;
  paymentsCount: number;
  paymentsTotal: number;
  orders: { order_number: string; total: number; payment_status: string; created_at: string }[];
};

export async function fetchDaySummary(
  supabase: SupabaseClient,
  date: string
): Promise<DaySummaryData> {
  const from = startOfDay(date);
  const to = endOfDay(date);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status, created_at, confirmed_revenue")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });

  const successOrders = (orders ?? []).filter((o: { payment_status: string }) => o.payment_status === "success");
  const revenue = successOrders.reduce((s: number, o: { confirmed_revenue: number | null }) => s + (o.confirmed_revenue ?? o.total ?? 0), 0);

  const orderIds = (orders ?? []).map((o: { id: number }) => o.id);
  let profit = 0;
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("line_profit")
      .in("order_id", orderIds);
    const successIds = new Set(successOrders.map((o: { id: number }) => o.id));
    profit = (items ?? [])
      .filter((r: { order_id?: number }) => r.order_id === undefined)
      .reduce((s: number, r: { line_profit: number }) => s + (r.line_profit ?? 0), 0);
    const { data: allItems } = await supabase.from("order_items").select("order_id, line_profit").in("order_id", orderIds);
    profit = (allItems ?? []).reduce((s: number, r: { order_id: number; line_profit: number }) => {
      if (successIds.has(r.order_id)) return s + (r.line_profit ?? 0);
      return s;
    }, 0);
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status")
    .eq("status", "success")
    .in("order_id", orderIds.length ? orderIds : [0]);

  const paymentsList = payments ?? [];
  const paymentsTotal = paymentsList.reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0);

  return {
    date,
    ordersCount: orders?.length ?? 0,
    revenue,
    profit,
    paymentsCount: paymentsList.length,
    paymentsTotal,
    orders: (orders ?? []).map((o: { order_number: string; total: number; payment_status: string; created_at: string }) => ({
      order_number: o.order_number,
      total: o.total,
      payment_status: o.payment_status,
      created_at: o.created_at,
    })),
  };
}

export type ProductSalesRow = {
  product_id: number;
  product_name: string;
  sku: string;
  total_qty: number;
  total_revenue: number;
  order_count: number;
};

export async function fetchProductSales(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<ProductSalesRow[]> {
  const fromTs = startOfDay(from);
  const toTs = endOfDay(to);

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("payment_status", "success")
    .gte("created_at", fromTs)
    .lte("created_at", toTs);
  const orderIds = (orders ?? []).map((o: { id: number }) => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, product_name, sku, qty, line_revenue, order_id")
    .in("order_id", orderIds);

  const byProduct = new Map<number, { product_name: string; sku: string; qty: number; revenue: number; orders: Set<number> }>();
  for (const row of items ?? []) {
    const key = row.product_id;
    const cur = byProduct.get(key);
    if (!cur) {
      byProduct.set(key, {
        product_name: row.product_name,
        sku: row.sku,
        qty: row.qty,
        revenue: row.line_revenue ?? 0,
        orders: new Set([row.order_id]),
      });
    } else {
      cur.qty += row.qty;
      cur.revenue += row.line_revenue ?? 0;
      cur.orders.add(row.order_id);
    }
  }

  return Array.from(byProduct.entries()).map(([product_id, v]) => ({
    product_id,
    product_name: v.product_name,
    sku: v.sku,
    total_qty: v.qty,
    total_revenue: v.revenue,
    order_count: v.orders.size,
  }));
}

export type PeriodSalesRow = {
  day: string;
  orders_count: number;
  revenue: number;
  profit: number;
};

export async function fetchPeriodSales(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<PeriodSalesRow[]> {
  const { data } = await supabase
    .from("v_daily_revenue")
    .select("day, revenue, profit")
    .gte("day", from)
    .lte("day", to + "T23:59:59")
    .order("day", { ascending: true });

  const rows = data ?? [];
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("created_at")
    .eq("payment_status", "success")
    .gte("created_at", from)
    .lte("created_at", to + "T23:59:59");
  const countByDay = new Map<string, number>();
  for (const o of orderCounts ?? []) {
    const d = (o.created_at as string).slice(0, 10);
    countByDay.set(d, (countByDay.get(d) ?? 0) + 1);
  }

  return rows.map((r: { day: string; revenue: number; profit: number }) => ({
    day: r.day.slice(0, 10),
    orders_count: countByDay.get(r.day.slice(0, 10)) ?? 0,
    revenue: Number(r.revenue),
    profit: Number(r.profit),
  }));
}

export type CustomerSalesRow = {
  customer_id: string;
  customer_name: string | null;
  email: string | null;
  order_count: number;
  total_spent: number;
};

export async function fetchCustomerSales(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<CustomerSalesRow[]> {
  const fromTs = startOfDay(from);
  const toTs = endOfDay(to);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, customer_name, email, total, confirmed_revenue, payment_status")
    .gte("created_at", fromTs)
    .lte("created_at", toTs)
    .eq("payment_status", "success");

  const byCustomer = new Map<string, { name: string | null; email: string | null; count: number; total: number }>();
  for (const o of orders ?? []) {
    const id = o.customer_id ?? "unknown";
    const cur = byCustomer.get(id);
    const spent = o.confirmed_revenue ?? o.total ?? 0;
    if (!cur) {
      byCustomer.set(id, {
        name: o.customer_name ?? null,
        email: o.email ?? null,
        count: 1,
        total: spent,
      });
    } else {
      cur.count += 1;
      cur.total += spent;
    }
  }

  return Array.from(byCustomer.entries()).map(([customer_id, v]) => ({
    customer_id,
    customer_name: v.name,
    email: v.email,
    order_count: v.count,
    total_spent: v.total,
  }));
}
export type OutstandingBillRow = {
  id: number;
  order_number: string;
  customer_name: string | null;
  total: number;
  created_at: string;
  status: string;
};

export async function fetchOutstandingBills(supabase: SupabaseClient): Promise<OutstandingBillRow[]> {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, total, created_at, status")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []).map((o: OutstandingBillRow) => ({ ...o, created_at: o.created_at }));
}

export type SalesVoidRow = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export async function fetchSalesVoid(supabase: SupabaseClient): Promise<SalesVoidRow[]> {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, created_at")
    .or("status.eq.cancelled,payment_status.eq.refunded")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type FOCBillRow = {
  id: number;
  order_number: string;
  total: number;
  discount_total: number;
  created_at: string;
};

export async function fetchFOCBills(supabase: SupabaseClient): Promise<FOCBillRow[]> {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, total, discount_total, created_at")
    .eq("total", 0)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type ProductPricingRow = {
  id: number;
  product_name: string;
  sku: string;
  size_label: string;
  cost_price: number;
  selling_price: number;
  discount_price: number | null;
};

export async function fetchProductPricing(supabase: SupabaseClient): Promise<ProductPricingRow[]> {
  const { data } = await supabase
    .from("product_variants")
    .select("id, sku, size_label, cost_price, selling_price, discount_price, products(name)")
    .order("id", { ascending: false });
  return (data ?? []).map((r: { id: number; sku: string; size_label: string; cost_price: number; selling_price: number; discount_price: number | null; products: { name: string } | null }) => ({
    id: r.id,
    product_name: (r.products as { name: string } | null)?.name ?? "—",
    sku: r.sku,
    size_label: r.size_label,
    cost_price: Number(r.cost_price),
    selling_price: Number(r.selling_price),
    discount_price: r.discount_price != null ? Number(r.discount_price) : null,
  }));
}

export type OrderProductsRow = {
  product_name: string;
  variant_label: string;
  sku: string;
  total_qty: number;
  total_revenue: number;
  order_count: number;
};

export async function fetchOrderProducts(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<OrderProductsRow[]> {
  const fromTs = startOfDay(from);
  const toTs = endOfDay(to);
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .gte("created_at", fromTs)
    .lte("created_at", toTs);
  const orderIds = (orders ?? []).map((o: { id: number }) => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, product_name, variant_label, sku, qty, line_revenue, order_id")
    .in("order_id", orderIds);

  const byKey = new Map<string, { product_name: string; variant_label: string; sku: string; qty: number; revenue: number; orders: Set<number> }>();
  for (const row of items ?? []) {
    const k = `${row.product_id}-${row.variant_label}-${row.sku}`;
    const cur = byKey.get(k);
    if (!cur) {
      byKey.set(k, {
        product_name: row.product_name,
        variant_label: row.variant_label,
        sku: row.sku,
        qty: row.qty,
        revenue: row.line_revenue ?? 0,
        orders: new Set([row.order_id]),
      });
    } else {
      cur.qty += row.qty;
      cur.revenue += row.line_revenue ?? 0;
      cur.orders.add(row.order_id);
    }
  }

  return Array.from(byKey.values()).map((v) => ({
    product_name: v.product_name,
    variant_label: v.variant_label,
    sku: v.sku,
    total_qty: v.qty,
    total_revenue: v.revenue,
    order_count: v.orders.size,
  }));
}

export type PaymentsReceivedRow = {
  id: number;
  order_id: number;
  order_number?: string;
  amount: number;
  status: string;
  provider: string;
  created_at: string;
};

export async function fetchPaymentsReceived(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<PaymentsReceivedRow[]> {
  const fromTs = startOfDay(from);
  const toTs = endOfDay(to);
  const { data: payments } = await supabase
    .from("payments")
    .select("id, order_id, amount, status, provider, created_at")
    .gte("created_at", fromTs)
    .lte("created_at", toTs)
    .order("created_at", { ascending: false });

  const orderIds = [...new Set((payments ?? []).map((p: { order_id: number }) => p.order_id))];
  const { data: orderNum } = orderIds.length
    ? await supabase.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] };
  const orderMap = new Map((orderNum ?? []).map((o: { id: number; order_number: string }) => [o.id, o.order_number]));

  return (payments ?? []).map((p: PaymentsReceivedRow & { order_id: number }) => ({
    id: p.id,
    order_id: p.order_id,
    order_number: orderMap.get(p.order_id),
    amount: p.amount,
    status: p.status,
    provider: p.provider,
    created_at: p.created_at,
  }));
}

export type InventoryOverviewRow = {
  id: number;
  product_name: string;
  sku: string;
  size_label: string;
  stock_qty: number;
  is_active: boolean;
};

export async function fetchInventoryOverview(supabase: SupabaseClient): Promise<InventoryOverviewRow[]> {
  const { data } = await supabase
    .from("product_variants")
    .select("id, sku, size_label, stock_qty, is_active, products(name)")
    .order("stock_qty", { ascending: true });
  return (data ?? []).map((r: { id: number; sku: string; size_label: string; stock_qty: number; is_active: boolean; products: { name: string } | null }) => ({
    id: r.id,
    product_name: (r.products as { name: string } | null)?.name ?? "—",
    sku: r.sku,
    size_label: r.size_label,
    stock_qty: r.stock_qty,
    is_active: r.is_active,
  }));
}

const LOW_STOCK_THRESHOLD = 10;

export async function fetchLowStock(supabase: SupabaseClient): Promise<InventoryOverviewRow[]> {
  const rows = await fetchInventoryOverview(supabase);
  return rows.filter((r) => r.stock_qty < LOW_STOCK_THRESHOLD);
}

// --- Tax and Fees Report ---
export type TaxFeesRow = {
  order_id: number;
  order_number: string;
  created_at: string;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  tax_percentage: number;
  tax_total: number;
  total: number;
  payment_status: string;
};

export async function fetchTaxFeesReport(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<TaxFeesRow[]> {
  const fromTs = startOfDay(from);
  const toTs = endOfDay(to);
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, created_at, subtotal, discount_total, delivery_fee, tax_percentage, tax_total, total, payment_status")
    .gte("created_at", fromTs)
    .lte("created_at", toTs)
    .order("created_at", { ascending: false });

  return (data ?? []).map((o: Record<string, unknown>) => ({
    order_id: o.id as number,
    order_number: (o.order_number as string) ?? "",
    created_at: (o.created_at as string) ?? "",
    subtotal: Number(o.subtotal ?? 0),
    discount_total: Number(o.discount_total ?? 0),
    delivery_fee: Number(o.delivery_fee ?? 0),
    tax_percentage: Number(o.tax_percentage ?? 0),
    tax_total: Number(o.tax_total ?? 0),
    total: Number(o.total ?? 0),
    payment_status: (o.payment_status as string) ?? "pending",
  }));
}
