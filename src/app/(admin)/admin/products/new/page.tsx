import { requireAdmin } from "@/lib/admin-auth";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      <ProductForm />
    </div>
  );
}
