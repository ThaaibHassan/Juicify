-- Site content for homepage hero, announcement bar, promos (admin-managed)
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public read for storefront
create policy "Anyone can read site_content"
  on public.site_content for select
  using (true);

-- Only admins/staff can insert, update, delete
create policy "Admins can insert site_content"
  on public.site_content for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
  );
create policy "Admins can update site_content"
  on public.site_content for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
  )
  with check (true);
create policy "Admins can delete site_content"
  on public.site_content for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
  );

comment on table public.site_content is 'Key-value store for homepage banners, announcement bar, promo strips. Keys: announcement, hero_banners, promo_strips, featured_slugs, bestseller_slugs, popular_categories.';
