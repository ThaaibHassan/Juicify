"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OverviewFigures {
  revenueExTax: number;
  revenueExTaxFees: number;
  cost: number;
  profit: number;
  discounts: number;
  taxCollected: number;
  feesCollected: number;
  salesIncTax: number;
  salesCount: number;
  refundBills: number;
  voidBills: number;
}

export interface OverviewTrends {
  revenueExTax: number;
  revenueExTaxFees: number;
  cost: number;
  profit: number;
  discounts: number;
  taxCollected: number;
  feesCollected: number;
  salesIncTax: number;
  salesCount: number;
  refundBills: number;
  voidBills: number;
}

interface AdminOverviewFiguresProps {
  figures: OverviewFigures;
  trends?: OverviewTrends;
  activeKey?: keyof OverviewFigures;
  onSelectFigure?: (key: keyof OverviewFigures) => void;
  clickableKeys?: (keyof OverviewFigures)[];
}

const formatMvr = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MVR`;

function TrendBadge({ pct }: { pct: number }) {
  const value = Math.abs(Math.round(pct * 10) / 10);
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground">
        <Minus className="size-3" />
        — 0%
      </span>
    );
  }
  const isPositive = pct >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${
        isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      <Icon className="size-3" />
      {isPositive ? "↑" : "↓"} {value}%
    </span>
  );
}

export function AdminOverviewFigures({
  figures,
  trends,
  activeKey,
  onSelectFigure,
  clickableKeys,
}: AdminOverviewFiguresProps) {
  const items: { key: keyof OverviewFigures; title: string; value: string }[] = [
    { key: "revenueExTax", title: "Revenue (Ex. Tax)", value: formatMvr(figures.revenueExTax) },
    { key: "cost", title: "Cost", value: formatMvr(figures.cost) },
    { key: "profit", title: "Profit", value: formatMvr(figures.profit) },
    { key: "discounts", title: "Discounts", value: formatMvr(figures.discounts) },
    { key: "taxCollected", title: "Tax Collected", value: formatMvr(figures.taxCollected) },
    { key: "feesCollected", title: "Fees Collected", value: formatMvr(figures.feesCollected) },
    { key: "salesIncTax", title: "Sales (Inc. Tax)", value: formatMvr(figures.salesIncTax) },
    { key: "salesCount", title: "Sales Count", value: String(figures.salesCount) },
    { key: "refundBills", title: "Refund Bills", value: String(figures.refundBills) },
    { key: "voidBills", title: "Void Bills", value: String(figures.voidBills) },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map(({ key, title, value }) => {
        const isActive = activeKey === key;
        const isClickable =
          !!onSelectFigure && (!clickableKeys || clickableKeys.includes(key));
        return (
          <Card
            key={key}
            className={cn(
              "overflow-hidden transition-colors",
              isClickable && "cursor-pointer",
              isActive ? "border-primary/60 bg-primary/5" : isClickable ? "hover:bg-muted/60" : ""
            )}
            onClick={isClickable ? () => onSelectFigure?.(key) : undefined}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 pt-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              {trends != null && <TrendBadge pct={trends[key]} />}
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <p className="text-xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
