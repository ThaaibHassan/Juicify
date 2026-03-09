export type ProfileRole = "customer" | "admin" | "staff";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "active" | "draft" | "archived";

export type ProductTabKey = "description" | "ingredients" | "usage" | "warnings";

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand_id: number | null;
  category_id: number | null;
  description: string | null;
  ingredients: string | null;
  usage_instructions: string | null;
  warnings: string | null;
  visible_tabs: ProductTabKey[] | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  size_label: string;
  weight_grams: number | null;
  cost_price: number;
  selling_price: number;
  discount_price: number | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export type DiscountCodeType = "percentage" | "fixed";

export interface DiscountCode {
  id: number;
  code: string;
  type: DiscountCodeType;
  value: number;
  min_cart_value: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_single_use: boolean;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "placed"
  | "payment_pending"
  | "payment_confirmed"
  | "ready_for_dispatch"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type PaymentMethod = "bml_gateway" | "bank_transfer" | "cod_mock";

export interface Order {
  // core identifiers
  id: number;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  // amounts
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  confirmed_revenue: number | null;
  // discount metadata
  discount_code_id: number | null;
  // customer & contact
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  // delivery information
  island: string | null;
  atoll: string | null;
  address_line: string | null;
  notes: string | null;
  // dispatch / logistics
  dispatch_date: string | null;
  dispatch_notes: string | null;
  island_tag: string | null;
  // extended delivery metadata
  delivery_type: string | null;
  boat_name: string | null;
  boat_number: string | null;
  // timestamps
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_label: string;
  sku: string;
  qty: number;
  unit_price: number;
  discount_price: number | null;
  line_revenue: number;
  line_cost: number;
  line_profit: number;
}

export type PaymentProviderStatus = "initiated" | "success" | "failed" | "cancelled";

export interface Payment {
  id: number;
  order_id: number;
  provider: string;
  provider_ref: string | null;
  status: PaymentProviderStatus;
  amount: number;
  currency: string;
  raw_payload: unknown;
  created_at: string;
}
