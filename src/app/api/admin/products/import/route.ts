import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\t") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required (CSV)" }, { status: 400 });
  }
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows. Expected header row + at least one row." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Load brands and categories for lookup (slug or name -> id)
  const { data: brands } = await supabase.from("brands").select("id, slug, name");
  const { data: categories } = await supabase.from("categories").select("id, slug, name");
  const brandBySlug = new Map<string, number>();
  const brandByName = new Map<string, number>();
  (brands ?? []).forEach((b: { id: number; slug: string; name: string }) => {
    brandBySlug.set((b.slug ?? "").toLowerCase(), b.id);
    brandByName.set((b.name ?? "").toLowerCase().trim(), b.id);
  });
  const categoryBySlug = new Map<string, number>();
  const categoryByName = new Map<string, number>();
  (categories ?? []).forEach((c: { id: number; slug: string; name: string }) => {
    categoryBySlug.set((c.slug ?? "").toLowerCase(), c.id);
    categoryByName.set((c.name ?? "").toLowerCase().trim(), c.id);
  });

  let created = 0;
  const errors: { row: number; message: string }[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header
    const name = (row.name ?? row.Name ?? "").trim();
    if (!name) {
      errors.push({ row: rowNum, message: "name is required" });
      continue;
    }
    const slug = (row.slug ?? row.slug ?? "").trim() || slugify(name);
    const slugLower = slug.toLowerCase().replace(/\s+/g, "-");
    const description = (row.description ?? row.Description ?? "").trim() || null;
    const categoryKey = (row.category ?? row.Category ?? "").trim().toLowerCase();
    const brandKey = (row.brand ?? row.Brand ?? "").trim().toLowerCase();
    const skuRaw = (row.sku ?? row.SKU ?? "").trim();
    const sizeLabel = (row.size_label ?? row.size ?? "").trim() || "One Size";
    const sellingPriceRaw = (row.selling_price ?? row.price ?? row.Price ?? "").trim();
    const costPriceRaw = (row.cost_price ?? row.cost ?? "").trim();
    const stockQtyRaw = (row.stock_qty ?? row.stock ?? "").trim();

    const sellingPrice = sellingPriceRaw ? parseFloat(sellingPriceRaw) : 0;
    const costPrice = costPriceRaw ? parseFloat(costPriceRaw) : 0;
    const stockQty = stockQtyRaw ? parseInt(stockQtyRaw, 10) : 0;
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push({ row: rowNum, message: "selling_price must be a number >= 0" });
      continue;
    }
    if (isNaN(costPrice) || costPrice < 0) {
      errors.push({ row: rowNum, message: "cost_price must be a number >= 0" });
      continue;
    }
    if (isNaN(stockQty) || stockQty < 0) {
      errors.push({ row: rowNum, message: "stock_qty must be an integer >= 0" });
      continue;
    }

    const brandId = brandKey
      ? brandBySlug.get(brandKey) ?? brandByName.get(brandKey) ?? null
      : null;
    if (brandKey && brandId == null) {
      errors.push({ row: rowNum, message: `Brand must be registered first. Add "${(row.brand ?? row.Brand ?? "").trim()}" in Admin → Brands.` });
      continue;
    }
    const categoryId = categoryKey
      ? categoryBySlug.get(categoryKey) ?? categoryByName.get(categoryKey) ?? null
      : null;

    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slugLower)
      .single();
    if (existingProduct) {
      errors.push({ row: rowNum, message: `slug already exists: ${slugLower}` });
      continue;
    }
    if (usedSlugs.has(slugLower)) {
      errors.push({ row: rowNum, message: `duplicate slug in file: ${slugLower}` });
      continue;
    }
    usedSlugs.add(slugLower);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        slug: slugLower,
        description,
        brand_id: brandId ?? null,
        category_id: categoryId ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (productError) {
      errors.push({ row: rowNum, message: productError.message });
      continue;
    }
    const sku = skuRaw || `${slugLower}-${sizeLabel.replace(/\s+/g, "-")}`;
    const { error: variantError } = await supabase.from("product_variants").insert({
      product_id: product.id,
      sku,
      size_label: sizeLabel,
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_qty: stockQty,
    });
    if (variantError) {
      errors.push({ row: rowNum, message: `variant: ${variantError.message}` });
      // Optionally delete the product we just created to keep consistency
      await supabase.from("products").delete().eq("id", product.id);
      continue;
    }
    created++;
  }

  return NextResponse.json({
    created,
    total: rows.length,
    errors: errors.slice(0, 50),
  });
}
