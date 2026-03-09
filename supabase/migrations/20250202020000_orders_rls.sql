-- RLS for orders table so admin/staff can update payment_status when accepting payment receipts.
-- Without an UPDATE policy, accepting a receipt updates payment_proofs but the order update
-- affects 0 rows (RLS blocks it) and no error is returned, so payment_status stays "pending".

alter table public.orders enable row level security;

-- Customers can read their own orders
create policy "Users can read own orders" on public.orders
  for select using (auth.uid() = customer_id);

-- Admin and staff can read all orders
create policy "Admin and staff can read all orders" on public.orders
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

-- Customers can insert their own orders (checkout)
create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = customer_id);

-- Admin and staff can update orders (e.g. payment_status, status when accepting proof)
create policy "Admin and staff can update orders" on public.orders
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

-- Admin and staff can delete orders
create policy "Admin and staff can delete orders" on public.orders
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );
