"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListItem } from "@/types/api";

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim()) {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", "48");
      fetch(`/api/products?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setItems(data.items ?? []);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setItems([]);
    }
  }, [q]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      {q && (
        <>
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
            <p className="text-muted-foreground">No products found for &quot;{q}&quot;.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {items.length} result{items.length !== 1 ? "s" : ""} for &quot;{q}&quot;
            </p>
          )}
          {!loading && items.length > 0 && (
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
                    </div>
                    <CardContent className="flex-1 flex flex-col p-4 min-h-0">
                      <p className="font-medium leading-tight line-clamp-2 text-sm">{p.name}</p>
                      <p className="mt-auto pt-2 text-sm text-muted-foreground">
                        {p.min_price != null ? `${p.min_price} MVR` : "—"}
                        {p.max_price != null && p.min_price !== p.max_price ? ` – ${p.max_price} MVR` : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {!q && (
        <p className="text-muted-foreground">Use the search bar above to find products.</p>
      )}
    </div>
  );
}

