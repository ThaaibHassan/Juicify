"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ProductImportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; total: number; errors: { row: number; message: string }[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      toast.error("Choose a CSV file");
      return;
    }
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Import failed");
      return;
    }
    setResult(data);
    if (data.created > 0) {
      toast.success(`Imported ${data.created} product(s)`);
      router.refresh();
    }
    if (data.errors?.length > 0) {
      toast.error(`${data.errors.length} row(s) had errors`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">CSV file</label>
        <Input type="file" accept=".csv,text/csv" className="max-w-sm" disabled={loading} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Importing…" : "Import"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
      {result && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          <p className="font-medium">
            Created {result.created} of {result.total} product(s).
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              {result.errors.map((err, i) => (
                <li key={i}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
