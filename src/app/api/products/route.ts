import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSiteSettings } from "@/lib/settings";
import type { ProductListItem } from "@/types/api";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const brandSlug = searchParams.get("brand");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const inStock = searchParams.get("in_stock");
  const sort = searchParams.get("sort") ?? "newest";
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10))
  );
  const offset = (page - 1) * limit;

  try {
    const supabase = await createSupabaseServerClient();
    const siteSettings = await getSiteSettings(supabase);
    const taxMultiplier =
      1 + (Number.isFinite(siteSettings.tax_percentage) ? siteSettings.tax_percentage / 100 : 0);

    let categoryId: number | null = null;
    let brandId: number | null = null;
    if (categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single();
      categoryId = cat?.id ?? null;
    }
    if (brandSlug) {
      const { data: br } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", brandSlug)
        .eq("is_active", true)
        .single();
      brandId = br?.id ?? null;
    }

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        status,
        brand_id,
        category_id,
        updated_at,
        brands(id, name, slug),
        categories(id, name, slug),
        product_variants(id, selling_price, discount_price, stock_qty, is_active),
        product_images(image_url, is_primary, sort_order)
      `,
        { count: "exact" }
      )
      .eq("status", "active");

    if (categoryId != null) query = query.eq("category_id", categoryId);
    if (brandId != null) query = query.eq("brand_id", brandId);
    if (q?.trim()) {
      query = query.or(`name.ilike.%${q.trim()}%,slug.ilike.%${q.trim()}%`);
    }

    const { data: products, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list: Record<string, unknown>[] = Array.isArray(products) ? products : [];

    const minP = minPrice != null ? parseFloat(minPrice) : NaN;
    const maxP = maxPrice != null ? parseFloat(maxPrice) : NaN;
    if (!Number.isNaN(minP) || !Number.isNaN(maxP)) {
      list = list.filter((p) => {
        const variants =
          (p.product_variants as Array<{ selling_price: number; is_active?: boolean }>) ?? [];
        const active = variants.filter((v) => v.is_active !== false);
        const prices = active.map((v) => v.selling_price * taxMultiplier);
        if (prices.length === 0) return false;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (!Number.isNaN(minP) && max < minP) return false;
        if (!Number.isNaN(maxP) && min > maxP) return false;
        return true;
      });
    }
    if (inStock === "true") {
      list = list.filter((p) =>
        ((p.product_variants as Array<{ stock_qty: number }>) ?? []).some((v) => v.stock_qty > 0)
      );
    }

    const sortFn = (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const va = (a.product_variants as Array<{ selling_price: number }>) ?? [];
      const vb = (b.product_variants as Array<{ selling_price: number }>) ?? [];
      const minA = va.length ? Math.min(...va.map((v) => v.selling_price * taxMultiplier)) : 0;
      const minB = vb.length ? Math.min(...vb.map((v) => v.selling_price * taxMultiplier)) : 0;
      switch (sort) {
        case "price_asc":
          return minA - minB;
        case "price_desc":
          return minB - minA;
        case "newest":
          return (
            new Date((b.updated_at as string) ?? 0).getTime() -
            new Date((a.updated_at as string) ?? 0).getTime()
          );
        default:
          return 0;
      }
    };
    list.sort(sortFn);

    const paginated = list.slice(0, limit);
    const items: ProductListItem[] = paginated.map((p) => {
      const variants =
        (p.product_variants as Array<{
          selling_price: number;
          discount_price?: number | null;
          stock_qty: number;
          is_active?: boolean;
        }>) ?? [];
      const activeVariants = variants.filter((v) => v.is_active !== false);
      const basePrices = activeVariants.map((v) => v.discount_price ?? v.selling_price);
      const pricesInclTax = basePrices.map((price) =>
        Math.round(price * taxMultiplier * 100) / 100
      );
      const images =
        (p.product_images as Array<{
          image_url: string;
          is_primary: boolean;
          sort_order: number;
        }>) ?? [];
      const sortedImages = [...images].sort((x, y) => x.sort_order - y.sort_order);
      const primaryImage = sortedImages.find((i) => i.is_primary) ?? sortedImages[0];
      return {
        id: p.id as number,
        name: p.name as string,
        slug: p.slug as string,
        status: p.status as string,
        brand_id: p.brand_id as number | null,
        category_id: p.category_id as number | null,
        brand: (p.brands as { name: string; slug: string } | null) ?? null,
        category: (p.categories as { name: string; slug: string } | null) ?? null,
        min_price: pricesInclTax.length ? Math.min(...pricesInclTax) : undefined,
        max_price: pricesInclTax.length ? Math.max(...pricesInclTax) : undefined,
        primary_image_url: primaryImage?.image_url ?? null,
        variants_count: activeVariants.length,
      };
    });

    return NextResponse.json({
      items,
      total: list.length,
      page,
      limit,
    });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      limit: DEFAULT_LIMIT,
    });
  }
}
