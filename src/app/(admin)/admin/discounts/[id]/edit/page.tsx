import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { DiscountCodeForm } from "../../discount-code-form";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: code } = await supabase.from("discount_codes").select("*").eq("id", id).single();
  if (!code) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit discount code</h1>
      <DiscountCodeForm code={code} />
      <Button variant="outline" asChild>
        <Link href="/admin/discounts">← Back</Link>
      </Button>
    </div>
  );
}
