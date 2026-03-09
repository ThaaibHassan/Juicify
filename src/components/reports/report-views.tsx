import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DaySummaryData,
  ProductSalesRow,
  PeriodSalesRow,
  CustomerSalesRow,
  OutstandingBillRow,
  SalesVoidRow,
  FOCBillRow,
  ProductPricingRow,
  OrderProductsRow,
  PaymentsReceivedRow,
  InventoryOverviewRow,
  TaxFeesRow,
} from "@/lib/reports";

export function DaySummaryReport({ data }: { data: DaySummaryData }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{data.ordersCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{data.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{data.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payments received</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{data.paymentsCount}</span>
            <span className="text-muted-foreground text-sm ml-1">({data.paymentsTotal.toFixed(2)} MVR)</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders for {data.date}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Total (MVR)</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((o) => (
                <TableRow key={o.order_number}>
                  <TableCell className="font-medium">{o.order_number}</TableCell>
                  <TableCell>{o.total.toFixed(2)}</TableCell>
                  <TableCell>{o.payment_status}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(o.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.orders.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders for this day.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductSalesReport({ data }: { data: ProductSalesRow[] }) {
  const totalRevenue = data.reduce((s, r) => s + r.total_revenue, 0);
  const totalQty = data.reduce((s, r) => s + r.total_qty, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total units sold</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalQty}</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By product</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue (MVR)</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={`${r.product_id}-${r.sku}`}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                  <TableCell className="text-right">{r.total_qty}</TableCell>
                  <TableCell className="text-right">{r.total_revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{r.order_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PeriodSalesReport({ data }: { data: PeriodSalesRow[] }) {
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = data.reduce((s, r) => s + r.profit, 0);
  const totalOrders = data.reduce((s, r) => s + r.orders_count, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalOrders}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total profit (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue (MVR)</TableHead>
                <TableHead className="text-right">Profit (MVR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.day}>
                  <TableCell className="font-medium">{r.day}</TableCell>
                  <TableCell className="text-right">{r.orders_count}</TableCell>
                  <TableCell className="text-right">{r.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{r.profit.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No data for this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CustomerSalesReport({ data }: { data: CustomerSalesRow[] }) {
  const totalRevenue = data.reduce((s, r) => s + r.total_spent, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue from customers (MVR)</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By customer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent (MVR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.customer_id}>
                  <TableCell className="font-medium">{r.customer_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.email ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.order_count}</TableCell>
                  <TableCell className="text-right">{r.total_spent.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No customer sales in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function OutstandingBillsReport({ data }: { data: OutstandingBillRow[] }) {
  const total = data.reduce((s, r) => s + r.total, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total outstanding (MVR)</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          <span className="text-muted-foreground text-sm ml-2">({data.length} orders)</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unsettled orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total (MVR)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${r.id}`} className="text-primary hover:underline">
                      {r.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{r.customer_name ?? "—"}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-right">{r.total.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No outstanding bills.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesVoidReport({ data }: { data: SalesVoidRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voided / cancelled / refunded orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total (MVR)</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${r.id}`} className="text-primary hover:underline">
                    {r.order_number}
                  </Link>
                </TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.payment_status}</TableCell>
                <TableCell className="text-right">{r.total.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No voided sales.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FOCBillsReport({ data }: { data: FOCBillRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">FOC (Free of charge) bills — orders with total 0 MVR</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.order_number}</TableCell>
                <TableCell className="text-right">{r.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">{r.discount_total.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No FOC bills.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductPricingReport({ data }: { data: ProductPricingRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Unit pricing and price levels</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Cost (MVR)</TableHead>
              <TableHead className="text-right">Selling (MVR)</TableHead>
              <TableHead className="text-right">Discount (MVR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.product_name}</TableCell>
                <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                <TableCell>{r.size_label}</TableCell>
                <TableCell className="text-right">{r.cost_price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{r.selling_price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{r.discount_price != null ? r.discount_price.toFixed(2) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No variants.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function OrderProductsReport({ data }: { data: OrderProductsRow[] }) {
  const totalRevenue = data.reduce((s, r) => s + r.total_revenue, 0);
  const totalQty = data.reduce((s, r) => s + r.total_qty, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue (MVR)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total units ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalQty}</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By product / variant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue (MVR)</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r, i) => (
                <TableRow key={`${r.sku}-${i}`}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell>{r.variant_label}</TableCell>
                  <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                  <TableCell className="text-right">{r.total_qty}</TableCell>
                  <TableCell className="text-right">{r.total_revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{r.order_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TaxFeesReport({ data }: { data: TaxFeesRow[] }) {
  const successData = data.filter((r) => r.payment_status === "success");
  const totalTaxCollected = successData.reduce((s, r) => s + (r.tax_total ?? 0), 0);
  const totalFeesCharged = successData.reduce((s, r) => s + (r.delivery_fee ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax collected (success orders)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalTaxCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span className="text-muted-foreground text-sm ml-2">MVR</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery fees charged (success)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalFeesCharged.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span className="text-muted-foreground text-sm ml-2">MVR</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders in period</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{data.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful orders</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{successData.length}</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax and fees by order</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Delivery fee</TableHead>
                <TableHead>Tax %</TableHead>
                <TableHead>Tax (MVR)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.order_id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${r.order_id}`} className="text-primary hover:underline">
                      {r.order_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>{Number(r.subtotal).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.discount_total).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.delivery_fee).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.tax_percentage).toFixed(1)}%</TableCell>
                  <TableCell>{Number(r.tax_total).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.total).toFixed(2)}</TableCell>
                  <TableCell>{r.payment_status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentsReceivedReport({ data }: { data: PaymentsReceivedRow[] }) {
  const total = data.filter((r) => r.status === "success").reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total received (MVR)</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          <span className="text-muted-foreground text-sm ml-2">({data.filter((r) => r.status === "success").length} payments)</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Amount (MVR)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${r.order_id}`} className="text-primary hover:underline">
                      {r.order_number ?? `#${r.order_id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{r.amount.toFixed(2)}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.provider}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No payments in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InventoryOverviewReport({ data }: { data: InventoryOverviewRow[] }) {
  const totalUnits = data.reduce((s, r) => s + r.stock_qty, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total units in stock</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{totalUnits}</span>
          <span className="text-muted-foreground text-sm ml-2">({data.length} variants)</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By variant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                  <TableCell>{r.size_label}</TableCell>
                  <TableCell className={`text-right ${r.stock_qty < 10 ? "font-medium text-destructive" : ""}`}>
                    {r.stock_qty}
                  </TableCell>
                  <TableCell>{r.is_active ? "Active" : "Inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No inventory.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function LowStockReport({ data }: { data: InventoryOverviewRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variants below reorder limit (threshold: 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.product_name}</TableCell>
                <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                <TableCell>{r.size_label}</TableCell>
                <TableCell className="text-right font-medium text-destructive">{r.stock_qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No low stock items.</p>
        )}
      </CardContent>
    </Card>
  );
}
