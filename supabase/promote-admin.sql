-- Promote a user to admin by email
-- Run in Supabase Dashboard → SQL Editor
--
-- STEP 1: Create the user first (if you don't have one):
--   - Either go to your app → /register and sign up with your email/password
--   - Or Supabase Dashboard → Authentication → Users → "Add user" (email + password)
--
-- STEP 2: Replace YOUR_EMAIL@example.com below with that email, then run this script.

do $$
declare
  admin_email text := 'admin@juicify.local';
  uid uuid;
begin
  select id into uid from auth.users where email = admin_email;
  if uid is null then
    raise exception 'No user found with email: %. Register at /register or add user in Dashboard first.', admin_email;
  end if;

  insert into public.profiles (id, full_name, phone, role, created_at, updated_at)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    u.raw_user_meta_data->>'phone',
    'admin',
    now(),
    now()
  from auth.users u
  where u.id = uid
    and not exists (select 1 from public.profiles p where p.id = u.id);

  update public.profiles
  set role = 'admin', updated_at = now()
  where id = uid;

  raise notice 'User % is now admin. Sign in at /login then go to /admin', admin_email;
end $$;
