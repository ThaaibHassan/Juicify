import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { ProductWithRelations } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        brands(*),
        categories(*),
        product_variants(*),
        product_images(*)
      `
      )
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const activeVariants = (product.product_variants ?? []).filter(
      (v: { is_active: boolean }) => v.is_active !== false
    );
    const sortedImages = [...(product.product_images ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );

    const result: ProductWithRelations = {
      ...product,
      brand: product.brands ?? null,
      category: product.categories ?? null,
      product_variants: activeVariants,
      product_images: sortedImages,
    };
    delete (result as Record<string, unknown>).brands;
    delete (result as Record<string, unknown>).categories;

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch product" },
      { status: 500 }
    );
  }
}
