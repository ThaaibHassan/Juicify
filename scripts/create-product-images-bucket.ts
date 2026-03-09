/**
 * One-time script to create the product-images storage bucket.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: npx tsx scripts/create-product-images-bucket.ts
 */

console.log("Create product-images bucket: starting...");

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BUCKET = "product-images";

function loadEnv(file: string) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, "").trim();
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
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
  console.error("Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API → service_role");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log("Bucket already exists:", BUCKET);
    return;
  }
  const { data, error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (error) {
    console.error("Failed to create bucket:", error.message);
    process.exit(1);
  }
  console.log("Bucket created:", BUCKET, data);
}

main()
  .then(() => {
    console.log("Done. You can now add product images in Admin → Products → Edit product.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err?.message ?? err);
    process.exit(1);
  });
