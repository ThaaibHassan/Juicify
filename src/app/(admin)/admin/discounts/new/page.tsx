import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiscountCodeForm } from "../discount-code-form";

export default async function NewDiscountPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New discount code</h1>
      <DiscountCodeForm />
      <Button variant="outline" asChild>
        <Link href="/admin/discounts">← Back</Link>
      </Button>
    </div>
  );
}
