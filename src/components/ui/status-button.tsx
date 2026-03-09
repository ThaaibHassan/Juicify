"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  FileEdit,
  Activity,
  Archive,
  Clock,
  Package,
  Truck,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusButtonVariants = {
  all: {
    bg: "#e5e7eb",
    text: "#374151",
    shadow: "0 4px 14px rgba(107, 114, 128, 0.25)",
    icon: LayoutGrid,
  },
  draft: {
    bg: "#fcd34d",
    text: "#92400e",
    shadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
    icon: FileEdit,
  },
  active: {
    bg: "#86efac",
    text: "#166534",
    shadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
    icon: Activity,
  },
  archived: {
    bg: "#c084fc",
    text: "#6b21a8",
    shadow: "0 4px 14px rgba(192, 132, 252, 0.25)",
    icon: Archive,
  },
  payment_pending: {
    bg: "#fcd34d",
    text: "#92400e",
    shadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
    icon: Clock,
  },
  ready_for_dispatch: {
    bg: "#93c5fd",
    text: "#1e40af",
    shadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
    icon: Package,
  },
  dispatched: {
    bg: "#a5f3fc",
    text: "#155e75",
    shadow: "0 4px 14px rgba(6, 182, 212, 0.3)",
    icon: Truck,
  },
  delivered: {
    bg: "#86efac",
    text: "#166534",
    shadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
    icon: CheckCircle,
  },
} as const;

export type StatusButtonVariant = keyof typeof statusButtonVariants;

export interface StatusButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  variant: StatusButtonVariant;
  label: string;
  href: string;
  isActive?: boolean;
  className?: string;
}

export function StatusButton({
  variant,
  label,
  href,
  isActive = true,
  className,
  ...props
}: StatusButtonProps) {
  const config = statusButtonVariants[variant] ?? statusButtonVariants.all;
  const Icon = config.icon as LucideIcon;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all",
        "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      style={
        isActive
          ? {
              backgroundColor: config.bg,
              color: config.text,
              boxShadow: config.shadow,
            }
          : {
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }
      }
      {...props}
    >
      <Icon
        className="size-3.5 shrink-0"
        style={{ color: isActive ? config.text : "#6b7280" }}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}
