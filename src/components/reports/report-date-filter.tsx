"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  mode: "day" | "period";
  searchParams: { date?: string; from?: string; to?: string };
  basePath: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export function ReportDateFilter({ mode, searchParams, basePath }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const date = searchParams.date ?? todayISO();
  const from = searchParams.from ?? defaultFrom();
  const to = searchParams.to ?? todayISO();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (mode === "day") {
      const d = (fd.get("date") as string) || todayISO();
      startTransition(() => {
        router.push(`${basePath}?date=${d}`);
      });
    } else {
      const f = (fd.get("from") as string) || defaultFrom();
      const t = (fd.get("to") as string) || todayISO();
      startTransition(() => {
        router.push(`${basePath}?from=${f}&to=${t}`);
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {mode === "day" && (
        <div className="space-y-1.5">
          <label htmlFor="report-date" className="text-muted-foreground block text-xs font-medium">Date</label>
          <Input
            id="report-date"
            name="date"
            type="date"
            defaultValue={date}
            className="w-[160px]"
          />
        </div>
      )}
      {mode === "period" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="report-from" className="text-muted-foreground block text-xs font-medium">From</label>
            <Input
              id="report-from"
              name="from"
              type="date"
              defaultValue={from}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="report-to" className="text-muted-foreground block text-xs font-medium">To</label>
            <Input
              id="report-to"
              name="to"
              type="date"
              defaultValue={to}
              className="w-[160px]"
            />
          </div>
        </>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Applying…" : "Apply"}
      </Button>
    </form>
  );
}
