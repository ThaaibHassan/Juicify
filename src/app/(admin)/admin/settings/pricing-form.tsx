"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsPricingForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState("");
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState("");
  const [currency, setCurrency] = useState("MVR");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setTaxPercentage(String(data.tax_percentage ?? 0));
        setDefaultDeliveryFee(String(data.default_delivery_fee ?? 50));
        setCurrency(data.currency ?? "MVR");
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tax_percentage: taxPercentage === "" ? 0 : Number(taxPercentage),
        default_delivery_fee: defaultDeliveryFee === "" ? 50 : Number(defaultDeliveryFee),
        currency: currency.trim() || "MVR",
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save");
      return;
    }
    toast.success("Pricing settings saved");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Loading settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing &amp; tax</CardTitle>
          <p className="text-muted-foreground text-sm font-normal">
            Tax percentage is applied to the order total (after discount, before tax). Delivery fee is the default flat fee per order.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="tax_percentage">Tax percentage (%)</Label>
            <Input
              id="tax_percentage"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              placeholder="0"
            />
            <p className="text-muted-foreground text-xs">e.g. 8 for 8% GST. Set to 0 to disable tax.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default_delivery_fee">Default delivery fee (MVR)</Label>
            <Input
              id="default_delivery_fee"
              type="number"
              min={0}
              step={0.01}
              value={defaultDeliveryFee}
              onChange={(e) => setDefaultDeliveryFee(e.target.value)}
              placeholder="50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="MVR"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save pricing settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
