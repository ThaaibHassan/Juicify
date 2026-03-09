"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentProofReviewProps {
  id: number;
  status: string;
}

export function PaymentProofReview({ id, status }: PaymentProofReviewProps) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const updateStatus = async (nextStatus: "accepted" | "rejected") => {
    try {
      setLoading(nextStatus === "accepted" ? "accept" : "reject");
      const res = await fetch(`/api/payment-proofs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update proof");
        return;
      }
      toast.success(
        nextStatus === "accepted"
          ? "Payment receipt accepted"
          : "Payment receipt rejected"
      );
      window.location.reload();
    } catch (err) {
      toast.error("Failed to update receipt");
    } finally {
      setLoading(null);
    }
  };

  if (status === "accepted") {
    return (
      <span className="text-xs font-medium text-emerald-600">Accepted</span>
    );
  }
  if (status === "rejected") {
    return <span className="text-xs font-medium text-destructive">Rejected</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => updateStatus("accepted")}
      >
        {loading === "accept" ? "Accepting…" : "Accept"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        disabled={loading !== null}
        onClick={() => updateStatus("rejected")}
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}

