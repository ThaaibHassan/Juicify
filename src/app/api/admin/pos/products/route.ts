import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminApi } from "@/lib/admin-auth";

export interface PosProductVariant {
  id: number;
  sku: string;
  size_label: string;
  selling_price: number;
  discount_price: number | null;
  cost_price: number;
  stock_qty: number;
}

export interface PosProduct {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  variants: PosProductVariant[];
}

/** GET /api/admin/pos/products?q=... - Search products with variants for POS (admin only). */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  try {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        product_images(image_url, is_primary, sort_order),
        product_variants(
          id,
          sku,
          size_label,
          selling_price,
          discount_price,
          cost_price,
          stock_qty,
          is_active
        )
      `
      )
      .eq("status", "active")
      .limit(limit);

    if (q.length > 0) {
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data: products, error } = await query.order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list: PosProduct[] = (products ?? []).map(
      (p: {
        id: number;
        name: string;
        slug: string;
        product_images?: Array<{ image_url: string; is_primary: boolean; sort_order: number }>;
        product_variants: Array<{
          id: number;
          sku: string;
          size_label: string;
          selling_price: number;
          discount_price: number | null;
          cost_price: number;
          stock_qty: number;
          is_active: boolean;
        }>;
      }) => {
        const images = (p.product_images ?? []) as Array<{
          image_url: string;
          is_primary: boolean;
          sort_order: number;
        }>;
        const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
        const primaryImage =
          sortedImages.find((i) => i.is_primary) ?? sortedImages[0] ?? null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image_url: primaryImage?.image_url ?? null,
          variants: (p.product_variants ?? [])
            .filter((v) => v.is_active !== false)
            .map((v) => ({
              id: v.id,
              sku: v.sku,
              size_label: v.size_label,
              selling_price: Number(v.selling_price),
              discount_price: v.discount_price != null ? Number(v.discount_price) : null,
              cost_price: Number(v.cost_price),
              stock_qty: Number(v.stock_qty),
            })),
        };
      }
    );

    return NextResponse.json({ products: list });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}
