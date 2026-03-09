"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  brands: { name: string } | null;
  categories: { name: string } | null;
};

export function ProductsTableBulk({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState(false);

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0;

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleBulkStatus = async (status: string) => {
    if (selected.size === 0) {
      toast.error("Select at least one product");
      return;
    }
    setUpdating(true);
    const res = await fetch("/api/admin/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    });
    setUpdating(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Update failed");
      return;
    }
    toast.success(data.message ?? `${data.updated} updated`);
    setSelected(new Set());
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All products</CardTitle>
      </CardHeader>
      <CardContent>
        {someSelected && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) handleBulkStatus(v);
                e.target.value = "";
              }}
              disabled={updating}
              className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Update status to…</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    aria-label={`Select ${p.name}`}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.slug}</TableCell>
                <TableCell>
                  <StatusPill status={p.status} />
                </TableCell>
                <TableCell>{(p.brands as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>{(p.categories as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No products yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
