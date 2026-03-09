import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ["draft", "active", "archived"] as const;

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { ids, status } = body as { ids?: number[]; status?: string };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "status must be draft, active, or archived" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const productIds = ids.filter((id) => Number.isFinite(Number(id))).map(Number);

  if (status === "active") {
    const { data: withImages } = await supabase
      .from("product_images")
      .select("product_id")
      .in("product_id", productIds);
    const idsWithImage = [...new Set((withImages ?? []).map((r: { product_id: number }) => r.product_id))];
    const toUpdate = productIds.filter((id) => idsWithImage.includes(id));
    const skipped = productIds.filter((id) => !idsWithImage.includes(id));
    if (toUpdate.length > 0) {
      const { error } = await supabase.from("products").update({ status: "active" }).in("id", toUpdate);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({
      updated: toUpdate.length,
      skipped: skipped.length,
      skippedIds: skipped,
      message:
        skipped.length > 0
          ? `${toUpdate.length} updated; ${skipped.length} skipped (no image—add an image in Edit to set Active).`
          : `${toUpdate.length} updated.`,
    });
  }

  const { error } = await supabase.from("products").update({ status }).in("id", productIds);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ updated: productIds.length, message: `${productIds.length} updated.` });
}
