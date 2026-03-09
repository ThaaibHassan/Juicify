/**
 * One-time script to create the initial admin user.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: npx tsx scripts/create-admin.ts
 * Or:    npm run create-admin
 */

console.log("Create-admin: starting...");

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ADMIN_EMAIL = "admin@juicify.local";
const ADMIN_PASSWORD = "AdminPass123!";
const ADMIN_NAME = "Admin";

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

console.log("Create-admin: connecting to Supabase...");
const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log("Create-admin: checking for existing admin user...");
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === ADMIN_EMAIL);
  let userId: string;

  if (found) {
    console.log("Admin user already exists:", ADMIN_EMAIL);
    userId = found.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) {
      console.error("Failed to create admin user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Created admin user:", ADMIN_EMAIL);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: ADMIN_NAME, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to set admin role:", updateError.message);
    process.exit(1);
  }
  console.log("Admin role set for:", ADMIN_EMAIL);
  console.log("\nCredentials:");
  console.log("  Email:   ", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
  console.log("\nSign in at /login then go to /admin");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Create-admin failed:", err?.message ?? err);
    process.exit(1);
  });
