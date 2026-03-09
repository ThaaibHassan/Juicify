-- Add visible_tabs to products: which tabs to show on the product page
alter table public.products
  add column if not exists visible_tabs text[] default array['description','ingredients','usage','warnings'];

comment on column public.products.visible_tabs is 'Tab keys to show on product page: description, ingredients, usage, warnings';
