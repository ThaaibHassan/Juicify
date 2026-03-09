import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  payment_confirmed: ["ready_for_dispatch"],
  ready_for_dispatch: ["dispatched"],
  dispatched: ["delivered"],
};

const CANCELLABLE_STATUSES = ["placed", "payment_pending", "payment_confirmed", "ready_for_dispatch", "dispatched"];

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

async function resolveOrderId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, idParam: string): Promise<number | null> {
  const { data: order } = isNumericId(idParam)
    ? await supabase.from("orders").select("id").eq("id", idParam).single()
    : await supabase.from("orders").select("id").eq("order_number", idParam).single();
  return order?.id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id: idParam } = await params;
  const body = await request.json();
  const { status } = body;
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const orderId = await resolveOrderId(supabase, idParam);
  if (orderId == null) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (status === "cancelled") {
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order in ${order.status} status` },
        { status: 400 }
      );
    }
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (order.payment_status !== "success") {
    return NextResponse.json({ error: "Only paid orders can transition" }, { status: 400 });
  }
  const allowed = ALLOWED_TRANSITIONS[order.status as keyof typeof ALLOWED_TRANSITIONS];
  if (!allowed?.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 });
  }
  const updates: Record<string, unknown> = { status };
  if (status === "dispatched") {
    updates.dispatch_date = new Date().toISOString().slice(0, 10);
  }
  const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id: idParam } = await params;
  const supabase = await createSupabaseServerClient();
  const orderId = await resolveOrderId(supabase, idParam);
  if (orderId == null) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
