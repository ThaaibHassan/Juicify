import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminBrandsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, description, is_active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
        <Button asChild>
          <Link href="/admin/brands/new">Add brand</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All brands</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(brands ?? []).map((b: { id: number; name: string; slug: string; is_active: boolean }) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{b.slug}</TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? "default" : "secondary"}>
                      {b.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/brands/${b.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(brands ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No brands yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
