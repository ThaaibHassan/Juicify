-- ECOM YAN core schema
-- Run this in your Supabase project.

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  enable row level security;

-- Allow users to read/update own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
-- Allow insert for new user (trigger or signup)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    'customer'
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- CATEGORIES
create table if not exists public.categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BRANDS
create table if not exists public.brands (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  brand_id bigint references public.brands(id),
  category_id bigint references public.categories(id),
  description text,
  ingredients text,
  usage_instructions text,
  warnings text,
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCT VARIANTS
create table if not exists public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  sku text not null unique,
  size_label text not null,
  weight_grams integer,
  cost_price numeric(10, 2) not null,
  selling_price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  stock_qty integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCT IMAGES
create table if not exists public.product_images (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- DISCOUNT CODES
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

-- ORDERS
create table if not exists public.orders (
  id bigserial primary key,
  customer_id uuid not null references public.profiles(id),
  order_number text not null unique,
  status text not null default 'placed' check (
    status in (
      'placed',
      'payment_pending',
      'payment_confirmed',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
      'cancelled'
    )
  ),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'success', 'failed', 'refunded')
  ),
  payment_method text not null check (
    payment_method in ('bml_gateway', 'bank_transfer', 'cod_mock')
  ),
  subtotal numeric(10, 2) not null default 0,
  discount_total numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  tax_percentage numeric(5, 2) default 0,
  tax_total numeric(10, 2) default 0,
  total numeric(10, 2) not null default 0,
  confirmed_revenue numeric(10, 2),
  customer_name text,
  email text,
  phone text,
  island text,
  atoll text,
  address_line text,
  notes text,
  dispatch_date date,
  dispatch_notes text,
  island_tag text,
  delivery_type text,
  boat_name text,
  boat_number text,
  discount_code_id bigint references public.discount_codes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDER ITEMS
create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  variant_id bigint not null references public.product_variants(id),
  product_name text not null,
  variant_label text not null,
  sku text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  line_revenue numeric(10, 2) not null default 0,
  line_cost numeric(10, 2) not null default 0,
  line_profit numeric(10, 2) not null default 0
);

-- PAYMENTS
create table if not exists public.payments (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  provider text not null default 'bml_mock',
  provider_ref text,
  status text not null default 'initiated' check (
    status in ('initiated', 'success', 'failed', 'cancelled')
  ),
  amount numeric(10, 2) not null,
  currency text not null default 'MVR',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- SITE SETTINGS (single row: tax, delivery fee)
create table if not exists public.site_settings (
  id bigserial primary key,
  tax_percentage numeric(5, 2) not null default 0 check (tax_percentage >= 0 and tax_percentage <= 100),
  default_delivery_fee numeric(10, 2) not null default 50 check (default_delivery_fee >= 0),
  currency text not null default 'MVR',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, tax_percentage, default_delivery_fee) values (1, 0, 50) on conflict (id) do nothing;

-- PAYMENT RECEIPTS (manual/bank transfer)
create table if not exists public.payment_proofs (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  image_url text not null,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'accepted', 'rejected')
  ),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- BASIC VIEWS FOR ANALYTICS (used in admin dashboard)
create or replace view public.v_daily_revenue as
select
  date_trunc('day', o.created_at) as day,
  sum(oi.line_revenue) as revenue,
  sum(oi.line_cost) as cost,
  sum(oi.line_profit) as profit
from public.orders o
join public.order_items oi on oi.order_id = o.id
where o.payment_status = 'success'
group by 1
order by 1 desc;

create or replace view public.v_monthly_revenue as
select
  date_trunc('month', o.created_at) as month,
  sum(oi.line_revenue) as revenue,
  sum(oi.line_cost) as cost,
  sum(oi.line_profit) as profit
from public.orders o
join public.order_items oi on oi.order_id = o.id
where o.payment_status = 'success'
group by 1
order by 1 desc;

create or replace view public.v_top_products as
select
  p.id,
  p.name,
  sum(oi.qty) as total_qty,
  sum(oi.line_revenue) as total_revenue
from public.order_items oi
join public.products p on p.id = oi.product_id
join public.orders o on o.id = oi.order_id
where o.payment_status = 'success'
group by p.id, p.name
order by total_revenue desc;

