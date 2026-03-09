"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function CustomersRefresh() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.refresh()}
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </Button>
  );
}
