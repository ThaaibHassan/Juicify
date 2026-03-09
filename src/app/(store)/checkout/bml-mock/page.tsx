import { Suspense } from "react";
import { BmlMockPageClient } from "./bml-mock-client";

export default function BmlMockPage() {
  return (
    <Suspense>
      <BmlMockPageClient />
    </Suspense>
  );
}
