import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminApi } from "@/lib/admin-auth";

const BUCKET = "product-images";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { id: productIdParam } = await params;
  const productId = Number.parseInt(productIdParam, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .single();
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) {
    return NextResponse.json(
      { error: "Allowed types: jpg, png, webp, gif" },
      { status: 400 }
    );
  }

  const path = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const storage = supabase.storage.from(BUCKET);
  const { data: uploadData, error: uploadError } = await storage.upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError || !uploadData) {
    return NextResponse.json(
      { error: uploadError?.message ?? "Upload failed" },
      { status: 400 }
    );
  }

  const { data: publicUrlData } = storage.getPublicUrl(uploadData.path);
  const imageUrl = publicUrlData.publicUrl;

  const { data: existingImages } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = existingImages?.[0]?.sort_order != null ? existingImages[0].sort_order + 1 : 0;
  const isFirst = (existingImages?.length ?? 0) === 0;

  const { data: inserted, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: imageUrl,
      is_primary: isFirst,
      sort_order: nextOrder,
    })
    .select("id, image_url, is_primary, sort_order")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }
  return NextResponse.json(inserted);
}
