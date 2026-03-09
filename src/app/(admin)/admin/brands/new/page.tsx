import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { BrandForm } from "../brand-form";

export default async function NewBrandPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/brands">← Brands</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New brand</h1>
      <BrandForm />
    </div>
  );
}
