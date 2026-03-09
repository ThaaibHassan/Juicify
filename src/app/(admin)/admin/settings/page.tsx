import { requireAdmin } from "@/lib/admin-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPricingForm } from "./pricing-form";
export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure tax, delivery fee, and other site-wide options.
        </p>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList>
          <TabsTrigger value="pricing">Pricing &amp; tax</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing" className="mt-4">
          <SettingsPricingForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
