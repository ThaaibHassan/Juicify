import type { Product, ProductVariant, ProductImage, Category, Brand } from "./database";

export interface ProductWithRelations extends Product {
  brand?: Brand | null;
  category?: Category | null;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  status: string;
  brand_id: number | null;
  category_id: number | null;
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
  min_price?: number;
  max_price?: number;
  primary_image_url: string | null;
  variants_count?: number;
}

export interface ProductsListParams {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "bestsellers";
  q?: string;
  page?: number;
  limit?: number;
}

/** Site content (admin-managed homepage content) */
export interface AnnouncementContent {
  enabled: boolean;
  text: string;
}

export interface HeroBannerItem {
  title: string;
  subtitle?: string;
  link: string;
  image_url?: string;
  cta_text?: string;
  badge_text?: string;
}

export interface PromoStripItem {
  title: string;
  subtitle?: string;
  link: string;
  image_url?: string;
  cta_text?: string;
  badge_text?: string;
}

export interface SiteContentMap {
  announcement?: AnnouncementContent;
  hero_banners?: HeroBannerItem[];
  promo_strips?: PromoStripItem[];
  featured_slugs?: string[];
  bestseller_slugs?: string[];
  popular_categories?: { name: string; slug: string; icon?: string }[];
}
