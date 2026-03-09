import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSiteSettings } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductDetailClient } from "./product-detail-client";
import type { ProductWithRelations } from "@/types/api";
import type { ProductVariant } from "@/types/database";

async function getProduct(slug: string): Promise<ProductWithRelations | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
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

  if (error || !data) return null;

  const activeVariants = (data.product_variants ?? []).filter(
    (v: { is_active: boolean }) => v.is_active !== false
  );
  const sortedImages = [...(data.product_images ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  return {
    ...data,
    brand: data.brands ?? null,
    category: data.categories ?? null,
    product_variants: activeVariants,
    product_images: sortedImages,
  } as ProductWithRelations;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const supabase = await createSupabaseServerClient();
  const siteSettings = await getSiteSettings(supabase);

  const variants = (product.product_variants ?? []) as ProductVariant[];
  const images = product.product_images ?? [];
  const primaryImage = images.find((i) => i.is_primary) ?? images[0];

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {primaryImage?.image_url ? (
              <Image
                src={primaryImage.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
                >
                  <Image
                    src={img.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {product.brand && (
            <Link
              href={`/shop?brand=${product.brand.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <ProductDetailClient
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            variants={variants}
            taxPercentage={siteSettings.tax_percentage}
            primaryImageUrl={primaryImage?.image_url ?? null}
          />

          {(() => {
            const visibleTabs = product.visible_tabs;
            const tabs = Array.isArray(visibleTabs) && visibleTabs.length > 0
              ? visibleTabs
              : ["description", "ingredients", "usage", "warnings"];
            const firstTab = tabs[0];
            if (tabs.length === 0) return null;
            return (
              <Tabs defaultValue={firstTab} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                  {tabs.includes("description") && <TabsTrigger value="description">Description</TabsTrigger>}
                  {tabs.includes("ingredients") && <TabsTrigger value="ingredients">Ingredients</TabsTrigger>}
                  {tabs.includes("usage") && <TabsTrigger value="usage">Usage</TabsTrigger>}
                  {tabs.includes("warnings") && <TabsTrigger value="warnings">Warnings</TabsTrigger>}
                </TabsList>
                {tabs.includes("description") && (
                  <TabsContent value="description">
                    <Card>
                      <CardContent className="pt-6">
                        {product.description ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No description.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                {tabs.includes("ingredients") && (
                  <TabsContent value="ingredients">
                    <Card>
                      <CardContent className="pt-6">
                        {product.ingredients ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {product.ingredients}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No ingredients listed.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                {tabs.includes("usage") && (
                  <TabsContent value="usage">
                    <Card>
                      <CardContent className="pt-6">
                        {product.usage_instructions ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {product.usage_instructions}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No usage instructions.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                {tabs.includes("warnings") && (
                  <TabsContent value="warnings">
                    <Card>
                      <CardContent className="pt-6">
                        {product.warnings ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {product.warnings}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No warnings.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
