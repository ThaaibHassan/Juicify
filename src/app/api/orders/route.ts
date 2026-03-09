import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createOrder } from "@/lib/orders";
import { getSiteSettings } from "@/lib/settings";
import type { CartLine } from "@/lib/pricing";
import type { PaymentMethod } from "@/types/database";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["bml_gateway", "bank_transfer", "cod_mock"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName,
      email,
      phone,
      island,
      atoll,
      addressLine,
      notes,
      paymentMethod,
      lines,
      discountCodeId,
      deliveryType,
      boatName,
      boatNumber,
    } = body;

    if (!customerName || !email || !phone || !paymentMethod || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, email, phone, paymentMethod, lines" },
        { status: 400 }
      );
    }

    const normalizedDeliveryType: "local_delivery" | "island_delivery" | "pickup" =
      deliveryType === "island_delivery" || deliveryType === "pickup" ? deliveryType : "local_delivery";

    if (normalizedDeliveryType === "local_delivery") {
      if (!island || !addressLine) {
        return NextResponse.json(
          { error: "For local delivery, island and addressLine are required" },
          { status: 400 }
        );
      }
    }

    if (normalizedDeliveryType === "island_delivery") {
      if (!island || !addressLine || !boatName || !boatNumber) {
        return NextResponse.json(
          { error: "For island delivery, island, addressLine, boatName and boatNumber are required" },
          { status: 400 }
        );
      }
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const cartLines: CartLine[] = [];
    for (const line of lines) {
      const variantId = line.variantId ?? line.variant_id;
      const productId = line.productId ?? line.product_id;
      const qty = Number(line.qty);
      if (!variantId || !productId || !qty || qty < 1) {
        return NextResponse.json({ error: "Invalid line: variantId, productId, qty (>=1) required" }, { status: 400 });
      }
      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, product_id, selling_price, discount_price, cost_price, stock_qty, is_active, sku, size_label")
        .eq("id", variantId)
        .single();
      if (!variant || !variant.is_active) {
        return NextResponse.json({ error: `Variant ${variantId} not found or inactive` }, { status: 400 });
      }
      if (variant.product_id !== productId) {
        return NextResponse.json({ error: `Variant ${variantId} does not match product ${productId}` }, { status: 400 });
      }
      if (variant.stock_qty < qty) {
        return NextResponse.json({ error: `Insufficient stock for variant ${variantId}` }, { status: 400 });
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
    if (discountCodeId) {
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("id", discountCodeId)
        .single();
      discountCode = data;
    }

    const profileResult = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    const profile = profileResult.data;
    if (!profile) {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: customerName,
        phone,
        role: "customer",
      });
      if (insertErr) {
        return NextResponse.json({ error: "Profile not found and could not be created" }, { status: 400 });
      }
    }

    const siteSettings = await getSiteSettings(supabase);
    const result = await createOrder(supabase, {
      customerId: user.id,
      customerName,
      email,
      phone,
      island: normalizedDeliveryType === "pickup" ? "Pickup" : island,
      atoll: normalizedDeliveryType === "island_delivery" ? atoll : undefined,
      addressLine: normalizedDeliveryType === "pickup" ? "Pickup" : addressLine,
      notes,
      deliveryType: normalizedDeliveryType,
      boatName: normalizedDeliveryType === "island_delivery" ? boatName : undefined,
      boatNumber: normalizedDeliveryType === "island_delivery" ? boatNumber : undefined,
      paymentMethod,
      lines: cartLines,
      discountCode,
      taxPercentage: siteSettings.tax_percentage,
      deliveryFee: siteSettings.default_delivery_fee,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      paymentMethod,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
