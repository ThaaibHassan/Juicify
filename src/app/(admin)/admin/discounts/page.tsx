import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: codes } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discount codes</h1>
        <Button asChild>
          <Link href="/admin/discounts/new">Add code</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(codes ?? []).map((c: {
                id: number;
                code: string;
                type: string;
                value: number;
                usage_count: number;
                usage_limit: number | null;
                is_active: boolean;
                expires_at: string | null;
              }) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.type === "percentage" ? `${c.value}%` : `${c.value} MVR`}</TableCell>
                  <TableCell>{c.usage_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}</TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Yes" : "No"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/discounts/${c.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(codes ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No discount codes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
