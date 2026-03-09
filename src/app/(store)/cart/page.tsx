"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CartItem {
  productId: number;
  variantId: number;
  qty: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
}

interface ValidatedCart {
  lines: Array<{
    productId: number;
    variantId: number;
    qty: number;
    unitPrice: number;
    productName: string;
    variantLabel: string;
    sku: string;
  }>;
  subtotal: number;
  discountTotal: number;
  total: number;
  deliveryFee: number;
}

export default function CartPage() {
  const router = useRouter();
  const [rawCart, setRawCart] = useState<CartItem[]>([]);
  const [validated, setValidated] = useState<ValidatedCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscountId, setAppliedDiscountId] = useState<number | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  // Hydrate cart from localStorage once on mount (client-only).
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as CartItem[];
    setRawCart(cart);
  }, []);

  // Re-validate whenever rawCart or appliedDiscountId changes. Do not set rawCart here
  // or a dependency on rawCart will cause an infinite loop.
  useEffect(() => {
    if (rawCart.length === 0) {
      setValidated(null);
      setLoading(false);
      return;
    }
    const lines = rawCart.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
    }));
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines,
        discountCodeId: appliedDiscountId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setValidated(null);
          return;
        }
        setValidated({
          lines: data.lines,
          subtotal: data.subtotal,
          discountTotal: data.discountTotal,
          total: data.total,
          deliveryFee: data.deliveryFee,
        });
      })
      .catch(() => setValidated(null))
      .finally(() => setLoading(false));
  }, [rawCart, appliedDiscountId]);

  const updateQty = (variantId: number, delta: number) => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as CartItem[];
    const next = cart.map((i) =>
      i.variantId === variantId ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ).filter((i) => i.qty > 0);
    localStorage.setItem("cart", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cart-updated"));
    setRawCart(next);
  };

  const remove = (variantId: number) => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as CartItem[];
    const next = cart.filter((i) => i.variantId !== variantId);
    localStorage.setItem("cart", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cart-updated"));
    setRawCart(next);
  };

  const applyDiscount = () => {
    if (!discountCode.trim() || !validated) return;
    setValidatingDiscount(true);
    fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountCode.trim().toUpperCase(), subtotal: validated.subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAppliedDiscountId(data.discountCodeId);
          if (data.discountCodeId != null) {
            sessionStorage.setItem("checkout_discount_id", String(data.discountCodeId));
          }
          toast.success(`Code applied. Discount: ${data.discountTotal} MVR`);
        } else {
          toast.error(data.error ?? "Invalid code");
        }
      })
      .catch(() => toast.error("Failed to validate code"))
      .finally(() => setValidatingDiscount(false));
  };

  const clearDiscount = () => {
    setAppliedDiscountId(null);
    setDiscountCode("");
    sessionStorage.removeItem("checkout_discount_id");
  };

  if (loading && rawCart.length > 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (rawCart.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  if (!validated || validated.lines.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <p className="text-muted-foreground">Some items are no longer available. Please update your cart.</p>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.setItem("cart", "[]");
            window.dispatchEvent(new CustomEvent("cart-updated"));
            setRawCart([]);
            router.push("/shop");
          }}
        >
          Clear and shop
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-4">
          {validated.lines.map((line) => {
            const raw = rawCart.find((r) => r.variantId === line.variantId);
            return (
              <Card key={`${line.productId}-${line.variantId}`}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {/* No image in cart list for now; could add primary_image_url to validate response */}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${raw?.productSlug ?? ""}`} className="font-medium hover:underline">
                      {line.productName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{line.variantLabel}</p>
                    <p className="text-sm font-medium">{line.unitPrice} MVR × {line.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(line.variantId, -1)}
                    >
                      −
                    </Button>
                    <span className="w-8 text-center text-sm">{line.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(line.variantId, 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(line.variantId)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{validated.subtotal} MVR</span>
              </div>
              {validated.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>−{validated.discountTotal} MVR</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{validated.deliveryFee} MVR</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{validated.total} MVR</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={!!appliedDiscountId}
                  className="flex-1"
                />
                {appliedDiscountId ? (
                  <Button variant="outline" size="sm" onClick={clearDiscount}>
                    Remove
                  </Button>
                ) : (
                  <Button size="sm" onClick={applyDiscount} disabled={validatingDiscount}>
                    Apply
                  </Button>
                )}
              </div>
              <Button asChild className="w-full">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
