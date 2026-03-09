import { Suspense } from "react";
import { SearchPageClient } from "./search-client";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
