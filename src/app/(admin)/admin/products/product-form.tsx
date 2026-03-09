"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ProductTabKey } from "@/types/database";

const TAB_OPTIONS: { value: ProductTabKey; label: string }[] = [
  { value: "description", label: "Description" },
  { value: "ingredients", label: "Ingredients" },
  { value: "usage", label: "Usage" },
  { value: "warnings", label: "Warnings" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type VariantRow = {
  id: number;
  sku: string;
  size_label: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
};

interface ProductFormProps {
  product?: {
    id: number;
    name: string;
    slug: string;
    brand_id: number | null;
    category_id: number | null;
    description: string | null;
    ingredients: string | null;
    usage_instructions: string | null;
    warnings: string | null;
    visible_tabs?: ProductTabKey[] | string[] | null;
    status: string;
    product_variants?: VariantRow[] | null;
  };
  /** Number of product images (for edit mode). Required to set status to Active. */
  imageCount?: number;
}

export function ProductForm({ product, imageCount = 0 }: ProductFormProps) {
  const router = useRouter();
  const variantsFromProduct = (product?.product_variants ?? []) as VariantRow[];
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [ingredients, setIngredients] = useState(product?.ingredients ?? "");
  const [usageInstructions, setUsageInstructions] = useState(product?.usage_instructions ?? "");
  const [warnings, setWarnings] = useState(product?.warnings ?? "");
  const [visibleTabs, setVisibleTabs] = useState<ProductTabKey[]>(() => {
    const v = product?.visible_tabs;
    if (Array.isArray(v) && v.length > 0) return v as ProductTabKey[];
    return ["description", "ingredients", "usage", "warnings"];
  });
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [variants, setVariants] = useState<VariantRow[]>(
    variantsFromProduct.length > 0
      ? variantsFromProduct.map((v) => ({
          id: v.id,
          sku: v.sku,
          size_label: v.size_label,
          selling_price: v.selling_price,
          cost_price: v.cost_price,
          stock_qty: v.stock_qty,
        }))
      : product
        ? []
        : [
            {
              id: 1,
              sku: "",
              size_label: "",
              selling_price: 0,
              cost_price: 0,
              stock_qty: 0,
            },
          ]
  );

  // Auto-assign slug from name when slug is empty (e.g. new product or user cleared it)
  useEffect(() => {
    if (!name || slug) return;
    setSlug(slugify(name));
  }, [name, slug]);

  const canBeActive = !product || imageCount > 0;
  const isActiveWithoutImage = status === "active" && !canBeActive;

  const updateVariant = (index: number, field: keyof VariantRow, value: number) => {
    setVariants((prev) => {
      const next = [...prev];
      if (next[index]) (next[index] as Record<string, number | string>)[field] = value;
      return next;
    });
  };

  const updateVariantText = (index: number, field: "size_label" | "sku", value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      if (next[index]) (next[index] as Record<string, string>)[field] = value;
      return next;
    });
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? prev[prev.length - 1]!.id + 1 : 1,
        sku: "",
        size_label: "",
        selling_price: 0,
        cost_price: 0,
        stock_qty: 0,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const toggleVisibleTab = (tab: ProductTabKey) => {
    setVisibleTabs((prev) => {
      const next = prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab];
      return TAB_OPTIONS.map((o) => o.value).filter((v) => next.includes(v));
    });
  };
  const textareaClass = "min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActiveWithoutImage) {
      toast.error("Add at least one product image before setting to Active.");
      return;
    }
    setLoading(true);
    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = product ? "PATCH" : "POST";
    const body: Record<string, unknown> = {
      name,
      slug: slug.trim() || undefined,
      description: description || null,
      ingredients: ingredients || null,
      usage_instructions: usageInstructions || null,
      warnings: warnings || null,
      visible_tabs: visibleTabs,
      status,
    };
    if (!product && variants.length > 0) {
      const cleaned = variants
        .map((v) => {
          const sizeLabel = v.size_label.trim();
          if (!sizeLabel) return null;
          const sellingPrice = Number(v.selling_price) || 0;
          const costPrice = Number(v.cost_price) || 0;
          const stockQty = Math.max(0, Math.floor(Number(v.stock_qty) || 0));
          return {
            sku: v.sku.trim() || undefined,
            size_label: sizeLabel,
            selling_price: sellingPrice,
            cost_price: costPrice,
            stock_qty: stockQty,
          };
        })
        .filter((v) => v !== null);
      if (cleaned.length > 0) {
        body.variants = cleaned;
      }
    }
    if (product && variants.length > 0) {
      body.variants = variants.map((v) => ({
        id: v.id,
        selling_price: v.selling_price,
        cost_price: v.cost_price,
        stock_qty: v.stock_qty,
      }));
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save");
      return;
    }
    toast.success(product ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={name ? slugify(name) : "auto from name"}
            />
            <p className="mt-1 text-xs text-muted-foreground">Leave blank to auto-generate from name.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className={textareaClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Tabs to show on product page</p>
            <p className="text-xs text-muted-foreground">Tick the tabs you want to display. Only checked tabs will appear on the store product page.</p>
            <div className="flex flex-wrap gap-4">
              {TAB_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleTabs.includes(value)}
                    onChange={() => toggleVisibleTab(value)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-medium">Tab content (edit text for each tab)</p>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Ingredients</label>
              <textarea
                className={textareaClass}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="List ingredients…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Usage</label>
              <textarea
                className={textareaClass}
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                placeholder="Usage instructions…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Warnings</label>
              <textarea
                className={textareaClass}
                value={warnings}
                onChange={(e) => setWarnings(e.target.value)}
                placeholder="Warnings or precautions…"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active" disabled={!canBeActive}>Active {!canBeActive && "(add an image first)"}</option>
              <option value="archived">Archived</option>
            </select>
            {!product && (
              <p className="mt-1 text-xs text-muted-foreground">Save as draft first, then add an image and set to Active.</p>
            )}
            {isActiveWithoutImage && (
              <p className="mt-1 text-xs text-destructive">Add at least one image below before setting to Active.</p>
            )}
          </div>
          {!product && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Sizes / variants</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariantRow}
                >
                  Add size / variant
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add one or more sizes (for example <span className="font-medium">500g</span> and{" "}
                <span className="font-medium">1kg</span>). These will appear as selectable options in the shop.
              </p>
              <div className="space-y-4">
                {variants.map((v, index) => (
                  <div
                    key={v.id}
                    className="grid gap-3 md:grid-cols-5 md:items-end"
                  >
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Size label
                      </label>
                      <Input
                        placeholder="e.g. 500g, 1kg"
                        value={v.size_label}
                        onChange={(e) =>
                          updateVariantText(index, "size_label", e.target.value)
                        }
                        required={index === 0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        SKU (optional)
                      </label>
                      <Input
                        placeholder="Auto if left blank"
                        value={v.sku}
                        onChange={(e) =>
                          updateVariantText(index, "sku", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Sale price (MVR)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={v.selling_price ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "selling_price",
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={v.stock_qty ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "stock_qty",
                              Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0)
                              )
                            )
                          }
                        />
                      </div>
                      <div className="pt-5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-1 h-9 w-9 text-destructive"
                          onClick={() => removeVariantRow(index)}
                          disabled={variants.length <= 1}
                          aria-label="Remove variant"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {product && variants.length > 0 && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <p className="text-sm font-medium">Pricing &amp; stock</p>
              {variants.map((v, index) => (
                <div key={v.id} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Variant</label>
                    <p className="text-sm font-medium">{v.size_label} {v.sku && `(${v.sku})`}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Sale price (MVR)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={v.selling_price ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateVariant(index, "selling_price", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Cost price (MVR)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={v.cost_price ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateVariant(index, "cost_price", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Quantity</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={v.stock_qty ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateVariant(index, "stock_qty", Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
