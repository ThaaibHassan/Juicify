import { Suspense } from "react";
import { ShopPageClient } from "./shop-client";

export default function ShopPage() {
  return (
    <Suspense>
      <ShopPageClient />
    </Suspense>
  );
}
