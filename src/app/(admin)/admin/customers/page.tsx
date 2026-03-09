import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomersRefresh } from "./customers-refresh";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const ids = (profiles ?? []).map((p: { id: string }) => p.id);
  let orderCounts: Record<string, number> = {};
  let spend: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_id, total")
      .eq("payment_status", "success");
    for (const o of orders ?? []) {
      const cid = (o as { customer_id: string }).customer_id;
      orderCounts[cid] = (orderCounts[cid] ?? 0) + 1;
      spend[cid] = (spend[cid] ?? 0) + Number((o as { total: number }).total);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer list</CardTitle>
          <CardAction>
            <CustomersRefresh />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total spend</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(profiles ?? []).map((p: { id: string; full_name: string | null; phone: string | null; created_at: string }) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                  <TableCell>{p.phone ?? "—"}</TableCell>
                  <TableCell>{orderCounts[p.id] ?? 0}</TableCell>
                  <TableCell>{spend[p.id] != null ? `${spend[p.id]} MVR` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(profiles ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No customers.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
