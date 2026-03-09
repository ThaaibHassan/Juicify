import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { SiteContentMap } from "@/types/api";

const DEFAULTS: SiteContentMap = {
  announcement: { enabled: false, text: "" },
  hero_banners: [],
  promo_strips: [],
  featured_slugs: [],
  bestseller_slugs: [],
  popular_categories: [],
};

export async function getSiteContent(): Promise<SiteContentMap> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("site_content")
    .select("key, value");

  if (error) return DEFAULTS;

  const map: SiteContentMap = { ...DEFAULTS };
  for (const row of rows ?? []) {
    const key = row.key as keyof SiteContentMap;
    if (key && row.value != null) {
      (map as Record<string, unknown>)[key] = row.value;
    }
  }
  return map;
}

/** Homepage product card shape */
export interface HomepageProduct {
  slug: string;
  name: string;
  image: string | null;
  price: string;
  oldPrice: string | null;
  category: string | null;
}

export async function getHomepageProducts(
  slugs: string[],
  limit: number
): Promise<HomepageProduct[]> {
  const supabase = await createSupabaseServerClient();

  if (slugs.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select(
        `
        slug,
        name,
        categories(name),
        product_variants(selling_price, discount_price, is_active),
        product_images(image_url, is_primary, sort_order)
      `
      )
      .eq("status", "active")
      .in("slug", slugs);

    if (!products?.length) return [];

    const bySlug = new Map(
      products.map((p) => {
        const categoryValue =
          Array.isArray(p.categories) && p.categories.length > 0
            ? p.categories[0]
            : p.categories;
        return [
          p.slug,
          {
            slug: p.slug as string,
            name: p.name as string,
            category: (categoryValue as { name: string } | null)?.name ?? null,
            variants:
              (p.product_variants as Array<{
                selling_price: number;
                discount_price?: number | null;
                is_active?: boolean;
              }>) ?? [],
            images:
              (p.product_images as Array<{
                image_url: string;
                is_primary: boolean;
                sort_order: number;
              }>) ?? [],
          },
        ];
      })
    );

    const ordered = slugs
      .map((s) => bySlug.get(s))
      .filter(Boolean) as Array<{
      slug: string;
      name: string;
      category: string | null;
      variants: Array<{ selling_price: number; discount_price?: number | null; is_active?: boolean }>;
      images: Array<{ image_url: string; is_primary: boolean; sort_order: number }>;
    }>;

    return ordered.map((p) => {
      const active = p.variants.filter((v) => v.is_active !== false);
      const prices = active.map((v) => v.discount_price ?? v.selling_price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const displayPrice = minPrice === maxPrice ? String(minPrice) : `${minPrice}`;
      const hasDiscount = active.some((v) => v.discount_price != null && v.discount_price < v.selling_price);
      const sortedImages = [...p.images].sort((a, b) => a.sort_order - b.sort_order);
      const primary = sortedImages.find((i) => i.is_primary) ?? sortedImages[0];
      return {
        slug: p.slug,
        name: p.name,
        image: primary?.image_url ?? null,
        price: displayPrice,
        oldPrice: hasDiscount && maxPrice > minPrice ? String(maxPrice) : null,
        category: p.category,
      };
    });
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      slug,
      name,
      categories(name),
      product_variants(selling_price, discount_price, is_active),
      product_images(image_url, is_primary, sort_order)
    `
    )
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!products?.length) return [];

  return products.map((p) => {
    const variants =
      (p.product_variants as Array<{
        selling_price: number;
        discount_price?: number | null;
        is_active?: boolean;
      }>) ?? [];
    const active = variants.filter((v) => v.is_active !== false);
    const prices = active.map((v) => v.discount_price ?? v.selling_price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const images =
      (p.product_images as Array<{
        image_url: string;
        is_primary: boolean;
        sort_order: number;
      }>) ?? [];
    const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
    const primary = sortedImages.find((i) => i.is_primary) ?? sortedImages[0];
    const categoryValue =
      Array.isArray(p.categories) && p.categories.length > 0
        ? p.categories[0]
        : p.categories;
    return {
      slug: p.slug as string,
      name: p.name as string,
      image: primary?.image_url ?? null,
      price: String(minPrice),
      oldPrice: null,
      category: (categoryValue as { name: string } | null)?.name ?? null,
    };
  });
}
