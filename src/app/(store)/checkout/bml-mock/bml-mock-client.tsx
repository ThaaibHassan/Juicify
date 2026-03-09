"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BmlMockPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId || !orderNumber) {
      toast.error("Missing order. Redirecting to cart.");
      router.push("/cart");
    }
  }, [orderId, orderNumber, router]);

  const complete = async (success: boolean) => {
    if (!orderId) return;
    setProcessing(true);
    const res = await fetch("/api/payments/mock-bml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: parseInt(orderId, 10), success }),
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) {
      toast.error(data.error ?? "Payment update failed");
      return;
    }
    if (success) {
      toast.success("Payment confirmed");
      const cart = localStorage.getItem("cart");
      if (cart) {
        localStorage.setItem("cart", "[]");
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
      router.push(`/order/${orderNumber}/confirmation`);
    } else {
      toast.error("Payment failed. Order cancelled.");
      router.push("/cart");
    }
  };

  if (!orderId || !orderNumber) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid order. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">BML Payment (Sandbox)</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulate gateway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Order: {orderNumber}. Choose an outcome to continue.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => complete(true)} disabled={processing}>
              Simulate success
            </Button>
            <Button
              variant="destructive"
              onClick={() => complete(false)}
              disabled={processing}
            >
              Simulate failure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

