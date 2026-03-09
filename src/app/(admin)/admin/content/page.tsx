import { requireAdmin } from "@/lib/admin-auth";
import { ContentManageForm } from "./content-manage-form";

export default async function AdminContentPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
      <p className="text-sm text-muted-foreground">
        Manage homepage hero banners, announcement bar, promo strips, featured products, and popular categories.
      </p>
      <ContentManageForm />
    </div>
  );
}
