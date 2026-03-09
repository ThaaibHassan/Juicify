import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { ProductsTableBulk } from "./products-table-bulk";
import { ProductsFilters } from "./products-filters";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; brand?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const categorySlug = params.category ?? "";
  const brandSlug = params.brand ?? "";
  const searchQ = (params.q ?? "").trim();

  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug")
    .order("name");

  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      status,
      brands(name),
      categories(name)
    `)
    .order("updated_at", { ascending: false });

  if (statusFilter && ["draft", "active", "archived"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  if (categorySlug) {
    const cat = (categories ?? []).find((c: { slug: string }) => c.slug === categorySlug);
    if (cat) query = query.eq("category_id", (cat as { id: number }).id);
  }
  if (brandSlug) {
    const brand = (brands ?? []).find((b: { slug: string }) => b.slug === brandSlug);
    if (brand) query = query.eq("brand_id", (brand as { id: number }).id);
  }
  if (searchQ) {
    const safe = searchQ.replace(/'/g, "''");
    const pattern = `%${safe}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data: products } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products/import">Bulk import</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        </div>
      </div>
      <ProductsFilters
        categories={(categories ?? []) as { id: number; name: string; slug: string }[]}
        brands={(brands ?? []) as { id: number; name: string; slug: string }[]}
        searchQuery={searchQ}
      />
      <ProductsTableBulk products={(products ?? []) as { id: number; name: string; slug: string; status: string; brands: { name: string } | null; categories: { name: string } | null }[]} />
    </div>
  );
}
