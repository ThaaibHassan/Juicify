"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DailyDataPoint {
  day: string;
  revenue: number;
  profit?: number;
  ordersCount?: number;
}

export type ChartMetric = "revenue" | "profit" | "ordersCount";

const RANGES = [
  { key: "90", label: "Last 3 months" },
  { key: "30", label: "Last 30 days" },
  { key: "7", label: "Last 7 days" },
] as const;

interface RevenueChartProps {
  data: DailyDataPoint[];
  title?: string;
  subtitle?: string;
  metric?: ChartMetric;
}

export function RevenueChart({
  data,
  title = "Total Revenue",
  subtitle = "Revenue for the selected period",
  metric = "revenue",
}: RevenueChartProps) {
  const [range, setRange] = useState<"7" | "30" | "90">("90");

  const chartData = useMemo(() => {
    const days = parseInt(range, 10);
    const sorted = [...data].sort(
      (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
    );
    const sliced = sorted.slice(-days);
    return sliced.map((d) => ({
      ...d,
      dateLabel: new Date(d.day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data, range]);

  const isCountMetric = metric === "ordersCount";
  const tooltipLabel =
    metric === "profit" ? "Profit" : metric === "ordersCount" ? "Orders" : "Revenue";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border bg-muted/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key as "7" | "30" | "90")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === r.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data for this period.
          </p>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isCountMetric ? String(v) : `${v} MVR`)}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                  formatter={(value: number) => [
                    isCountMetric ? value.toLocaleString() : `${value.toLocaleString()} MVR`,
                    tooltipLabel,
                  ]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fillRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
