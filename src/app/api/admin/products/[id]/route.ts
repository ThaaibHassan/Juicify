import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { name, slug, brand_id, category_id, description, ingredients, usage_instructions, warnings, visible_tabs, status, variants: variantsPayload } = body;
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (slug != null) updates.slug = slug.toLowerCase().replace(/\s+/g, "-");
  if (brand_id !== undefined) updates.brand_id = brand_id || null;
  if (category_id !== undefined) updates.category_id = category_id || null;
  if (description !== undefined) updates.description = description || null;
  if (ingredients !== undefined) updates.ingredients = ingredients || null;
  if (usage_instructions !== undefined) updates.usage_instructions = usage_instructions || null;
  if (warnings !== undefined) updates.warnings = warnings || null;
  if (visible_tabs !== undefined) updates.visible_tabs = Array.isArray(visible_tabs) ? visible_tabs : null;
  if (status !== undefined) {
    if (status === "active") {
      const { count } = await supabase
        .from("product_images")
        .select("id", { count: "exact", head: true })
        .eq("product_id", id);
      if (count === 0) {
        return NextResponse.json(
          { error: "Add at least one product image before setting to Active." },
          { status: 400 }
        );
      }
    }
    updates.status = status;
  }
  const hasProductUpdates = Object.keys(updates).length > 0;
  const hasVariantUpdates = Array.isArray(variantsPayload) && variantsPayload.length > 0;
  if (!hasProductUpdates && !hasVariantUpdates) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  if (hasProductUpdates) {
    const { error: productError } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id);
    if (productError) return NextResponse.json({ error: productError.message }, { status: 400 });
  }
  if (hasVariantUpdates) {
    for (const v of variantsPayload) {
      if (v?.id == null) continue;
      const variantUpdates: Record<string, unknown> = {};
      if (typeof v.selling_price === "number" && v.selling_price >= 0) variantUpdates.selling_price = v.selling_price;
      if (typeof v.cost_price === "number" && v.cost_price >= 0) variantUpdates.cost_price = v.cost_price;
      if (typeof v.stock_qty === "number" && v.stock_qty >= 0) variantUpdates.stock_qty = Math.floor(v.stock_qty);
      if (Object.keys(variantUpdates).length === 0) continue;
      const { error: variantError } = await supabase
        .from("product_variants")
        .update(variantUpdates)
        .eq("id", v.id)
        .eq("product_id", id);
      if (variantError) return NextResponse.json({ error: variantError.message }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
