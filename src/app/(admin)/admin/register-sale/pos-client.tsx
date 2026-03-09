"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PosProductVariant {
  id: number;
  sku: string;
  size_label: string;
  selling_price: number;
  discount_price: number | null;
  cost_price: number;
  stock_qty: number;
}

interface PosProduct {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  variants: PosProductVariant[];
}

interface CartLine {
  productId: number;
  variantId: number;
  qty: number;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
}

interface PosClientProps {
  defaultDeliveryFee: number;
  taxPercentage: number;
  currency: string;
}

export function PosClient({ defaultDeliveryFee, taxPercentage, currency }: PosClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(defaultDeliveryFee);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);

  const fetchProducts = useCallback(async (q: string) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", "15");
      const res = await fetch(`/api/admin/pos/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchProducts]);

  const unitPrice = (v: PosProductVariant) => v.discount_price ?? v.selling_price;

  const addToCart = (p: PosProduct, v: PosProductVariant) => {
    const price = unitPrice(v);
    setCart((prev) => {
      const existing = prev.find((l) => l.variantId === v.id);
      if (existing) {
        const newQty = existing.qty + 1;
        if (newQty > v.stock_qty) {
          toast.error(`Only ${v.stock_qty} in stock`);
          return prev;
        }
        return prev.map((l) => (l.variantId === v.id ? { ...l, qty: newQty } : l));
      }
      return [
        ...prev,
        {
          productId: p.id,
          variantId: v.id,
          qty: 1,
          productName: p.name,
          variantLabel: v.size_label,
          sku: v.sku,
          unitPrice: price,
          costPrice: v.cost_price,
        },
      ];
    });
  };

  const updateQty = (variantId: number, delta: number) => {
    setCart((prev) => {
      const line = prev.find((l) => l.variantId === variantId);
      if (!line) return prev;
      const newQty = Math.max(0, line.qty + delta);
      if (newQty === 0) return prev.filter((l) => l.variantId !== variantId);
      return prev.map((l) => (l.variantId === variantId ? { ...l, qty: newQty } : l));
    });
  };

  const removeLine = (variantId: number) => {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId));
  };

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const totalBeforeTax = subtotal + deliveryFee;
  const taxAmount = (totalBeforeTax * taxPercentage) / 100;
  const total = Math.round((totalBeforeTax + taxAmount) * 100) / 100;

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one product to the sale.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
          customerName: customerName.trim() || undefined,
          notes: notes.trim() || undefined,
          discountCode: discountCode.trim() || undefined,
          deliveryFee,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to register sale.");
        return;
      }
      toast.success(`Sale registered. Order ${data.orderNumber}`);
      setLastOrderId(data.orderId ?? null);
      setLastOrderNumber(data.orderNumber ?? null);

      if (paymentMethod === "bank_transfer" && slipFile) {
        try {
          const formData = new FormData();
          formData.append("orderId", String(data.orderId));
          formData.append("file", slipFile);
          const proofRes = await fetch("/api/payment-proofs", {
            method: "POST",
            body: formData,
          });
          if (!proofRes.ok) {
            const proofData = await proofRes.json().catch(() => ({}));
            toast.error(proofData.error ?? "Sale saved but slip upload failed.");
          }
        } catch {
          toast.error("Sale saved but slip upload failed.");
        }
      }
      setCart([]);
      setCustomerName("");
      setNotes("");
      setDiscountCode("");
      setSlipFile(null);
      setPaymentMethod("cash");
    } catch {
      toast.error("Failed to register sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] items-stretch gap-6 lg:grid-cols-2">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="text-base">Products</CardTitle>
          <p className="text-muted-foreground text-sm">Search and add products to the sale.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by product name or leave empty for all..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="max-h-[480px] space-y-2 overflow-y-auto rounded-md border p-2">
              {products.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No products found.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-md border bg-muted/30 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                      {p.variants.map((v) => (
                        <Button
                          key={v.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => addToCart(p, v)}
                          disabled={v.stock_qty < 1}
                        >
                          <Plus className="mr-1 size-3" />
                          {v.size_label} – {currency} {unitPrice(v).toFixed(2)}
                          {v.stock_qty < 1 ? " (out of stock)" : ` (${v.stock_qty})`}
                        </Button>
                      ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Sale cart ({cart.length} line{cart.length !== 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cart is empty. Add products from the left.</p>
          ) : (
            <>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-2">
                {cart.map((l) => (
                  <div
                    key={l.variantId}
                    className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.productName} – {l.variantLabel}</p>
                      <p className="text-muted-foreground text-xs">
                        {currency} {l.unitPrice.toFixed(2)} × {l.qty} = {currency} {(l.unitPrice * l.qty).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => updateQty(l.variantId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{l.qty}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => updateQty(l.variantId, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => removeLine(l.variantId)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{currency} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="delivery-fee" className="text-muted-foreground text-sm whitespace-nowrap">Delivery fee</Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    min={0}
                    step={1}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                {taxPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({taxPercentage}%)</span>
                    <span>{currency} {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{currency} {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-muted-foreground text-xs">Payment method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod("cash")}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod("bank_transfer")}
                  >
                    Bank transfer
                  </Button>
                </div>
                {paymentMethod === "bank_transfer" && (
                  <div className="space-y-1">
                    <Label htmlFor="slip-file" className="text-muted-foreground text-xs">
                      Payment slip (optional)
                    </Label>
                    <Input
                      id="slip-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      You can also upload the slip later from the order page.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-name" className="text-muted-foreground text-xs">Customer name (optional)</Label>
                <Input
                  id="customer-name"
                  placeholder="e.g. Walk-in, or customer name from Instagram"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Label htmlFor="notes" className="text-muted-foreground text-xs">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Sold via Instagram DM"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Label htmlFor="discount-code" className="text-muted-foreground text-xs">Discount code (optional)</Label>
                <Input
                  id="discount-code"
                  placeholder="Code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
              </div>

              {lastOrderId && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/admin/orders/${lastOrderId}?autoPrint=1`;
                  }}
                >
                  {lastOrderNumber ? `View / print invoice for ${lastOrderNumber}` : "View / print invoice"}
                </Button>
              )}

              <Button
                className="w-full"
                onClick={handleCompleteSale}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  "Complete sale"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
