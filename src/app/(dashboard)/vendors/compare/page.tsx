import { Suspense } from "react";
import { CompareView } from "./compare-view";

export default function ComparePage() {
  return (
    <Suspense>
      <CompareView />
    </Suspense>
  );
}
