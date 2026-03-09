import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { confirmPaymentAndRestockOnFailure } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body.orderId ?? body.order_id;
    const success = body.success === true;

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const result = await confirmPaymentAndRestockOnFailure(supabase, orderId, success);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (success) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, total")
        .eq("id", orderId)
        .single();
      if (order) {
        await supabase.from("payments").insert({
          order_id: orderId,
          provider: "bml_mock",
          provider_ref: `mock-${Date.now()}`,
          status: "success",
          amount: order.total,
          currency: "MVR",
          raw_payload: body,
        });
      }
    } else {
      await supabase.from("payments").insert({
        order_id: orderId,
        provider: "bml_mock",
        provider_ref: `mock-fail-${Date.now()}`,
        status: "failed",
        amount: 0,
        currency: "MVR",
        raw_payload: body,
      });
    }

    return NextResponse.json({ ok: true, success });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment callback failed" },
      { status: 500 }
    );
  }
}
