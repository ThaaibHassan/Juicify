import type { SupabaseClient } from "@supabase/supabase-js";

export interface SiteSettings {
  id: number;
  tax_percentage: number;
  default_delivery_fee: number;
  currency: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  tax_percentage: 0,
  default_delivery_fee: 50,
  currency: "MVR",
  updated_at: new Date().toISOString(),
};

export async function getSiteSettings(
  supabase: SupabaseClient
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, tax_percentage, default_delivery_fee, currency, updated_at")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return {
    id: data.id,
    tax_percentage: Number(data.tax_percentage ?? 0),
    default_delivery_fee: Number(data.default_delivery_fee ?? 50),
    currency: data.currency ?? "MVR",
    updated_at: data.updated_at,
  };
}

export async function updateSiteSettings(
  supabase: SupabaseClient,
  updates: Partial<Pick<SiteSettings, "tax_percentage" | "default_delivery_fee" | "currency">>
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("site_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  return {};
}
