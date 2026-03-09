-- Site settings (single row) for tax and delivery
create table if not exists public.site_settings (
  id bigserial primary key,
  tax_percentage numeric(5, 2) not null default 0 check (tax_percentage >= 0 and tax_percentage <= 100),
  default_delivery_fee numeric(10, 2) not null default 50 check (default_delivery_fee >= 0),
  currency text not null default 'MVR',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Only admins can read/update (enforced in app; allow read for cart/checkout)
create policy "Anyone can read site_settings" on public.site_settings
  for select using (true);
create policy "Only service role can update site_settings" on public.site_settings
  for update using (true);
create policy "Only service role can insert site_settings" on public.site_settings
  for insert with check (true);

-- Seed single row (id=1)
insert into public.site_settings (id, tax_percentage, default_delivery_fee)
values (1, 0, 50)
on conflict (id) do nothing;

-- Add tax columns to orders for reporting
alter table public.orders
  add column if not exists tax_percentage numeric(5, 2) default 0,
  add column if not exists tax_total numeric(10, 2) default 0;

comment on column public.orders.tax_percentage is 'Tax rate applied at order time (e.g. GST %)';
comment on column public.orders.tax_total is 'Total tax amount for the order';
