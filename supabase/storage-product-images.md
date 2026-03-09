# Product images storage bucket

The admin product image upload uses a Supabase Storage bucket named **`product-images`**.

## Setup

1. In **Supabase Dashboard** go to **Storage**.
2. Click **New bucket**.
3. Name: `product-images`.
4. Enable **Public bucket** so product images can be displayed on the store (public URLs).
5. Create the bucket.

No RLS policies are required if the bucket is public for read; the upload API uses the authenticated admin user. If you enable RLS on Storage, allow:

- **SELECT** (read): public or `true` so the store can show images.
- **INSERT**: authenticated users (admin upload is done server-side with the user’s session).

After the bucket exists, product image upload in **Admin → Products → Edit product** will work.
