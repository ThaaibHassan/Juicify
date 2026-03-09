import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/categories">← Categories</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New category</h1>
      <CategoryForm />
    </div>
  );
}
