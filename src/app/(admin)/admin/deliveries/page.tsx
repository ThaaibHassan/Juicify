import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { StatusButton } from "@/components/ui/status-button";
import { DeliveriesTable } from "./deliveries-table";

type DeliveryStatus = "payment_confirmed" | "ready_for_dispatch" | "dispatched" | "delivered";

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: DeliveryStatus }>;
}) {
  await requireAdmin();
  const { status: filterStatus } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total, customer_name, email, island, address_line, delivery_type, created_at"
    )
    .in("status", ["payment_confirmed", "ready_for_dispatch", "dispatched", "delivered"])
    .order("created_at", { ascending: false });

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
      <div className="flex flex-wrap gap-2">
        <StatusButton
          variant="all"
          label="All"
          href="/admin/deliveries"
          isActive={!filterStatus}
        />
        <StatusButton
          variant="payment_confirmed"
          label="Payment confirmed"
          href="/admin/deliveries?status=payment_confirmed"
          isActive={filterStatus === "payment_confirmed"}
        />
        <StatusButton
          variant="ready_for_dispatch"
          label="Ready for dispatch"
          href="/admin/deliveries?status=ready_for_dispatch"
          isActive={filterStatus === "ready_for_dispatch"}
        />
        <StatusButton
          variant="dispatched"
          label="Dispatched"
          href="/admin/deliveries?status=dispatched"
          isActive={filterStatus === "dispatched"}
        />
        <StatusButton
          variant="delivered"
          label="Delivered"
          href="/admin/deliveries?status=delivered"
          isActive={filterStatus === "delivered"}
        />
      </div>
      <DeliveriesTable
        orders={(orders ?? []) as {
          id: number;
          order_number: string;
          status: DeliveryStatus;
          payment_status: string;
          payment_method: string;
          total: number;
          customer_name: string | null;
          email: string | null;
          island: string | null;
          address_line: string | null;
          delivery_type: string | null;
          created_at: string;
        }[]}
      />
    </div>
  );
}

