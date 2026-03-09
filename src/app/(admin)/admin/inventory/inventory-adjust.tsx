"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface InventoryAdjustProps {
  variantId: number;
  currentQty: number;
}

export function InventoryAdjust({ variantId, currentQty }: InventoryAdjustProps) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAdjust = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/inventory/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to adjust");
      return;
    }
    toast.success("Stock updated");
    setOpen(false);
    setDelta(0);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Adjust</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Current: {currentQty}</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={delta === 0 ? "" : delta}
            onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
            placeholder="+ or - quantity"
          />
          <Button onClick={handleAdjust} disabled={loading}>
            {loading ? "Saving…" : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
