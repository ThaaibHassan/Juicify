import { Card, CardContent } from "@/components/ui/card";
import { WishlistButton } from "@/components/wishlist-button";
import Link from "next/link";
import Image from "next/image";
import { getSiteContent, getHomepageProducts, type HomepageProduct } from "@/lib/content";
import type { HeroBannerItem, PromoStripItem } from "@/types/api";

const DEFAULT_HERO: HeroBannerItem[] = [
  { title: "Premium Protein", subtitle: "From 899 MVR · Clean, authentic whey", link: "/shop?category=protein", cta_text: "Shop Now" },
  { title: "Best Deals", subtitle: "Creatine, BCAAs & more", link: "/shop", cta_text: "View All", badge_text: "SALE UP TO 30% OFF" },
];

const DEFAULT_PROMO: PromoStripItem[] = [
  { title: "Premium Protein", subtitle: "From 899 MVR", link: "/shop?category=protein", cta_text: "Shop now" },
  { title: "Creatine", subtitle: "From 599 MVR", link: "/shop?category=creatine", cta_text: "Shop now", badge_text: "30% OFF" },
  { title: "Protein Snacks", subtitle: "From 299 MVR", link: "/shop?category=snacks", cta_text: "Shop now" },
];

const DEFAULT_CATEGORIES = [
  { name: "Protein", slug: "protein", icon: "💪" },
  { name: "Creatine", slug: "creatine", icon: "⚡" },
  { name: "Amino Acids", slug: "amino-acids", icon: "🧬" },
  { name: "Carbs", slug: "carbs", icon: "🌾" },
  { name: "Snacks", slug: "snacks", icon: "🍪" },
  { name: "Accessories", slug: "accessories", icon: "🫙" },
];

function ProductCard({ p }: { p: HomepageProduct }) {
  return (
    <Link href={`/product/${p.slug}`} className="block h-full">
      <Card className="h-full flex flex-col overflow-hidden transition hover:shadow-md border-border gap-0 py-0">
        <div className="relative aspect-square bg-muted shrink-0">
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <WishlistButton />
        </div>
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <p className="font-medium leading-tight line-clamp-2 text-sm">{p.name}</p>
          <div className="mt-auto pt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{p.price} MVR</span>
            {p.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{p.oldPrice} MVR</span>
            )}
          </div>
          <div className="min-h-5 mt-1">
            {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function StoreHomePage() {
  const content = await getSiteContent();
  const [featuredProducts, bestsellerProducts] = await Promise.all([
    getHomepageProducts(content.featured_slugs ?? [], 8),
    getHomepageProducts(content.bestseller_slugs ?? [], 4),
  ]);

  const heroBanners = (content.hero_banners?.length ? content.hero_banners : DEFAULT_HERO).slice(0, 2) as HeroBannerItem[];
  const promoStrips = (content.promo_strips?.length ? content.promo_strips : DEFAULT_PROMO).slice(0, 3) as PromoStripItem[];
  const popularCategories = (content.popular_categories?.length ? content.popular_categories : DEFAULT_CATEGORIES) as typeof DEFAULT_CATEGORIES;

  const heroGradients = [
    "from-slate-800 to-slate-600",
    "from-amber-500 to-orange-600",
  ];
  const promoGradients = [
    "from-emerald-700 to-emerald-900",
    "from-violet-700 to-violet-900",
    "from-amber-700 to-amber-900",
  ];

  return (
    <div className="space-y-12 sm:space-y-14">
      {/* Hero – two banners */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heroBanners.map((hero: HeroBannerItem, i: number) => (
            <Link
              key={i}
              href={hero.link || "/shop"}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${heroGradients[i] ?? "from-slate-800 to-slate-600"} text-white min-h-[220px] sm:min-h-[260px] flex flex-col justify-between p-6`}
            >
              {hero.badge_text && (
                <span className="absolute top-4 left-4 z-10 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {hero.badge_text}
                </span>
              )}
              {hero.image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundImage: `url(${hero.image_url})` }}
                />
              )}
              <div className="relative z-10 mt-10">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{hero.title || "Shop"}</h2>
                {hero.subtitle && <p className="text-sm text-white/90 mt-1">{hero.subtitle}</p>}
                <span className="inline-flex mt-4 items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm">
                  {hero.cta_text || "Shop Now"}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-4" aria-hidden>
          <span className="size-2 rounded-full bg-muted-foreground/40" />
          <span className="size-2 rounded-full bg-muted-foreground/20" />
          <span className="size-2 rounded-full bg-muted-foreground/20" />
        </div>
      </section>

      {/* Explore Popular Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Explore Popular Categories</h2>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View All &gt;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full">
          {popularCategories.map((c: { name: string; slug: string; icon?: string }) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="flex flex-col items-center gap-2 text-center group"
            >
              <span className="flex size-20 sm:size-24 items-center justify-center rounded-full bg-muted text-2xl sm:text-3xl border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all">
                {c.icon ?? "📦"}
              </span>
              <span className="text-xs sm:text-sm font-medium text-foreground max-w-[80px]">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Best Deals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Today&apos;s Best Deals For You!</h2>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View All &gt;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
        {featuredProducts.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No products yet. Add products in Admin → Products.</p>
        )}
      </section>

      {/* Mid-page promo strips */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {promoStrips.map((promo: PromoStripItem, i: number) => (
          <Link
            key={i}
            href={promo.link || "/shop"}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${promoGradients[i] ?? "from-slate-700 to-slate-900"} text-white min-h-[140px] flex flex-col justify-end p-5`}
          >
            {promo.badge_text && (
              <span className="absolute top-3 right-3 z-10 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">
                {promo.badge_text}
              </span>
            )}
            {promo.image_url && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-35 transition-opacity"
                style={{ backgroundImage: `url(${promo.image_url})` }}
              />
            )}
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/90">{promo.title}</span>
              {promo.subtitle && <p className="mt-1 text-sm font-medium">{promo.subtitle}</p>}
              <span className="inline-flex mt-2 items-center rounded bg-white/20 px-3 py-1.5 text-xs font-medium">
                {promo.cta_text ?? "Shop now"}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Best Sellers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Best Sellers</h2>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View All &gt;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellerProducts.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
        {bestsellerProducts.length === 0 && featuredProducts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
