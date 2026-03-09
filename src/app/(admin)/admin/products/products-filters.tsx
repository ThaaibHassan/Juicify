"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: number; name: string; slug: string };
type Brand = { id: number; name: string; slug: string };

export function ProductsFilters({
  categories,
  brands,
  searchQuery = "",
}: {
  categories: Category[];
  brands: Brand[];
  searchQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";

  const setStatus = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("status", value);
    else params.delete("status");
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (searchQuery) params.set("q", searchQuery);
    router.push(`/admin/products?${params.toString()}`);
  };

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("category", slug);
    else params.delete("category");
    if (status) params.set("status", status);
    if (brand) params.set("brand", brand);
    if (searchQuery) params.set("q", searchQuery);
    router.push(`/admin/products?${params.toString()}`);
  };

  const setBrand = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("brand", slug);
    else params.delete("brand");
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (searchQuery) params.set("q", searchQuery);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim() ?? "";
    const params = new URLSearchParams(searchParams);
    if (q) params.set("q", q);
    else params.delete("q");
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    router.push(`/admin/products?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex max-w-sm items-center gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Search products by name or slug…"
          defaultValue={searchQuery}
          className="h-9"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <span className="ml-2 text-sm font-medium text-muted-foreground">Category:</span>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <span className="ml-2 text-sm font-medium text-muted-foreground">Brand:</span>
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">All</option>
        {brands.map((b) => (
          <option key={b.id} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
      </div>
    </div>
  );
}
