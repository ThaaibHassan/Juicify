import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportDateFilter } from "./report-date-filter";

type ReportLayoutProps = {
  title: string;
  description?: string;
  mode?: "day" | "period" | "none";
  searchParams: { date?: string; from?: string; to?: string };
  basePath: string;
  children: React.ReactNode;
};

export function ReportLayout({
  title,
  description,
  mode = "none",
  searchParams,
  basePath,
  children,
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Reports
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>
        {mode !== "none" && (
          <ReportDateFilter
            mode={mode}
            searchParams={searchParams}
            basePath={basePath}
          />
        )}
      </div>

      {children}
    </div>
  );
}
