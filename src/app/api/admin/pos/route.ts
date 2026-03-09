import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createOrder, confirmPaymentAndRestockOnFailure } from "@/lib/orders";
import { getSiteSettings } from "@/lib/settings";
import { requireAdminApi } from "@/lib/admin-auth";
import type { CartLine } from "@/lib/pricing";

/** POST /api/admin/pos - Register a manual sale (admin only). Creates order and marks payment confirmed. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;

  try {
    const body = await request.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() || "Walk-in" : "Walk-in";
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;
    const discountCodeRaw = typeof body.discountCode === "string" ? body.discountCode.trim() : null;
    const deliveryFeeOverride = typeof body.deliveryFee === "number" && body.deliveryFee >= 0 ? body.deliveryFee : undefined;
    const rawPaymentMethod = body.paymentMethod === "bank_transfer" ? "bank_transfer" : "cash";
    const paymentMethod: "bank_transfer" | "cod_mock" =
      rawPaymentMethod === "bank_transfer" ? "bank_transfer" : "cod_mock";

    if (lines.length === 0) {
      return NextResponse.json({ error: "Add at least one product to the sale." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const cartLines: CartLine[] = [];

    for (const line of lines) {
      const variantId = line.variantId ?? line.variant_id;
      const productId = line.productId ?? line.product_id;
      const qty = Number(line.qty);
      if (!variantId || !productId || !qty || qty < 1) {
        return NextResponse.json({ error: "Invalid line: variantId, productId, qty (>=1) required." }, { status: 400 });
      }
      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, product_id, selling_price, discount_price, cost_price, stock_qty, is_active, sku, size_label")
        .eq("id", variantId)
        .single();
      if (!variant || !variant.is_active) {
        return NextResponse.json({ error: `Variant ${variantId} not found or inactive.` }, { status: 400 });
      }
      if (variant.product_id !== productId) {
        return NextResponse.json({ error: `Variant ${variantId} does not match product ${productId}.` }, { status: 400 });
      }
      if (variant.stock_qty < qty) {
        return NextResponse.json({ error: `Insufficient stock for ${variant.sku ?? variantId} (available: ${variant.stock_qty}).` }, { status: 400 });
      }
      const { data: product } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", productId)
        .single();
      const unitPrice = Number(variant.discount_price ?? variant.selling_price);
      const costPrice = Number(variant.cost_price ?? 0);
      cartLines.push({
        productId,
        variantId,
        qty,
        unitPrice,
        productName: product?.name ?? "Product",
        variantLabel: variant.size_label ?? "Variant",
        sku: variant.sku ?? "",
        costPrice,
      });
    }

    let discountCode = null;
    if (discountCodeRaw) {
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCodeRaw)
        .eq("is_active", true)
        .single();
      discountCode = data;
    }

    const siteSettings = await getSiteSettings(supabase);
    const deliveryFee = deliveryFeeOverride ?? siteSettings.default_delivery_fee;

    const result = await createOrder(supabase, {
      customerId: user.id,
      customerName,
      email: "",
      phone: "",
      island: "Pickup",
      addressLine: notes ? `POS: ${notes}` : "POS / Manual sale",
      notes: notes ?? undefined,
      paymentMethod,
      lines: cartLines,
      discountCode: discountCode ?? undefined,
      taxPercentage: siteSettings.tax_percentage,
      deliveryFee,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.orderId) {
      return NextResponse.json({ error: "Order was not created." }, { status: 500 });
    }

    const confirmResult = await confirmPaymentAndRestockOnFailure(supabase, result.orderId, true);
    if (!confirmResult.ok) {
      return NextResponse.json(
        { error: confirmResult.error ?? "Order created but could not confirm payment." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register sale" },
      { status: 500 }
    );
  }
}
