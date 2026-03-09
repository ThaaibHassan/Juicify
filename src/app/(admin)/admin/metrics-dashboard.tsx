"use client";

import { useState } from "react";
import { AdminOverviewFigures, type OverviewFigures, type OverviewTrends } from "./admin-overview-figures";
import { RevenueChart, type DailyDataPoint } from "./revenue-chart";

type ChartMetric = "revenue" | "profit" | "ordersCount";

// Map the high-level figures to an underlying chart metric where possible.
const FIGURE_TO_METRIC: Partial<Record<keyof OverviewFigures, ChartMetric>> = {
  revenueExTax: "revenue",
  profit: "profit",
  salesIncTax: "revenue",
  salesCount: "ordersCount",
};

const CLICKABLE_KEYS = Object.keys(FIGURE_TO_METRIC) as (keyof OverviewFigures)[];

const FIGURE_TITLES: Partial<Record<keyof OverviewFigures, string>> = {
  revenueExTax: "Revenue (Ex. Tax) over time",
  salesIncTax: "Sales (Inc. Tax) over time",
  profit: "Profit over time",
  salesCount: "Sales count over time",
};

const FIGURE_SUBTITLES: Partial<Record<keyof OverviewFigures, string>> = {
  revenueExTax: "Revenue excluding tax for the selected period",
  salesIncTax: "Sales including tax for the selected period",
  profit: "Profit for the selected period",
  salesCount: "Number of successful orders per day",
};

export interface MetricsDashboardProps {
  figures: OverviewFigures;
  trends: OverviewTrends;
  chartData: DailyDataPoint[];
}

export function MetricsDashboard({ figures, trends, chartData }: MetricsDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("revenue");
  const [activeFigureKey, setActiveFigureKey] = useState<keyof OverviewFigures | undefined>(
    "revenueExTax"
  );

  const title =
    (activeFigureKey && FIGURE_TITLES[activeFigureKey]) ??
    (activeMetric === "revenue"
      ? "Revenue over time"
      : activeMetric === "profit"
      ? "Profit over time"
      : "Sales count over time");

  const subtitle =
    (activeFigureKey && FIGURE_SUBTITLES[activeFigureKey]) ??
    (activeMetric === "revenue"
      ? "Confirmed revenue for the selected period"
      : activeMetric === "profit"
      ? "Profit for the selected period"
      : "Number of successful orders per day");

  return (
    <div className="space-y-5">
      <AdminOverviewFigures
        figures={figures}
        trends={trends}
        activeKey={activeFigureKey}
        clickableKeys={CLICKABLE_KEYS}
        onSelectFigure={(key) => {
          setActiveFigureKey(key);
          const metric = FIGURE_TO_METRIC[key];
          if (metric) {
            setActiveMetric(metric);
          }
        }}
      />
      <RevenueChart
        data={chartData}
        title={title}
        subtitle={subtitle}
        metric={activeMetric}
      />
    </div>
  );
}

