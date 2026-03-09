import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryAdjust } from "./inventory-adjust";

export default async function AdminInventoryPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: variants } = await supabase
    .from("product_variants")
    .select(`
      id,
      sku,
      size_label,
      stock_qty,
      is_active,
      products(id, name, slug)
    `)
    .order("id", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(variants ?? []).map((v: any) => {
                const product =
                  Array.isArray(v.products) && v.products.length > 0 ? v.products[0] : v.products;
                return (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{product?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                  <TableCell>{v.size_label}</TableCell>
                  <TableCell>
                    <span className={v.stock_qty < 10 ? "font-medium text-destructive" : ""}>
                      {v.stock_qty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.is_active ? "default" : "secondary"}>
                      {v.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <InventoryAdjust variantId={v.id} currentQty={v.stock_qty} />
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          {(variants ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No variants.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
