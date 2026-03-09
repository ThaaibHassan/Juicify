"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductVariant } from "@/types/database";

interface ProductDetailClientProps {
  productId: number;
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  primaryImageUrl: string | null;
  taxPercentage: number;
}

export function ProductDetailClient({
  productId,
  productSlug,
  productName,
  variants,
  taxPercentage,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants[0]?.id ?? null
  );
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const price = selectedVariant
    ? (selectedVariant.discount_price ?? selectedVariant.selling_price)
    : null;
  const inStock = selectedVariant ? selectedVariant.stock_qty > 0 : false;

  const taxMultiplier =
    1 + (Number.isFinite(taxPercentage) ? taxPercentage / 100 : 0);
  const displayPrice =
    price != null ? Math.round(price * taxMultiplier * 100) / 100 : null;
  const displayOriginalPrice =
    selectedVariant != null
      ? Math.round(selectedVariant.selling_price * taxMultiplier * 100) / 100
      : null;

  const addToCart = () => {
    if (!selectedVariant || !inStock) return;
    setAdding(true);
    const cart = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("cart") ?? "[]") : [];
    const existing = cart.find(
      (i: { productId: number; variantId: number }) =>
        i.productId === productId && i.variantId === selectedVariant.id
    );
    const next = existing
      ? cart.map((i: { productId: number; variantId: number; qty: number }) =>
          i.productId === productId && i.variantId === selectedVariant.id
            ? { ...i, qty: i.qty + qty }
            : i
        )
      : [...cart, { productId, variantId: selectedVariant.id, qty, productSlug, productName, variantLabel: selectedVariant.size_label, unitPrice: price }];
    localStorage.setItem("cart", JSON.stringify(next));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cart-updated"));
    setAdding(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium">Size / variant</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  selectedVariantId === v.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-input hover:bg-muted"
                }`}
              >
                {v.size_label}
                {v.stock_qty <= 0 && " (out of stock)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedVariant && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">
              {displayPrice != null ? `${displayPrice} MVR` : "—"}
            </span>
            {selectedVariant.discount_price != null && (
              <span className="text-sm text-muted-foreground line-through">
                {displayOriginalPrice != null ? `${displayOriginalPrice} MVR` : ""}
              </span>
            )}
          </div>
          {!inStock && (
            <Badge variant="secondary">Out of stock</Badge>
          )}
          {inStock && selectedVariant.stock_qty < 10 && (
            <Badge variant="outline">Only {selectedVariant.stock_qty} left</Badge>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="qty" className="text-sm font-medium">
                Quantity
              </label>
              <input
                id="qty"
                type="number"
                min={1}
                max={inStock ? selectedVariant.stock_qty : 1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
            <Button
              onClick={addToCart}
              disabled={!inStock || adding}
            >
              {adding ? "Adding…" : "Add to cart"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
