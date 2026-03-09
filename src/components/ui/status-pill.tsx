import * as React from "react";
import { cn } from "@/lib/utils";

/** Status → light background + dot/text color (pill with left dot). */
const statusPillThemes: Record<string, { bg: string; color: string }> = {
  // Product statuses → In Progress / Completed / Blocked style
  active: { bg: "#F0FDF4", color: "#4CAF50" },       // Completed / green
  draft: { bg: "#FFF7ED", color: "#E58D20" },       // In Progress / orange
  archived: { bg: "#FEF2F2", color: "#E83D59" },    // Blocked / red
  // Order statuses
  payment_pending: { bg: "#FFF7ED", color: "#E58D20" },
  ready_for_dispatch: { bg: "#EFF6FF", color: "#2563EB" },
  dispatched: { bg: "#ECFEFF", color: "#0891B2" },
  delivered: { bg: "#F0FDF4", color: "#4CAF50" },
  cancelled: { bg: "#FEF2F2", color: "#DC2626" },
  // Payment status
  success: { bg: "#F0FDF4", color: "#4CAF50" },
  pending: { bg: "#FFF7ED", color: "#E58D20" },
  // Aliases
  completed: { bg: "#F0FDF4", color: "#4CAF50" },
  blocked: { bg: "#FEF2F2", color: "#E83D59" },
  in_progress: { bg: "#FFF7ED", color: "#E58D20" },
};

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Raw status value (e.g. "active", "draft", "payment_pending"). */
  status: string;
  /** Optional override for display text; defaults to status. */
  children?: React.ReactNode;
}

function formatStatusLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pill with left dot + colored text on light background (table-cell status). */
export function StatusPill({ status, children, className, ...props }: StatusPillProps) {
  const normalized = status.toLowerCase().trim().replace(/\s+/g, "_");
  const theme = statusPillThemes[normalized] ?? { bg: "#F3F4F6", color: "#6B7280" };
  const label = children ?? formatStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: theme.bg, color: theme.color }}
      {...props}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: theme.color }}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}
