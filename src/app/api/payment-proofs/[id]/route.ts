import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { confirmPaymentAndRestockOnFailure } from "@/lib/orders";

const ALLOWED_STATUSES = ["pending_review", "accepted", "rejected"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const proofId = Number.parseInt(id, 10);
    if (!Number.isFinite(proofId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const status: AllowedStatus | undefined = body.status;
    const rejectionReason: string | undefined = body.rejectionReason;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: proof } = await supabase
      .from("payment_proofs")
      .select("order_id")
      .eq("id", proofId)
      .single();

    if (!proof?.order_id) {
      return NextResponse.json({ error: "Payment receipt not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (status === "rejected") {
      updates.rejection_reason = rejectionReason || null;
    } else {
      updates.rejection_reason = null;
    }

    const { error } = await supabase
      .from("payment_proofs")
      .update(updates)
      .eq("id", proofId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (status === "accepted") {
      const orderId = proof.order_id as number;
      const result = await confirmPaymentAndRestockOnFailure(supabase, orderId, true);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error ?? "Failed to confirm order payment" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update payment receipt",
      },
      { status: 500 }
    );
  }
}

