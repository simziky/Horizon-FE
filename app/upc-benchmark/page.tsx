import { Suspense } from "react";
import UpcBenchmarkClient from "./UpcBenchmarkClient";

export default function UpcBenchmarkPage() {
  return (
    <Suspense>
      <UpcBenchmarkClient />
    </Suspense>
  );
}
