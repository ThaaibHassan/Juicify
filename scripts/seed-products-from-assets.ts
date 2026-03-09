/**
 * One-time script: create products from images in Assets/Product and add to inventory.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Run from the app root directory; Assets/Product is at ../Assets/Product.
 *
 * Usage: npx tsx scripts/seed-products-from-assets.ts
 */

console.log("Seed products from assets: starting...");

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const BUCKET = "product-images";
const ASSETS_DIR = resolve(process.cwd(), "..", "Assets", "Product");
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function loadEnv(file: string) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) return;
  const content = readFileSync(p, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, "").trim();
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

function slugFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "product";
}

function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

loadEnv(".env.local");
loadEnv(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  const missing = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  console.error("Missing in .env.local or .env:", missing.join(", "));
  process.exit(1);
}

if (!existsSync(ASSETS_DIR)) {
  console.error("Assets directory not found:", ASSETS_DIR);
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const files = readdirSync(ASSETS_DIR).filter((f) => {
    const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
    return IMAGE_EXT.includes(ext);
  });
  console.log("Found", files.length, "image(s) in", ASSETS_DIR);

  let created = 0;
  let skipped = 0;
  const usedSlugs = new Set<string>();

  for (const filename of files) {
    const slug = slugFromFilename(filename);
    if (usedSlugs.has(slug)) {
      console.log("Skip duplicate slug:", slug);
      skipped++;
      continue;
    }
    usedSlugs.add(slug);

    const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).single();
    if (existing) {
      console.log("Skip existing product:", slug);
      skipped++;
      continue;
    }

    const name = nameFromSlug(slug);
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({ name, slug, status: "draft" })
      .select("id")
      .single();
    if (productError) {
      console.error("Product insert failed:", slug, productError.message);
      continue;
    }

    const sku = `${slug}-one-size`;
    const costPrice = Math.round((50 + Math.random() * 300) * 100) / 100;
    const sellingPrice = Math.round((costPrice * 1.2 + Math.random() * 200) * 100) / 100;
    const { error: variantError } = await supabase.from("product_variants").insert({
      product_id: product.id,
      sku,
      size_label: "One Size",
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_qty: 5 + Math.floor(Math.random() * 86),
    });
    if (variantError) {
      console.error("Variant insert failed:", slug, variantError.message);
      await supabase.from("products").delete().eq("id", product.id);
      continue;
    }

    const filePath = join(ASSETS_DIR, filename);
    const buffer = readFileSync(filePath);
    const storagePath = `${product.id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
      upsert: false,
    });
    if (uploadError) {
      console.error("Upload failed:", filename, uploadError.message);
      await supabase.from("product_variants").delete().eq("product_id", product.id);
      await supabase.from("products").delete().eq("id", product.id);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const { error: imgError } = await supabase.from("product_images").insert({
      product_id: product.id,
      image_url: urlData.publicUrl,
      is_primary: true,
      sort_order: 0,
    });
    if (imgError) {
      console.error("Product image insert failed:", slug, imgError.message);
    }

    console.log("Created:", name, slug);
    created++;
  }

  console.log("\nDone. Created", created, "product(s), skipped", skipped);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Script failed:", err?.message ?? err);
    process.exit(1);
  });
