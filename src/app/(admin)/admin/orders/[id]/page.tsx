import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatusPill } from "@/components/ui/status-pill";
import { OrderActions } from "../order-actions";
import { PaymentProofReview } from "./payment-proof-review";
import type { DiscountCode } from "@/types/database";

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoPrint?: string }>;
}) {
  await requireAdmin();
  const [{ id: idParam }, { autoPrint }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const { data: order } = isNumericId(idParam)
    ? await supabase.from("orders").select("*").eq("id", idParam).single()
    : await supabase.from("orders").select("*").eq("order_number", idParam).single();
  if (!order) notFound();

  let discount: Pick<DiscountCode, "code" | "type" | "value"> | null = null;
  if (order.discount_code_id) {
    const { data } = await supabase
      .from("discount_codes")
      .select("code, type, value")
      .eq("id", order.discount_code_id as number)
      .single();
    if (data) {
      discount = data as Pick<DiscountCode, "code" | "type" | "value">;
    }
  }
  const orderId = order.id as number;
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id");

  const { data: proofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const created = order.created_at
    ? new Date(order.created_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <div className="space-y-8">
      {/* Invoice header for print */}
      <div className="print-only mb-4 border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Order {order.order_number} • {created}
        </p>
        {order.customer_name && (
          <p className="mt-1 text-sm font-medium">{order.customer_name}</p>
        )}
        {order.address_line && (
          <p className="text-xs text-muted-foreground">{order.address_line}</p>
        )}
      </div>

      {/* App header (hidden on print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">← Back to orders</Link>
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground">{created}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={order.status} />
          <StatusPill status={order.payment_status} />
          <OrderActions
            orderId={orderId}
            orderNumber={order.order_number}
            status={order.status}
            paymentStatus={order.payment_status}
            showPrintBill
            autoPrint={autoPrint === "1" || autoPrint === "true"}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer & delivery — 1 col */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Customer & delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">{order.customer_name ?? "—"}</p>
              <p className="text-muted-foreground">{order.email}</p>
              <p className="text-muted-foreground">{order.phone}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">
                {[order.island, order.atoll].filter(Boolean).join(", ")}
              </p>
              <p>{order.address_line}</p>
            </div>
            {order.notes && (
              <>
                <Separator />
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Notes:</span>{" "}
                  {order.notes}
                </p>
              </>
            )}
            <Separator />
            <p className="text-muted-foreground">
              Payment: <span className="text-foreground">{order.payment_method}</span>
            </p>
          </CardContent>
        </Card>

        {/* Items & totals — 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24 text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).map(
                  (i: {
                    id: number;
                    product_name: string;
                    variant_label: string;
                    qty: number;
                    unit_price: number;
                    line_revenue: number;
                  }) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <span className="font-medium">{i.product_name}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {i.variant_label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{i.qty}</TableCell>
                      <TableCell className="text-right">
                        {i.unit_price} MVR
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {i.line_revenue} MVR
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex flex-col gap-1 text-sm">
              {order.discount_total > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{order.subtotal} MVR</span>
                </div>
              )}
              {order.discount_total > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Discount
                    {discount?.code && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({discount.code} –{" "}
                        {discount.type === "percentage"
                          ? `${discount.value}%`
                          : `${discount.value} MVR`}
                        )
                      </span>
                    )}
                  </span>
                  <span>-{order.discount_total} MVR</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{order.delivery_fee} MVR</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{order.total} MVR</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment receipts — full width when present */}
      {Array.isArray(proofs) && proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {proofs.map(
                (p: {
                  id: number;
                  image_url: string;
                  status: string;
                  created_at: string;
                  rejection_reason: string | null;
                }) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <a
                        href={p.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        View proof
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </span>
                      {p.rejection_reason && (
                        <span className="text-xs text-destructive">
                          {p.rejection_reason}
                        </span>
                      )}
                    </div>
                    <PaymentProofReview id={p.id} status={p.status} />
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
