import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { ProductForm } from "../../product-form";
import { ProductImagesSection } from "../../product-images-section";
import type { ProductImage } from "@/types/database";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, brands(*), categories(*), product_variants(*), product_images(*)")
    .eq("id", id)
    .single();
  if (!product) notFound();
  const images = (product.product_images ?? []) as ProductImage[];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
      <ProductForm product={product} imageCount={images.length} />
      <ProductImagesSection productId={product.id} images={images} />
    </div>
  );
}
