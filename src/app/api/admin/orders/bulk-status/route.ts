import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";

type OrderStatus =
  | "placed"
  | "payment_pending"
  | "payment_confirmed"
  | "ready_for_dispatch"
  | "dispatched"
  | "delivered"
  | "cancelled";

type PaymentStatus = "pending" | "success" | "failed";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: [],
  payment_pending: [],
  payment_confirmed: ["ready_for_dispatch"],
  ready_for_dispatch: ["dispatched"],
  dispatched: ["delivered"],
  delivered: [],
  cancelled: [],
};

const CANCELLABLE_STATUSES: OrderStatus[] = [
  "placed",
  "payment_pending",
  "payment_confirmed",
  "ready_for_dispatch",
  "dispatched",
];

interface OrderRow {
  id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const { ids } = body as { ids?: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  const numericIds = [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)))];
  if (numericIds.length === 0) {
    return NextResponse.json({ error: "No valid ids provided" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: rows, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .in("id", numericIds);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  const orders = (rows ?? []) as OrderRow[];

  if (orders.length === 0) {
    return NextResponse.json({ updated: 0, skipped: numericIds.length, skippedIds: numericIds });
  }

  const toNextStatus: { id: number; nextStatus: OrderStatus }[] = [];
  const skippedIds: number[] = [];

  for (const order of orders) {
    if (order.status === "cancelled" || order.status === "delivered") {
      skippedIds.push(order.id);
      continue;
    }

    if (order.payment_status !== "success" && !CANCELLABLE_STATUSES.includes(order.status)) {
      skippedIds.push(order.id);
      continue;
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    const next = allowed?.[0];

    if (!next) {
      skippedIds.push(order.id);
      continue;
    }

    toNextStatus.push({ id: order.id, nextStatus: next });
  }

  if (toNextStatus.length === 0) {
    return NextResponse.json({
      updated: 0,
      skipped: numericIds.length,
      skippedIds,
      message: "No orders could be advanced to the next status.",
    });
  }

  // Group updates by next status so we can perform batched updates.
  const updatesByStatus = toNextStatus.reduce<Record<OrderStatus, number[]>>(
    (acc, { id, nextStatus }) => {
      if (!acc[nextStatus]) acc[nextStatus] = [];
      acc[nextStatus].push(id);
      return acc;
    },
    {
      placed: [],
      payment_pending: [],
      payment_confirmed: [],
      ready_for_dispatch: [],
      dispatched: [],
      delivered: [],
      cancelled: [],
    }
  );

  for (const [status, idsForStatus] of Object.entries(updatesByStatus) as [OrderStatus, number[]][]) {
    if (idsForStatus.length === 0) continue;

    const updates: Record<string, unknown> = { status };
    if (status === "dispatched") {
      updates.dispatch_date = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("orders").update(updates).in("id", idsForStatus);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const updatedCount = toNextStatus.length;
  const totalSkipped = skippedIds.length + (numericIds.length - orders.length);

  return NextResponse.json({
    updated: updatedCount,
    skipped: totalSkipped,
    skippedIds,
    message:
      totalSkipped > 0
        ? `${updatedCount} orders advanced; ${totalSkipped} skipped (already at final status, cancelled, or not eligible).`
        : `${updatedCount} orders advanced.`,
  });
}

