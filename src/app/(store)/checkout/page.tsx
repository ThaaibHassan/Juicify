"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const LOCAL_AREAS = ["Male", "Hulhumale Phase 1", "Hulhumale Phase 2"] as const;
type DeliveryType = "local_delivery" | "island_delivery" | "pickup";

const PAYMENT_OPTIONS = [
  { value: "bml_gateway", label: "BML Gateway (Mock)" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cod_mock", label: "COD (Mock)" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("local_delivery");
  const [localArea, setLocalArea] = useState("");
  const [island, setIsland] = useState("");
  const [atoll, setAtoll] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [boatName, setBoatName] = useState("");
  const [boatNumber, setBoatNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bml_gateway");
  const [cartLines, setCartLines] = useState<unknown[]>([]);
  const [validatedTotal, setValidatedTotal] = useState<number | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    subtotal?: number;
    discountTotal?: number;
    deliveryFee?: number;
    taxPercentage?: number;
    taxAmount?: number;
    totalBeforeTax?: number;
  } | null>(null);
  const [discountCodeId, setDiscountCodeId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const id = sessionStorage.getItem("checkout_discount_id");
    return id ? parseInt(id, 10) : null;
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: JSON.parse(localStorage.getItem("cart") ?? "[]").map((i: { productId: number; variantId: number; qty: number }) => ({
          productId: i.productId,
          variantId: i.variantId,
          qty: i.qty,
        })),
        discountCodeId: discountCodeId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.lines) {
          setCartLines(data.lines);
          setValidatedTotal(data.total);
          setPricingBreakdown({
            subtotal: data.subtotal,
            discountTotal: data.discountTotal,
            deliveryFee: data.deliveryFee,
            taxPercentage: data.taxPercentage,
            taxAmount: data.taxAmount,
            totalBeforeTax: data.totalBeforeTax,
          });
        }
      })
      .catch(() => {});
  }, [discountCodeId]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.email) {
          setEmail(data.user.email);
          setCustomerName(data.user.user_metadata?.full_name ?? "");
        }
        if (!data.user) {
          router.push("/login?redirect=/checkout");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.push("/login?redirect=/checkout");
      });
  }, [router]);

  const handlePlaceOrder = async () => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    if (!cart.length || !validatedTotal) {
      toast.error("Cart is empty or invalid");
      return;
    }
    if (!customerName || !email || !phone) {
      toast.error("Please fill all required fields");
      return;
    }

    if (deliveryType === "local_delivery") {
      if (!localArea || !addressLine) {
        toast.error("Please select area and fill address for delivery");
        return;
      }
    }

    if (deliveryType === "island_delivery") {
      if (!island || !addressLine || !boatName || !boatNumber) {
        toast.error("Please fill island, address and boat details for island delivery");
        return;
      }
    }

    const payloadIsland =
      deliveryType === "pickup" ? "Pickup" : deliveryType === "local_delivery" ? localArea : island;
    const payloadAtoll = deliveryType === "island_delivery" ? atoll || undefined : undefined;
    const payloadAddressLine =
      deliveryType === "pickup" ? "Pickup" : addressLine;
    setSubmitting(true);
    const lines = cart.map((i: { productId: number; variantId: number; qty: number }) => ({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
    }));
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        email,
        phone,
        island: payloadIsland,
        atoll: payloadAtoll,
        addressLine: payloadAddressLine,
        notes: notes || undefined,
        deliveryType,
        boatName: deliveryType === "island_delivery" ? boatName : undefined,
        boatNumber: deliveryType === "island_delivery" ? boatNumber : undefined,
        paymentMethod,
        lines,
        discountCodeId: discountCodeId || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to place order");
      return;
    }
    if (paymentMethod === "bml_gateway") {
      router.push(
        `/checkout/bml-mock?orderId=${data.orderId}&orderNumber=${encodeURIComponent(
          data.orderNumber
        )}`
      );
      return;
    }
    if (paymentMethod === "bank_transfer") {
      toast.success("Order placed. Please upload your bank transfer proof.");
      router.push(
        `/order/${encodeURIComponent(
          data.orderNumber
        )}/upload-proof`
      );
      return;
    }
    toast.success("Order placed. We will contact you for payment.");
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new CustomEvent("cart-updated"));
    router.push(`/order/${data.orderNumber}/confirmation`);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <Tabs value={String(step)} onValueChange={(v) => setStep(parseInt(v, 10))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="1">Details</TabsTrigger>
          <TabsTrigger value="2">Delivery</TabsTrigger>
          <TabsTrigger value="3">Review</TabsTrigger>
          <TabsTrigger value="4">Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Full name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="tel"
                placeholder="Phone *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Button onClick={() => setStep(2)}>Next</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="local_delivery">Delivery: Male / Hulhumale</option>
                <option value="island_delivery">Delivery: Other island (boat)</option>
                <option value="pickup">Pickup</option>
              </select>

              {deliveryType === "local_delivery" && (
                <>
                  <select
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="">Area *</option>
                    {LOCAL_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Address *"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    required
                  />
                </>
              )}

              {deliveryType === "island_delivery" && (
                <>
                  <Input
                    placeholder="Island name / island address *"
                    value={island}
                    onChange={(e) => setIsland(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Atoll (optional)"
                    value={atoll}
                    onChange={(e) => setAtoll(e.target.value)}
                  />
                  <Input
                    placeholder="Delivery address (e.g. harbor / jetty) *"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Boat name *"
                    value={boatName}
                    onChange={(e) => setBoatName(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Boat number *"
                    value={boatNumber}
                    onChange={(e) => setBoatNumber(e.target.value)}
                    required
                  />
                </>
              )}

              {deliveryType === "pickup" && (
                <p className="text-sm text-muted-foreground">
                  You selected pickup. We will contact you with pickup location and time.
                </p>
              )}

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button onClick={() => setStep(3)}>Next</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{customerName}, {email}, {phone}</p>
              <p className="text-sm text-muted-foreground">
                {deliveryType === "pickup"
                  ? "Pickup"
                  : deliveryType === "local_delivery"
                  ? `${localArea}, ${addressLine}`
                  : `${island}, ${addressLine}${boatName ? `, Boat: ${boatName} (${boatNumber})` : ""}`}
              </p>
              <div className="space-y-1 border-t pt-3 text-sm">
                {pricingBreakdown?.subtotal != null && (
                  <p className="flex justify-between"><span className="text-muted-foreground">Subtotal</span> {pricingBreakdown.subtotal.toFixed(2)} MVR</p>
                )}
                {(pricingBreakdown?.discountTotal ?? 0) > 0 && (
                  <p className="flex justify-between text-green-600">Discount -{pricingBreakdown!.discountTotal!.toFixed(2)} MVR</p>
                )}
                {pricingBreakdown?.deliveryFee != null && (
                  <p className="flex justify-between"><span className="text-muted-foreground">Delivery</span> {pricingBreakdown.deliveryFee.toFixed(2)} MVR</p>
                )}
                {(pricingBreakdown?.taxAmount ?? 0) > 0 && (
                  <p className="flex justify-between"><span className="text-muted-foreground">Tax ({(pricingBreakdown?.taxPercentage ?? 0).toFixed(0)}%)</span> {pricingBreakdown!.taxAmount!.toFixed(2)} MVR</p>
                )}
                <p className="flex justify-between font-medium pt-1">Total {validatedTotal != null ? `${validatedTotal.toFixed(2)} MVR` : "—"}</p>
              </div>
              <Button onClick={() => setStep(4)}>Next</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PAYMENT_OPTIONS.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="payment"
                    value={o.value}
                    checked={paymentMethod === o.value}
                    onChange={() => setPaymentMethod(o.value)}
                  />
                  {o.label}
                </label>
              ))}
              <Button
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={submitting || !validatedTotal}
              >
                {submitting ? "Placing order…" : "Place order"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/cart" className="underline hover:text-foreground">Back to cart</Link>
      </p>
    </div>
  );
}
