-- One-time fix: ensure discount_code_id exists on orders (schema cache fix)
-- Run this in Supabase Dashboard → SQL Editor if you see "Could not find the 'discount_code_id' column"

-- 1. Ensure discount_codes table exists (required for the FK)
create table if not exists public.discount_codes (
  id bigserial primary key,
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10, 2) not null,
  min_cart_value numeric(10, 2),
  usage_limit integer,
  usage_count integer not null default 0,
  is_single_use boolean not null default false,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Add discount_code_id to orders if missing
alter table public.orders
  add column if not exists discount_code_id bigint references public.discount_codes(id);
