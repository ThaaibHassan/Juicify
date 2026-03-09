"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { OrderActions } from "../orders/order-actions";
import { Button } from "@/components/ui/button";

type DeliveryStatus = "payment_confirmed" | "ready_for_dispatch" | "dispatched" | "delivered";

export interface DeliveryOrder {
  id: number;
  order_number: string;
  status: DeliveryStatus;
  payment_status: string;
  payment_method: string;
  total: number;
  customer_name: string | null;
  email: string | null;
  island: string | null;
  address_line: string | null;
  delivery_type: string | null;
  created_at: string;
}

const NEXT_STATUS: Record<DeliveryStatus, DeliveryStatus | null> = {
  payment_confirmed: "ready_for_dispatch",
  ready_for_dispatch: "dispatched",
  dispatched: "delivered",
  delivered: null,
};

interface DeliveriesTableProps {
  orders: DeliveryOrder[];
}

export function DeliveriesTable({ orders }: DeliveriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const allSelected = orders.length > 0 && selectedIds.length === orders.length;
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkAdvance = async () => {
    if (!hasSelection) {
      toast.error("Select at least one order to update.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update selected orders.");
        return;
      }

      const message: string =
        typeof data.message === "string"
          ? data.message
          : "Selected orders updated.";

      toast.success(message);
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Some orders could not be updated.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">Delivery queue</CardTitle>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            {hasSelection
              ? `${selectedIds.length} selected`
              : "Select orders to update their status"}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasSelection || isUpdating}
            onClick={handleBulkAdvance}
          >
            Advance status for selected
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Delivery type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select order ${o.order_number}`}
                    checked={selectedIds.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                    {o.order_number}
                  </Link>
                </TableCell>
                <TableCell>{o.customer_name ?? o.email ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span>{o.island}</span>
                    {o.address_line && (
                      <span className="truncate max-w-[220px]">{o.address_line}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs">
                  {o.delivery_type?.replace("_", " ") ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusPill status={o.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <OrderActions
                    orderId={o.id}
                    orderNumber={o.order_number}
                    status={o.status}
                    paymentStatus={o.payment_status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No deliveries in the queue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

