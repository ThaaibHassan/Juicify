import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminApi } from "@/lib/admin-auth";

const BUCKET = "product-images";

/** Extract storage object path from a product-images public URL. */
function pathFromProductImageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf(`/object/public/${BUCKET}/`);
    if (idx === -1) return null;
    return u.pathname.slice(idx + `/object/public/${BUCKET}/`.length);
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { id: productIdParam, imageId: imageIdParam } = await params;
  const productId = Number.parseInt(productIdParam, 10);
  const imageId = Number.parseInt(imageIdParam, 10);
  if (!Number.isFinite(productId) || !Number.isFinite(imageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json();
  if (body?.is_primary !== true) {
    return NextResponse.json({ error: "is_primary: true required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { id: productIdParam, imageId: imageIdParam } = await params;
  const productId = Number.parseInt(productIdParam, 10);
  const imageId = Number.parseInt(imageIdParam, 10);
  if (!Number.isFinite(productId) || !Number.isFinite(imageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();

  if (row?.image_url) {
    const path = pathFromProductImageUrl(row.image_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
