"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DiscountCodeFormProps {
  code?: {
    id: number;
    code: string;
    type: string;
    value: number;
    min_cart_value: number | null;
    usage_limit: number | null;
    is_single_use: boolean;
    is_active: boolean;
    starts_at: string | null;
    expires_at: string | null;
  };
}

export function DiscountCodeForm({ code }: DiscountCodeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeVal, setCodeVal] = useState(code?.code ?? "");
  const [type, setType] = useState(code?.type ?? "percentage");
  const [value, setValue] = useState(code?.value ?? 0);
  const [minCartValue, setMinCartValue] = useState(code?.min_cart_value ?? "");
  const [usageLimit, setUsageLimit] = useState(code?.usage_limit ?? "");
  const [isActive, setIsActive] = useState(code?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = code ? `/api/admin/discounts/${code.id}` : "/api/admin/discounts";
    const method = code ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: codeVal.trim().toUpperCase(),
        type,
        value: Number(value),
        min_cart_value: minCartValue ? Number(minCartValue) : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        is_active: isActive,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save");
      return;
    }
    toast.success(code ? "Code updated" : "Code created");
    router.push("/admin/discounts");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <Input
              value={codeVal}
              onChange={(e) => setCodeVal(e.target.value)}
              placeholder="SAVE10"
              required
              disabled={!!code}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Value ({type === "percentage" ? "%" : "MVR"})</label>
            <Input
              type="number"
              min={0}
              step={type === "percentage" ? 1 : 0.01}
              value={value}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Min cart value (MVR, optional)</label>
            <Input
              type="number"
              min={0}
              value={minCartValue}
              onChange={(e) => setMinCartValue(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Usage limit (optional)</label>
            <Input
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="is_active" className="text-sm">Active</label>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
