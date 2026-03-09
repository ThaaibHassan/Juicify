import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function ensureUniqueProductSlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, baseSlug: string): Promise<string> {
  const candidate = baseSlug || "product";
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", candidate)
    .maybeSingle();
  if (!existing) return candidate;
  let n = 2;
  for (;;) {
    const next = `${candidate}-${n}`;
    const { data: taken } = await supabase.from("products").select("slug").eq("slug", next).maybeSingle();
    if (!taken) return next;
    n += 1;
  }
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const {
    name,
    slug,
    brand_id,
    category_id,
    description,
    ingredients,
    usage_instructions,
    warnings,
    visible_tabs,
    status,
    variants: variantsPayload,
  } = body;
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const requestedStatus = status ?? "draft";
  if (requestedStatus === "active") {
    return NextResponse.json(
      { error: "Add at least one product image before publishing. Save as draft first, then add an image and set to Active." },
      { status: 400 }
    );
  }
  const supabase = await createSupabaseServerClient();
  const baseSlug = slug && String(slug).trim() ? slugify(String(slug).trim()) : slugify(name);
  const finalSlug = await ensureUniqueProductSlug(supabase, baseSlug);
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name,
      slug: finalSlug,
      brand_id: brand_id || null,
      category_id: category_id || null,
      description: description || null,
      ingredients: ingredients || null,
      usage_instructions: usage_instructions || null,
      warnings: warnings || null,
      visible_tabs: Array.isArray(visible_tabs) ? visible_tabs : null,
      status: "draft",
    })
    .select("id, slug")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const variants: Array<{
    sku?: string;
    size_label: string;
    selling_price: number;
    cost_price?: number;
    stock_qty?: number;
  }> = Array.isArray(variantsPayload) ? variantsPayload : [];

  if (variants.length > 0) {
    const rows = [];
    for (const v of variants) {
      const sizeLabel = String(v.size_label ?? "").trim();
      if (!sizeLabel) {
        continue;
      }
      const sellingPrice = Number(v.selling_price);
      const costPrice = Number(v.cost_price ?? 0);
      const stockQtyRaw = Number(v.stock_qty ?? 0);
      const stockQty = Number.isFinite(stockQtyRaw)
        ? Math.max(0, Math.floor(stockQtyRaw))
        : 0;
      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        await supabase.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: "Each variant must have a sale price ≥ 0" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(costPrice) || costPrice < 0) {
        await supabase.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: "Each variant must have a cost price ≥ 0" },
          { status: 400 }
        );
      }
      rows.push({
        product_id: product.id,
        sku:
          (v.sku ?? "").trim() ||
          `${product.slug}-${sizeLabel.replace(/\s+/g, "-").toLowerCase()}`,
        size_label: sizeLabel,
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock_qty: stockQty,
        is_active: true,
      });
    }

    if (rows.length > 0) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(rows);
      if (variantError) {
        await supabase.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: `variants: ${variantError.message}` },
          { status: 400 }
        );
      }
    }
  }

  return NextResponse.json({ id: product.id });
}
