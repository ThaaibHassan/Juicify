import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentMethod } from "@/types/database";
import { reserveStock, restock, type ReserveLine } from "./inventory";
import { computePricing, type CartLine } from "./pricing";
import type { DiscountCode } from "@/types/database";

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  island: string;
  atoll?: string;
  addressLine: string;
  notes?: string;
  /** 'local_delivery', 'island_delivery', or 'pickup'. Optional for backwards compatibility. */
  deliveryType?: "local_delivery" | "island_delivery" | "pickup";
  /** Required when deliveryType is 'island_delivery'. */
  boatName?: string;
  /** Required when deliveryType is 'island_delivery'. */
  boatNumber?: string;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
  discountCode?: DiscountCode | null;
  /** Tax percentage (e.g. 8 for 8% GST). Default 0. */
  taxPercentage?: number;
  /** Delivery fee in MVR. Default from site settings. */
  deliveryFee?: number;
}

function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EY-${t}-${r}`;
}

export async function createOrder(
  supabase: SupabaseClient,
  input: CreateOrderInput
): Promise<{ orderId?: number; orderNumber?: string; error?: string }> {
  const deliveryFee = input.deliveryFee ?? 50;
  const taxPercentage = input.taxPercentage ?? 0;
  const { subtotal, discountTotal, taxAmount, total, taxPercentage: appliedTaxPct } = computePricing(
    input.lines,
    input.discountCode ?? null,
    deliveryFee,
    taxPercentage
  );

  const reserveLines: ReserveLine[] = input.lines.map((l) => ({
    variantId: l.variantId,
    qty: l.qty,
  }));
  const reserveResult = await reserveStock(supabase, reserveLines);
  if (!reserveResult.ok) {
    return { error: reserveResult.error };
  }

  const orderNumber = generateOrderNumber();
  const status = input.paymentMethod === "bml_gateway" ? "payment_pending" : "placed";
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: input.customerId,
      order_number: orderNumber,
      status,
      payment_status: "pending",
      payment_method: input.paymentMethod,
      subtotal,
      discount_total: discountTotal,
      delivery_fee: deliveryFee,
      discount_code_id: input.discountCode?.id ?? null,
      tax_percentage: appliedTaxPct,
      tax_total: taxAmount,
      total,
      customer_name: input.customerName,
      email: input.email,
      phone: input.phone,
      island: input.island,
      atoll: input.atoll ?? null,
      address_line: input.addressLine,
      notes: input.notes ?? null,
      delivery_type: input.deliveryType ?? null,
      boat_name: input.boatName ?? null,
      boat_number: input.boatNumber ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    await restock(supabase, reserveLines);
    return { error: orderError?.message ?? "Failed to create order" };
  }

  const orderId = order.id as number;
  const orderItems = input.lines.map((l) => {
    const unitPrice = l.unitPrice;
    const lineSubtotal = unitPrice * l.qty;
    const lineCost = l.costPrice * l.qty;
    const lineRevenue = lineSubtotal;
    const lineProfit = lineRevenue - lineCost;
    return {
      order_id: orderId,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.productName,
      variant_label: l.variantLabel,
      sku: l.sku,
      qty: l.qty,
      unit_price: unitPrice,
      discount_price: null,
      line_revenue: lineRevenue,
      line_cost: lineCost,
      line_profit: lineProfit,
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    await restock(supabase, reserveLines);
    await supabase.from("orders").delete().eq("id", orderId);
    return { error: itemsError.message };
  }

  if (input.discountCode?.id) {
    await supabase
      .from("discount_codes")
      .update({ usage_count: (input.discountCode.usage_count ?? 0) + 1 })
      .eq("id", input.discountCode.id);
  }

  return { orderId, orderNumber };
}

export async function confirmPaymentAndRestockOnFailure(
  supabase: SupabaseClient,
  orderId: number,
  success: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "Order not found" };

  if (success) {
    const { data: items } = await supabase
      .from("order_items")
      .select("variant_id, qty")
      .eq("order_id", orderId);
    const lines: ReserveLine[] = (items ?? []).map((i: { variant_id: number; qty: number }) => ({
      variantId: i.variant_id,
      qty: i.qty,
    }));
    const { data: revData } = await supabase
      .from("order_items")
      .select("line_revenue")
      .eq("order_id", orderId);
    const confirmedRevenue = (revData ?? []).reduce((s: number, r: { line_revenue: number }) => s + r.line_revenue, 0);
    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        status: "payment_confirmed",
        payment_status: "success",
        confirmed_revenue: confirmedRevenue,
      })
      .eq("id", orderId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!updated) return { ok: false, error: "Order update had no effect (check RLS: admin/staff need update on orders)" };
    return { ok: true };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, qty")
    .eq("order_id", orderId);
  const lines: ReserveLine[] = (items ?? []).map((i: { variant_id: number; qty: number }) => ({
    variantId: i.variant_id,
    qty: i.qty,
  }));
  await restock(supabase, lines);
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", payment_status: "failed" })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
