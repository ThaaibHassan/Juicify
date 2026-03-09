/**
 * Static product fallback removed. All products come from the database.
 * This file is kept for type compatibility; no static catalog.
 */

export interface StaticProduct {
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  brand: string;
  brandSlug: string;
  image: string;
  priceMvr: number;
}

export const STATIC_PRODUCTS: StaticProduct[] = [];

export function getStaticProductBySlug(_slug: string): StaticProduct | undefined {
  return undefined;
}

export function getStaticProductsList(_opts?: {
  category?: string;
  brand?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): { items: StaticProduct[]; total: number; page: number; limit: number } {
  return { items: [], total: 0, page: 1, limit: 24 };
}
