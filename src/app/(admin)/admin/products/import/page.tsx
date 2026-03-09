import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductImportForm } from "../product-import-form";

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products">← Products</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Bulk import products</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV with columns: <strong>name</strong> (required), <strong>slug</strong>, <strong>description</strong>,{" "}
            <strong>category</strong> (slug or name), <strong>brand</strong> (slug or name), <strong>sku</strong>,{" "}
            <strong>size_label</strong>, <strong>selling_price</strong>, <strong>cost_price</strong>, <strong>stock_qty</strong>.
            Header row is required. Products are created as draft; add images and set to Active in Edit.
          </p>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/product-import-template.csv" download="product-import-template.csv">
              Download CSV template
            </Link>
          </Button>
          <ProductImportForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md border bg-muted/50 p-4 text-xs">
{`name,slug,description,category,brand,sku,size_label,selling_price,cost_price,stock_qty
Whey Protein,whey-protein,High quality whey,protein,Optimum Nutrition,WP-1,1kg,899.00,450.00,50
Creatine Monohydrate,creatine-mono,Pure creatine,creatine,,CR-1,300g,599.00,280.00,30`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
