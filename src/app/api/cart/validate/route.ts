import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSiteSettings } from "@/lib/settings";
import { computePricing } from "@/lib/pricing";
import type { CartLine } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const discountCodeId = body.discountCodeId ?? body.discount_code_id;

    const supabase = await createSupabaseServerClient();
    const cartLines: CartLine[] = [];

    for (const line of lines) {
      const variantId = line.variantId ?? line.variant_id;
      const productId = line.productId ?? line.product_id;
      const qty = Number(line.qty);
      if (!variantId || !productId || !qty || qty < 1) continue;

      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, product_id, selling_price, discount_price, cost_price, stock_qty, is_active, sku, size_label")
        .eq("id", variantId)
        .single();
      if (!variant || !variant.is_active) continue;
      if (variant.stock_qty < qty) continue;

      const { data: product } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", productId)
        .single();
      const unitPrice = Number(variant.discount_price ?? variant.selling_price);
      cartLines.push({
        productId,
        variantId,
        qty,
        unitPrice,
        productName: product?.name ?? "Product",
        variantLabel: variant.size_label ?? "Variant",
        sku: variant.sku ?? "",
        costPrice: Number(variant.cost_price ?? 0),
      });
    }

    let discountCode = null;
    if (discountCodeId) {
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("id", discountCodeId)
        .single();
      discountCode = data;
    }

    const siteSettings = await getSiteSettings(supabase);
    const pricing = computePricing(
      cartLines,
      discountCode,
      siteSettings.default_delivery_fee,
      siteSettings.tax_percentage
    );
    return NextResponse.json({
      lines: cartLines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        qty: l.qty,
        unitPrice: l.unitPrice,
        productName: l.productName,
        variantLabel: l.variantLabel,
        sku: l.sku,
      })),
      subtotal: pricing.subtotal,
      discountTotal: pricing.discountTotal,
      totalBeforeTax: pricing.totalBeforeTax,
      taxPercentage: pricing.taxPercentage,
      taxAmount: pricing.taxAmount,
      total: pricing.total,
      deliveryFee: pricing.deliveryFee,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 500 }
    );
  }
}
