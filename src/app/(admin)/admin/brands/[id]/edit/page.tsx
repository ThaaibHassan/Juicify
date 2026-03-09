import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { BrandForm } from "../../brand-form";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug, description, is_active")
    .eq("id", id)
    .single();
  if (!brand) notFound();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/brands">← Brands</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Edit brand</h1>
      <BrandForm brand={brand} />
    </div>
  );
}
