"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/api";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "bestsellers", label: "Best sellers" },
] as const;

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string; slug: string }[]>([]);

  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const inStock = searchParams.get("in_stock") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (inStock === "true") params.set("in_stock", "true");
    params.set("page", String(page));
    params.set("limit", "24");
    return params.toString();
  }, [category, brand, sort, inStock, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = buildParams();
    fetch(`/api/products?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildParams]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]));
  }, []);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  };

  const setSort = (value: string) => setParam("sort", value);
  const setCategory = (value: string) => setParam("category", value);
  const setBrand = (value: string) => setParam("brand", value);
  const toggleInStock = () => setParam("in_stock", inStock === "true" ? "" : "true");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category || "all"}
            onChange={(e) => setCategory(e.target.value === "all" ? "" : e.target.value)}
            className={cn(
              "flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <option value="all">All categories</option>
            {(Array.isArray(categories) ? categories : []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={brand || "all"}
            onChange={(e) => setBrand(e.target.value === "all" ? "" : e.target.value)}
            className={cn(
              "flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <option value="all">All brands</option>
            {(Array.isArray(brands) ? brands : []).map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
          <Button
            variant={inStock === "true" ? "default" : "outline"}
            size="sm"
            onClick={toggleInStock}
          >
            In stock only
          </Button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={cn(
              "flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-square w-full rounded-t-lg" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="block h-full">
                <Card className="h-full flex flex-col overflow-hidden transition hover:shadow-md gap-0 py-0">
                  <div className="relative aspect-square bg-muted shrink-0">
                    {p.primary_image_url ? (
                      <Image
                        src={p.primary_image_url}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    {p.min_price != null && p.max_price != null && p.min_price < p.max_price && (
                      <Badge className="absolute right-2 top-2">From {p.min_price} MVR</Badge>
                    )}
                  </div>
                  <CardContent className="flex-1 flex flex-col p-4 min-h-0">
                    <p className="font-medium leading-tight line-clamp-2 text-sm">{p.name}</p>
                    <div className="mt-auto pt-2">
                      <p className="text-sm text-muted-foreground">
                        {p.min_price != null ? `${p.min_price} MVR` : "—"}
                        {p.max_price != null && p.min_price !== p.max_price ? ` – ${p.max_price} MVR` : ""}
                      </p>
                    </div>
                    <div className="min-h-5 mt-1">
                      {p.category && (
                        <p className="text-xs text-muted-foreground">{p.category.name}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {total > items.length && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams.toString());
                    next.set("page", String(page - 1));
                    router.push(`/shop?${next.toString()}`);
                  }}
                >
                  Previous
                </Button>
              )}
              {page * 24 < total && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams.toString());
                    next.set("page", String(page + 1));
                    router.push(`/shop?${next.toString()}`);
                  }}
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
