"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ProductImage } from "@/types/database";

interface ProductImagesSectionProps {
  productId: number;
  images: ProductImage[];
}

export function ProductImagesSection({ productId, images: initialImages }: ProductImagesSectionProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    e.target.value = "";
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Upload failed");
      return;
    }
    toast.success("Image added");
    router.refresh();
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Delete failed");
      return;
    }
    toast.success("Image removed");
    router.refresh();
  };

  const handleSetPrimary = async (imageId: number) => {
    const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to set primary");
      return;
    }
    toast.success("Primary image updated");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {initialImages.map((img) => (
              <div
                key={img.id}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted"
              >
                <Image
                  src={img.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                  {!img.is_primary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => handleSetPrimary(img.id)}
                    >
                      Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    disabled={deletingId === img.id}
                    onClick={() => handleDelete(img.id)}
                  >
                    {deletingId === img.id ? "…" : "Remove"}
                  </Button>
                </div>
                {img.is_primary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-xs text-primary-foreground">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Add image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground file:hover:bg-primary/90"
            disabled={uploading}
            onChange={handleUpload}
          />
          {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
        </div>
      </CardContent>
    </Card>
  );
}
