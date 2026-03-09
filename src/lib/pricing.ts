import type { DiscountCode } from "@/types/database";

export interface CartLine {
  productId: number;
  variantId: number;
  qty: number;
  unitPrice: number;
  productName: string;
  variantLabel: string;
  sku: string;
  costPrice: number;
}

export interface PricingResult {
  subtotal: number;
  discountTotal: number;
  totalBeforeTax: number;
  taxPercentage: number;
  taxAmount: number;
  total: number;
  deliveryFee: number;
  discountCodeId?: number | null;
  discountCode?: string | null;
}

const DEFAULT_DELIVERY_FEE = 50;
const DEFAULT_TAX_PERCENTAGE = 0;

export function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
}

export function applyDiscount(
  subtotal: number,
  code: DiscountCode | null
): { discountTotal: number } {
  if (!code || !code.is_active) return { discountTotal: 0 };
  const now = new Date();
  if (code.starts_at && new Date(code.starts_at) > now) return { discountTotal: 0 };
  if (code.expires_at && new Date(code.expires_at) < now) return { discountTotal: 0 };
  if (code.min_cart_value != null && subtotal < code.min_cart_value) return { discountTotal: 0 };
  if (code.usage_limit != null && (code.usage_count ?? 0) >= code.usage_limit)
    return { discountTotal: 0 };

  let discountTotal = 0;
  if (code.type === "percentage") {
    discountTotal = (subtotal * Number(code.value)) / 100;
  } else {
    discountTotal = Math.min(Number(code.value), subtotal);
  }
  return { discountTotal };
}

export interface PricingOptions {
  taxPercentage?: number;
  deliveryFee?: number;
}

export function computePricing(
  lines: CartLine[],
  discountCode: DiscountCode | null,
  deliveryFee: number = DEFAULT_DELIVERY_FEE,
  taxPercentage: number = DEFAULT_TAX_PERCENTAGE
): PricingResult {
  const subtotal = computeSubtotal(lines);
  const { discountTotal } = applyDiscount(subtotal, discountCode);
  const totalBeforeTax = Math.max(0, subtotal - discountTotal + deliveryFee);
  const taxAmount = taxPercentage ? (totalBeforeTax * taxPercentage) / 100 : 0;
  const total = totalBeforeTax + taxAmount;
  return {
    subtotal,
    discountTotal,
    totalBeforeTax,
    taxPercentage,
    taxAmount,
    total: Math.round(total * 100) / 100,
    deliveryFee,
    discountCodeId: discountCode?.id ?? null,
    discountCode: discountCode?.code ?? null,
  };
}
