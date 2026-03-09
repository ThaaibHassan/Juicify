-- Payment receipts: storage bucket + RLS for storage and payment_proofs table
-- Customers upload to payment-proofs bucket; admin views images via public URL.

-- 0) Ensure payment-proofs storage bucket exists (public so admin can view image_url)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

-- 1) Storage: public read, authenticated users can upload to their own path (user_id/...)
drop policy if exists "Public read payment-proofs bucket" on storage.objects;
create policy "Public read payment-proofs bucket" on storage.objects
  for select using (bucket_id = 'payment-proofs');

drop policy if exists "Users can upload own payment proof" on storage.objects;
create policy "Users can upload own payment proof" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2) payment_proofs table RLS
alter table public.payment_proofs enable row level security;

drop policy if exists "Users can insert own payment proof" on public.payment_proofs;
create policy "Users can insert own payment proof" on public.payment_proofs
  for insert with check (auth.uid() = customer_id);

drop policy if exists "Users can read own payment proofs" on public.payment_proofs;
create policy "Users can read own payment proofs" on public.payment_proofs
  for select using (auth.uid() = customer_id);

drop policy if exists "Admin and staff can read all payment proofs" on public.payment_proofs;
create policy "Admin and staff can read all payment proofs" on public.payment_proofs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

drop policy if exists "Admin and staff can update payment proofs" on public.payment_proofs;
create policy "Admin and staff can update payment proofs" on public.payment_proofs
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );
