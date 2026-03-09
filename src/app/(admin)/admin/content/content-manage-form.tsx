"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="mb-1 block text-sm font-medium" {...props}>
      {children}
    </label>
  );
}
import type {
  SiteContentMap,
  AnnouncementContent,
  HeroBannerItem,
  PromoStripItem,
} from "@/types/api";

const DEFAULT_ANNOUNCEMENT: AnnouncementContent = { enabled: false, text: "" };
const DEFAULT_HERO: HeroBannerItem = {
  title: "",
  subtitle: "",
  link: "/shop",
  image_url: "",
  cta_text: "Shop Now",
  badge_text: "",
};
const DEFAULT_PROMO: PromoStripItem = {
  title: "",
  subtitle: "",
  link: "/shop",
  image_url: "",
  cta_text: "Shop now",
  badge_text: "",
};

export function ContentManageForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementContent>(DEFAULT_ANNOUNCEMENT);
  const [heroBanners, setHeroBanners] = useState<HeroBannerItem[]>([{ ...DEFAULT_HERO }, { ...DEFAULT_HERO }]);
  const [promoStrips, setPromoStrips] = useState<PromoStripItem[]>([
    { ...DEFAULT_PROMO },
    { ...DEFAULT_PROMO },
    { ...DEFAULT_PROMO },
  ]);
  const [featuredSlugs, setFeaturedSlugs] = useState("");
  const [bestsellerSlugs, setBestsellerSlugs] = useState("");
  const [popularCategories, setPopularCategories] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/content")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        if (cancelled) return;
        if (data.announcement && typeof data.announcement === "object") {
          const a = data.announcement as AnnouncementContent;
          setAnnouncement({ enabled: !!a.enabled, text: a.text ?? "" });
        }
        if (Array.isArray(data.hero_banners)) {
          const arr = data.hero_banners as HeroBannerItem[];
          setHeroBanners([
            { ...DEFAULT_HERO, ...arr[0] },
            { ...DEFAULT_HERO, ...arr[1] },
          ].slice(0, 2));
        }
        if (Array.isArray(data.promo_strips)) {
          const arr = data.promo_strips as PromoStripItem[];
          setPromoStrips([
            { ...DEFAULT_PROMO, ...arr[0] },
            { ...DEFAULT_PROMO, ...arr[1] },
            { ...DEFAULT_PROMO, ...arr[2] },
          ].slice(0, 3));
        }
        if (Array.isArray(data.featured_slugs)) {
          setFeaturedSlugs((data.featured_slugs as string[]).join(", "));
        }
        if (Array.isArray(data.bestseller_slugs)) {
          setBestsellerSlugs((data.bestseller_slugs as string[]).join(", "));
        }
        if (Array.isArray(data.popular_categories)) {
          const cats = data.popular_categories as { name: string; slug: string; icon?: string }[];
          setPopularCategories(
            cats.map((c) => (c.icon ? `${c.name}|${c.slug}|${c.icon}` : `${c.name}|${c.slug}`)).join("\n")
          );
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load content");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const popularCategoriesParsed = popularCategories
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          name: parts[0] ?? "",
          slug: (parts[1] ?? "").toLowerCase().replace(/\s+/g, "-"),
          icon: parts[2] ?? undefined,
        };
      })
      .filter((c) => c.name && c.slug);

    const payload: SiteContentMap = {
      announcement,
      hero_banners: heroBanners,
      promo_strips: promoStrips,
      featured_slugs: featuredSlugs.split(",").map((s) => s.trim()).filter(Boolean),
      bestseller_slugs: bestsellerSlugs.split(",").map((s) => s.trim()).filter(Boolean),
      popular_categories: popularCategoriesParsed.length ? popularCategoriesParsed : undefined,
    };

    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to save");
      return;
    }
    toast.success("Content saved");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Announcement bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement bar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shown at the top of the store. Leave text empty or disable to hide.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="announcement-enabled"
              checked={announcement.enabled}
              onChange={(e) => setAnnouncement((a) => ({ ...a, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="announcement-enabled">Show announcement bar</Label>
          </div>
          <div>
            <Label htmlFor="announcement-text">Text</Label>
            <Input
              id="announcement-text"
              value={announcement.text}
              onChange={(e) => setAnnouncement((a) => ({ ...a, text: e.target.value }))}
              placeholder="e.g. Free delivery on orders over 500 MVR"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero banners (2) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero banners</CardTitle>
          <p className="text-sm text-muted-foreground">
            Two main banners on the homepage. Title, link and CTA are required.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {heroBanners.map((hero, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="font-medium text-sm">Banner {i + 1}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={hero.title}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], title: e.target.value };
                        return next;
                      })
                    }
                    placeholder="e.g. Premium Protein"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={hero.subtitle ?? ""}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], subtitle: e.target.value };
                        return next;
                      })
                    }
                    placeholder="e.g. From 899 MVR"
                  />
                </div>
                <div>
                  <Label>Link (URL)</Label>
                  <Input
                    value={hero.link}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], link: e.target.value };
                        return next;
                      })
                    }
                    placeholder="/shop?category=protein"
                  />
                </div>
                <div>
                  <Label>CTA button text</Label>
                  <Input
                    value={hero.cta_text ?? ""}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], cta_text: e.target.value };
                        return next;
                      })
                    }
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label>Badge text (optional)</Label>
                  <Input
                    value={hero.badge_text ?? ""}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], badge_text: e.target.value };
                        return next;
                      })
                    }
                    placeholder="e.g. SALE 30% OFF"
                  />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={hero.image_url ?? ""}
                    onChange={(e) =>
                      setHeroBanners((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], image_url: e.target.value };
                        return next;
                      })
                    }
                    placeholder="/products/hero.jpg"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Promo strips (3) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promo strips</CardTitle>
          <p className="text-sm text-muted-foreground">
            Three smaller promo blocks below hero. Same fields as hero.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {promoStrips.map((promo, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="font-medium text-sm">Strip {i + 1}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={promo.title}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], title: e.target.value };
                        return next;
                      })
                    }
                    placeholder="e.g. Premium Protein"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={promo.subtitle ?? ""}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], subtitle: e.target.value };
                        return next;
                      })
                    }
                    placeholder="From 899 MVR"
                  />
                </div>
                <div>
                  <Label>Link</Label>
                  <Input
                    value={promo.link}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], link: e.target.value };
                        return next;
                      })
                    }
                    placeholder="/shop?category=protein"
                  />
                </div>
                <div>
                  <Label>CTA text</Label>
                  <Input
                    value={promo.cta_text ?? ""}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], cta_text: e.target.value };
                        return next;
                      })
                    }
                    placeholder="Shop now"
                  />
                </div>
                <div>
                  <Label>Badge (optional)</Label>
                  <Input
                    value={promo.badge_text ?? ""}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], badge_text: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={promo.image_url ?? ""}
                    onChange={(e) =>
                      setPromoStrips((arr) => {
                        const next = [...arr];
                        next[i] = { ...next[i], image_url: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Featured & Bestseller slugs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured &amp; bestseller products</CardTitle>
          <p className="text-sm text-muted-foreground">
            Product slugs (comma-separated). Homepage shows these in &quot;Today&apos;s Best Deals&quot; and &quot;Best Sellers&quot;. Leave empty to show latest products.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Featured product slugs (Today&apos;s Best Deals)</Label>
            <Input
              value={featuredSlugs}
              onChange={(e) => setFeaturedSlugs(e.target.value)}
              placeholder="impact-whey-protein-powder, impact-diet-whey, the-creatine-creapure"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Bestseller product slugs</Label>
            <Input
              value={bestsellerSlugs}
              onChange={(e) => setBestsellerSlugs(e.target.value)}
              placeholder="impact-whey-isolate-powder, baked-protein-cookie"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Popular categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            One per line: <code className="rounded bg-muted px-1">Name|slug</code> or <code className="rounded bg-muted px-1">Name|slug|emoji</code>. Example: Protein|protein|💪
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            value={popularCategories}
            onChange={(e) => setPopularCategories(e.target.value)}
            placeholder={"Protein|protein|💪\nCreatine|creatine|⚡\nSnacks|snacks|🍪"}
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={5}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save all content"}
      </Button>
    </div>
  );
}
