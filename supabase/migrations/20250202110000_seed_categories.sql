-- One-time: create default categories (safe to re-run; skips existing slugs)
insert into public.categories (name, slug, is_active)
values
  ('Protein', 'protein', true),
  ('Creatine', 'creatine', true),
  ('Amino Acids', 'amino-acids', true),
  ('Carbs', 'carbs', true),
  ('Snacks', 'snacks', true),
  ('Accessories', 'accessories', true)
on conflict (slug) do nothing;
