"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatTrend {
  value: number;
  label: string;
  isPositive: boolean;
}

interface AdminStatsCardsProps {
  confirmedRevenue: number;
  confirmedOrders: number;
  totalProfit: number;
  awaitingPaymentVerification: number;
  readyForDispatch: number;
  revenueTrend?: StatTrend;
  ordersTrend?: StatTrend;
  profitTrend?: StatTrend;
  growthTrend?: StatTrend;
}

function TrendBadge({ value, isPositive }: { value: number; isPositive: boolean }) {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      <Icon className="size-3" />
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

export function AdminStatsCards({
  confirmedRevenue,
  confirmedOrders,
  totalProfit,
  awaitingPaymentVerification,
  readyForDispatch,
  revenueTrend,
  ordersTrend,
  profitTrend,
  growthTrend,
}: AdminStatsCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: `${confirmedRevenue.toLocaleString()} MVR`,
      trend: revenueTrend,
      desc: revenueTrend?.isPositive ? "Trending up this month" : "Revenue for the period",
      subDesc: "From confirmed paid orders",
      icon: revenueTrend?.isPositive ? <TrendingUp className="size-4 text-muted-foreground" /> : null,
    },
    {
      title: "New Orders",
      value: String(confirmedOrders),
      trend: ordersTrend,
      desc: ordersTrend ? (ordersTrend.isPositive ? "Up this period" : "Down this period") : "Confirmed orders",
      subDesc: ordersTrend?.isPositive ? "Order volume strong" : "Acquisition needs attention",
      icon: ordersTrend?.isPositive ? <TrendingUp className="size-4 text-muted-foreground" /> : ordersTrend ? <TrendingDown className="size-4 text-muted-foreground" /> : null,
    },
    {
      title: "Total Profit",
      value: `${totalProfit.toLocaleString()} MVR`,
      trend: profitTrend,
      desc: profitTrend?.isPositive ? "Strong margins" : "From order items",
      subDesc: profitTrend?.isPositive ? "Margin targets met" : "From confirmed orders",
      icon: profitTrend?.isPositive ? <TrendingUp className="size-4 text-muted-foreground" /> : null,
    },
    {
      title: "Growth Rate",
      value: growthTrend ? `${growthTrend.value}%` : "—",
      trend: growthTrend,
      desc: growthTrend?.isPositive ? "Steady performance increase" : growthTrend ? "Below target" : "Ready for dispatch",
      subDesc: growthTrend?.isPositive ? "Meets growth projections" : `Ready: ${readyForDispatch} · Pending: ${awaitingPaymentVerification}`,
      icon: growthTrend?.isPositive ? <TrendingUp className="size-4 text-muted-foreground" /> : null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            {c.trend && <TrendBadge value={c.trend.value} isPositive={c.trend.isPositive} />}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{c.value}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              {c.icon}
              {c.desc}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">{c.subDesc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
