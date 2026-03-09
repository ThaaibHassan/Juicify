-- Add discount code reference to orders
alter table public.orders
  add column if not exists discount_code_id bigint references public.discount_codes(id);

