import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProofForm } from "./upload-proof-form";

async function getOrderForUser(orderNumber: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/order/${encodeURIComponent(orderNumber)}/upload-proof`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, payment_method, payment_status")
    .eq("order_number", orderNumber)
    .single();

  if (!order || order.customer_id !== user.id) {
    notFound();
  }

  if (order.payment_method !== "bank_transfer") {
    redirect(`/order/${encodeURIComponent(orderNumber)}/confirmation`);
  }

  return order;
}

export default async function UploadPaymentProofPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderForUser(orderNumber);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Upload payment receipt
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Order {order.order_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a screenshot or photo of your bank transfer. Our team will
            review and confirm payment before dispatch.
          </p>
          <UploadProofForm orderId={order.id} orderNumber={order.order_number} />
          <p className="text-xs text-muted-foreground">
            After review, you&lsquo;ll receive an update and your order status
            will move to payment confirmed if accepted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

