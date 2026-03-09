-- RLS for product_images table and product-images storage bucket
-- Self-contained: creates bucket if missing, then enables RLS on table and storage.

-- 0) Ensure product-images storage bucket exists (public for getPublicUrl)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 1) product_images table: allow read for all, write for admin/staff only
alter table public.product_images enable row level security;

drop policy if exists "Anyone can read product images" on public.product_images;
create policy "Anyone can read product images" on public.product_images
  for select using (true);

drop policy if exists "Admin and staff can insert product images" on public.product_images;
create policy "Admin and staff can insert product images" on public.product_images
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

drop policy if exists "Admin and staff can update product images" on public.product_images;
create policy "Admin and staff can update product images" on public.product_images
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

drop policy if exists "Admin and staff can delete product images" on public.product_images;
create policy "Admin and staff can delete product images" on public.product_images
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

-- 2) Storage bucket product-images: allow public read, authenticated admin/staff upload and delete
-- (Storage uses storage.objects table; bucket_id is the bucket name)

drop policy if exists "Public read product-images bucket" on storage.objects;
create policy "Public read product-images bucket" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admin and staff can upload to product-images" on storage.objects;
create policy "Admin and staff can upload to product-images" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

drop policy if exists "Admin and staff can delete from product-images" on storage.objects;
create policy "Admin and staff can delete from product-images" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );
