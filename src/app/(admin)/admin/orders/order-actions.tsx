"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SquarePen, Eye, XCircle, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface OrderActionsProps {
  orderId: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  /** Show print bill button (e.g. on order detail page when payment is success) */
  showPrintBill?: boolean;
  /** If true and bill can be printed, auto-trigger print on mount (used from POS) */
  autoPrint?: boolean;
}

const NEXT_STATUS: Record<string, string> = {
  payment_confirmed: "ready_for_dispatch",
  ready_for_dispatch: "dispatched",
  dispatched: "delivered",
};

export function OrderActions({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  showPrintBill,
  autoPrint,
}: OrderActionsProps) {
  const router = useRouter();
  const nextStatus = NEXT_STATUS[status];
  const canTransition = paymentStatus === "success" && nextStatus;
  const canCancel = status !== "cancelled" && status !== "delivered";

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update");
      return;
    }
    toast.success("Order updated");
    router.refresh();
  };

  const handleCancel = () => {
    updateStatus("cancelled");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to delete");
      return;
    }
    toast.success("Order deleted");
    router.refresh();
  };

  const canPrintBill = showPrintBill && paymentStatus === "success";

  useEffect(() => {
    if (canPrintBill && autoPrint) {
      window.print();
    }
  }, [canPrintBill, autoPrint]);

  return (
    <div className="flex items-center gap-1">
      {canPrintBill && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.print()}
          aria-label="Print bill"
        >
          <Printer className="h-4 w-4" />
        </Button>
      )}
      {canTransition && (
        <Button variant="outline" size="sm" onClick={() => updateStatus(nextStatus)}>
          {nextStatus === "ready_for_dispatch" && "Ready for dispatch"}
          {nextStatus === "dispatched" && "Mark dispatched"}
          {nextStatus === "delivered" && "Mark delivered"}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Order actions">
            <SquarePen className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/orders/${orderId}`} className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              Edit order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canCancel && (
            <DropdownMenuItem
              onClick={handleCancel}
              variant="destructive"
              className="flex items-center gap-2 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Cancel order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleDelete}
            variant="destructive"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
