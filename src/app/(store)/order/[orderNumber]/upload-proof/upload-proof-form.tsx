"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UploadProofFormProps {
  orderId: number;
  orderNumber: string;
}

export function UploadProofForm({ orderId, orderNumber }: UploadProofFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Please select an image.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("orderId", String(orderId));
    formData.set("file", file);

    try {
      const res = await fetch("/api/payment-proofs", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setSubmitting(false);
        return;
      }
      router.push(`/order/${orderNumber}/confirmation`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input type="hidden" name="orderId" value={orderId} />
      <input
        type="file"
        name="file"
        accept="image/*"
        required
        disabled={submitting}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        By uploading, you confirm this slip corresponds to this order.
      </p>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Uploading…" : "Submit proof"}
      </Button>
    </form>
  );
}
