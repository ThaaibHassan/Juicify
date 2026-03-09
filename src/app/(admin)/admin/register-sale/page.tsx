import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSiteSettings } from "@/lib/settings";
import { PosClient } from "./pos-client";

export default async function RegisterSalePage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const settings = await getSiteSettings(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Point of Sale</h1>
        <p className="text-muted-foreground mt-1">
          Record sales made on other platforms (Instagram, phone, in-store). Orders are created as paid and count in revenue.
        </p>
      </div>
      <PosClient
        defaultDeliveryFee={settings.default_delivery_fee}
        taxPercentage={settings.tax_percentage}
        currency={settings.currency}
      />
    </div>
  );
}
