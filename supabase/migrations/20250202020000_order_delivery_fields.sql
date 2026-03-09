-- Add delivery-specific fields to orders
alter table public.orders
  add column if not exists delivery_type text,
  add column if not exists boat_name text,
  add column if not exists boat_number text;

