import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AdminOrdersPage({
  // Keep the same signature so route params work with Next.js
  // even though we no longer use filters here.
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total, confirmed_revenue, customer_name, email, created_at"
    )
    .eq("payment_status", "success")
    .order("created_at", { ascending: false });
  const { data: orders } = await query;

  const totalSales = (orders ?? []).reduce(
    (sum: number, o: { confirmed_revenue: number | null; total: number }) =>
      sum + (o.confirmed_revenue ?? o.total ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sales (paid orders)</h1>
      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between gap-4">
            <CardTitle className="text-base">Sales log</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total sales: <span className="font-medium">{totalSales} MVR</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders ?? []).map((o: {
                id: number;
                order_number: string;
                status: string;
                payment_status: string;
                payment_method: string;
                total: number;
                confirmed_revenue: number | null;
                customer_name: string | null;
                email: string | null;
                created_at: string;
              }) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                      {o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{o.customer_name ?? o.email ?? "—"}</TableCell>
                  <TableCell><StatusPill status={o.status} /></TableCell>
                  <TableCell><StatusPill status={o.payment_status} /></TableCell>
                  <TableCell>{o.total} MVR</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(orders ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
