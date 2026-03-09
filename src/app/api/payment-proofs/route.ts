import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdminApi } from "@/lib/admin-auth";

// Customer upload of a payment receipt for a bank transfer order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const orderIdRaw = formData.get("orderId");
    const file = formData.get("file");

    if (!orderIdRaw || typeof orderIdRaw !== "string") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const orderId = Number.parseInt(orderIdRaw, 10);
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id, payment_method")
      .eq("id", orderId)
      .single();

    if (!order || order.customer_id !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.payment_method !== "bank_transfer") {
      return NextResponse.json(
        { error: "Payment receipt only allowed for bank transfer orders" },
        { status: 400 }
      );
    }

    const filenameSafe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${orderId}-${Date.now()}-${filenameSafe}`;

    const storage = supabase.storage.from("payment-proofs");
    const { data: uploadData, error: uploadError } = await storage.upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: uploadError?.message ?? "Failed to upload file" },
        { status: 400 }
      );
    }

    const { data: publicUrlData } = storage.getPublicUrl(uploadData.path);
    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("payment_proofs").insert({
      order_id: orderId,
      customer_id: user.id,
      image_url: imageUrl,
      status: "pending_review",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, imageUrl });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to upload payment receipt",
      },
      { status: 500 }
    );
  }
}

// Admin listing of payment receipts, defaulting to pending_review
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const supabase = await createSupabaseServerClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending_review";

    const query = supabase
      .from("payment_proofs")
      .select(
        `
        id,
        order_id,
        customer_id,
        image_url,
        status,
        rejection_reason,
        created_at,
        reviewed_by,
        reviewed_at
      `
      )
      .order("created_at", { ascending: false });

    const { data, error } =
      status === "all" ? await query : await query.eq("status", status);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load payment receipts",
      },
      { status: 500 }
    );
  }
}

