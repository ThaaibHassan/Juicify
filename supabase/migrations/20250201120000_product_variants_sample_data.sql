-- Update product_variants with random selling_price, cost_price, stock_qty
-- Each row gets random values (cost 50–350 MVR, selling 120–650 MVR, stock 5–90)

update public.product_variants pv
set
  cost_price = round((50 + random() * 300)::numeric, 2),
  selling_price = round((120 + random() * 530)::numeric, 2),
  stock_qty = 5 + floor(random() * 86)::int
where true;
