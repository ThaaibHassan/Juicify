import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (error || !order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("id");

  const formatOrderStatus = (status: string) =>
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case "success":
        return "Paid";
      case "pending":
        return "Awaiting Payment";
      case "failed":
        return "Payment Failed";
      case "refunded":
        return "Refunded";
      default:
        return formatOrderStatus(status);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Order confirmation</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order {order.order_number}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={order.payment_status === "success" ? "default" : "secondary"}>
              Payment: {formatPaymentStatus(order.payment_status)}
            </Badge>
            <Badge variant="outline">Status: {formatOrderStatus(order.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {order.customer_name}, {order.email}, {order.phone}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.island}, {order.address_line}
          </p>
          <div className="border-t pt-4">
            <p className="font-medium">Items</p>
            <ul className="mt-2 space-y-1 text-sm">
              {(items ?? []).map((item: { product_name: string; variant_label: string; qty: number; unit_price: number }) => (
                <li key={`${item.product_name}-${item.variant_label}`}>
                  {item.product_name} — {item.variant_label} × {item.qty} @ {item.unit_price} MVR
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{order.subtotal} MVR</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>−{order.discount_total} MVR</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{order.delivery_fee} MVR</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{order.total} MVR</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dispatch only after payment confirmation. We will contact you with next steps.
          </p>
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
