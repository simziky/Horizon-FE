"use client";

import {
  Profiler,
  type ProfilerOnRenderCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import ScanResultsTable from "@/components/features/upc-scanner/scan-results-table";

// ── types ────────────────────────────────────────────────────────────────────

type ScanResult = {
  id: number;
  product_name: string;
  product_id: string | null;
  items_count: number;
  products_found: number;
  last_seen: string;
  last_uploaded: string;
  status: string;
  marketplace_id: string;
  user_id: number;
  failed_reason?: string;
};

type BenchResult = {
  rowCount: number;
  filterCycles: number;
  mountActualDurationMs: number;
  domRowCount: number | null;
  filterAvgMs: number;
  filterP95Ms: number;
  filterMaxMs: number;
  restoreAvgMs: number;
  restoreP95Ms: number;
  committedUpdates: number;
  heapUsedMB: number | null;
  timestamp: string;
  virtual: true;
};

type BenchWindow = Window & {
  __upcBenchResult?: BenchResult;
};

// ── constants ────────────────────────────────────────────────────────────────

const SIZES = [100, 500, 1000, 5000, 10000];

// ── helpers ──────────────────────────────────────────────────────────────────

function parsePositiveInt(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function makeRng(seed: number) {
  let s = (seed || 1) >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function makeScanResults(count: number): ScanResult[] {
  const rand = makeRng(count);
  const statuses = ["pending", "in-progress", "completed"];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    product_name: `Scan Product ${i + 1}`,
    product_id: `B${Math.floor(rand() * 1e9).toString().padStart(9, "0")}`,
    items_count: Math.floor(rand() * 490) + 10,
    products_found: Math.floor(rand() * 100),
    last_seen: new Date(now - i * 3_600_000).toISOString(),
    last_uploaded: new Date(now - i * 3_600_000 - 1_800_000).toISOString(),
    status: statuses[i % 3],
    marketplace_id: "ATVPDKIKX0DER",
    user_id: 1,
  }));
}

// ── component ────────────────────────────────────────────────────────────────

export default function UpcBenchmarkClient() {
  const searchParams = useSearchParams();
  const rowCount = useMemo(
    () => parsePositiveInt(searchParams.get("size"), 1000),
    [searchParams],
  );
  const filterCycles = useMemo(
    () => parsePositiveInt(searchParams.get("runs"), 10),
    [searchParams],
  );
  const autostart = useMemo(
    () => searchParams.get("autostart") === "1",
    [searchParams],
  );

  // Pre-compute full and filtered datasets
  const allData = useMemo(() => makeScanResults(rowCount), [rowCount]);
  const filteredData = useMemo(
    () => allData.filter((_, i) => i % 2 === 0),
    [allData],
  );

  const [tableKey, setTableKey] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BenchResult | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const mountDurations = useRef<number[]>([]);
  const filterDurations = useRef<number[]>([]);
  const restoreDurations = useRef<number[]>([]);
  // Tracks whether the next update commit is a filter or restore phase
  const phaseRef = useRef<"filter" | "restore">("filter");
  const pendingResolve = useRef<((committed: boolean) => void) | null>(null);

  // Reset on size change
  useEffect(() => {
    setScanResults([]);
    setResult(null);
    mountDurations.current = [];
    filterDurations.current = [];
    restoreDurations.current = [];
  }, [rowCount]);

  useEffect(() => {
    if (autostart) void runBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart, rowCount, filterCycles]);

  const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
    if (phase === "mount") {
      mountDurations.current.push(actualDuration);
    } else {
      if (phaseRef.current === "filter") {
        filterDurations.current.push(actualDuration);
      } else {
        restoreDurations.current.push(actualDuration);
      }
    }
    if (pendingResolve.current) {
      const resolve = pendingResolve.current;
      pendingResolve.current = null;
      resolve(true);
    }
  };

  const waitForCommit = (timeoutMs = 10_000) =>
    new Promise<boolean>((resolve) => {
      pendingResolve.current = resolve;
      setTimeout(() => {
        if (pendingResolve.current === resolve) {
          pendingResolve.current = null;
          resolve(false);
        }
      }, timeoutMs);
    });

  const waitForPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  const countDomRows = (): number | null => {
    if (!wrapperRef.current) return null;
    return wrapperRef.current.querySelectorAll("tr.ant-table-row").length;
  };

  async function runBenchmark() {
    if (running) return;
    setRunning(true);
    setResult(null);
    mountDurations.current = [];
    filterDurations.current = [];
    restoreDurations.current = [];

    // ── 1. Mount ────────────────────────────────────────────────────────────
    setTableKey((k) => k + 1);
    setScanResults(allData);
    await waitForCommit();
    await waitForPaint();
    const domRowCount = countDomRows();
    // Brief pause to let the virtual list settle
    await new Promise((r) => setTimeout(r, 100));

    // ── 2. Filter / restore cycles ──────────────────────────────────────────
    let committedUpdates = 0;

    for (let i = 0; i < filterCycles; i++) {
      // Filter phase
      phaseRef.current = "filter";
      setScanResults(filteredData);
      const f = await waitForCommit();
      if (!f) break;
      committedUpdates++;

      // Restore phase
      phaseRef.current = "restore";
      setScanResults(allData);
      const r = await waitForCommit();
      if (!r) break;
    }

    // ── 3. Collect results ──────────────────────────────────────────────────
    const mem = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;

    const nextResult: BenchResult = {
      rowCount,
      filterCycles,
      mountActualDurationMs: Number(
        (mountDurations.current[0] ?? 0).toFixed(2),
      ),
      domRowCount,
      filterAvgMs: Number(
        (
          filterDurations.current.reduce((a, b) => a + b, 0) /
          Math.max(1, filterDurations.current.length)
        ).toFixed(2),
      ),
      filterP95Ms: Number(percentile(filterDurations.current, 95).toFixed(2)),
      filterMaxMs: Number(
        (
          filterDurations.current.length
            ? Math.max(...filterDurations.current)
            : 0
        ).toFixed(2),
      ),
      restoreAvgMs: Number(
        (
          restoreDurations.current.reduce((a, b) => a + b, 0) /
          Math.max(1, restoreDurations.current.length)
        ).toFixed(2),
      ),
      restoreP95Ms: Number(
        percentile(restoreDurations.current, 95).toFixed(2),
      ),
      committedUpdates,
      heapUsedMB: mem
        ? Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(2))
        : null,
      timestamp: new Date().toISOString(),
      virtual: true,
    };

    (window as BenchWindow).__upcBenchResult = nextResult;
    setResult(nextResult);
    setRunning(false);
  }

  // ── metrics cards config ─────────────────────────────────────────────────

  const metrics = result
    ? [
        {
          label: "DOM <tr> rows",
          value: result.domRowCount !== null ? String(result.domRowCount) : "—",
          note: `of ${result.rowCount.toLocaleString()} total — should be ~10–12`,
          highlight: true,
        },
        {
          label: "Mount time",
          value: `${result.mountActualDurationMs} ms`,
          note: "React Profiler actualDuration",
        },
        {
          label: "Filter avg",
          value: `${result.filterAvgMs} ms`,
          note: "React render cost per filter",
        },
        {
          label: "Filter P95",
          value: `${result.filterP95Ms} ms`,
          note: "95th percentile",
        },
        {
          label: "Filter max",
          value: `${result.filterMaxMs} ms`,
          note: "worst single render",
        },
        {
          label: "Restore avg",
          value: `${result.restoreAvgMs} ms`,
          note: "re-expand to full dataset",
        },
        {
          label: "Restore P95",
          value: `${result.restoreP95Ms} ms`,
          note: "95th percentile",
        },
        {
          label: "Heap used",
          value: result.heapUsedMB !== null ? `${result.heapUsedMB} MB` : "n/a",
          note: "JS heap after benchmark",
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#f7faf9] p-6">
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl rounded-xl border border-[#e6ecea] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#111827]">
          UPC Scan Results — Virtual Scroll Benchmark
        </h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Measures React render cost and DOM node count for{" "}
          <code className="rounded bg-[#f3f4f6] px-1 text-xs">
            scan-results-table.tsx
          </code>{" "}
          with{" "}
          <code className="rounded bg-[#f3f4f6] px-1 text-xs">virtual</code>{" "}
          enabled.
        </p>

        {/* Size quick-nav */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#6b7280]">Rows:</span>
          {SIZES.map((s) => (
            <a
              key={s}
              href={`?size=${s}&runs=${filterCycles}`}
              className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                s === rowCount
                  ? "bg-[#18CB96] text-white border-[#18CB96]"
                  : "bg-white text-[#374151] border-[#d1d5db] hover:border-[#18CB96]"
              }`}
            >
              {s.toLocaleString()}
            </a>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#6b7280]">
            Filter cycles:
          </span>
          {[5, 10, 20].map((r) => (
            <a
              key={r}
              href={`?size=${rowCount}&runs=${r}`}
              className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                r === filterCycles
                  ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                  : "bg-white text-[#374151] border-[#d1d5db] hover:border-[#1d4ed8]"
              }`}
            >
              {r}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void runBenchmark()}
          disabled={running}
          className="mt-5 rounded-md bg-[#18CB96] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running
            ? `Running… (${rowCount.toLocaleString()} rows × ${filterCycles} cycles)`
            : "Run Benchmark"}
        </button>

        {/* ── Metric cards ───────────────────────────────────────────────── */}
        {result && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {metrics.map(({ label, value, note, highlight }) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 ${
                    highlight
                      ? "border-[#18CB96] bg-[#f0fdf9]"
                      : "border-[#e5e7eb] bg-[#f9fafb]"
                  }`}
                >
                  <p className="text-xs text-[#6b7280]">{label}</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      highlight ? "text-[#059669]" : "text-[#111827]"
                    }`}
                  >
                    {value}
                  </p>
                  {note && (
                    <p className="mt-0.5 text-[10px] text-[#9ca3af]">{note}</p>
                  )}
                </div>
              ))}
            </div>

            {result.domRowCount !== null && result.domRowCount <= 20 && (
              <p className="mt-3 text-xs font-medium text-[#059669]">
                ✓ Virtual scroll confirmed — only {result.domRowCount} DOM rows
                rendered for {result.rowCount.toLocaleString()} data rows.
              </p>
            )}
            {result.domRowCount !== null && result.domRowCount > 20 && (
              <p className="mt-3 text-xs font-medium text-red-600">
                ✗ {result.domRowCount} DOM rows found — virtual scroll may not
                be active. Expected ~10–12.
              </p>
            )}

            <pre className="mt-4 overflow-auto rounded-lg bg-[#0b1020] p-4 text-xs text-[#e5e7eb]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </>
        )}
      </section>

      {/* ── Live table ───────────────────────────────────────────────────── */}
      <section className="mx-auto mt-6 max-w-5xl rounded-xl border border-[#e6ecea] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#374151]">
            Live Table{" "}
            <span className="font-normal text-[#9ca3af]">(being benchmarked)</span>
          </h2>
          {scanResults.length > 0 && (
            <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6b7280]">
              dataSource: {scanResults.length.toLocaleString()} rows
            </span>
          )}
        </div>

        <div ref={wrapperRef}>
          <Profiler id="upc-scan-results" onRender={onRender}>
            <ScanResultsTable
              key={tableKey}
              scanResults={scanResults}
              onDetailsClick={() => {}}
              onRefreshScan={() => {}}
              onRestartScan={() => {}}
              onDeleteScan={() => {}}
            />
          </Profiler>
        </div>
      </section>

      {/* ── What to look for ─────────────────────────────────────────────── */}
      <section className="mx-auto mt-6 max-w-5xl rounded-xl border border-[#e6ecea] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#111827]">
          Acceptance Criteria
        </h2>
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e7eb]">
              <th className="pb-2 text-left font-medium text-[#6b7280]">
                Metric
              </th>
              <th className="pb-2 text-left font-medium text-[#6b7280]">
                Target
              </th>
              <th className="pb-2 text-left font-medium text-[#6b7280]">
                Why
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {[
              [
                "DOM <tr> rows",
                "10–12 regardless of row count",
                "Proves virtual windowing is active",
              ],
              [
                "Mount time",
                "< 100 ms at 1 000 rows",
                "Only visible rows are painted",
              ],
              [
                "Filter avg",
                "< 50 ms",
                "Re-render should only touch the virtual window",
              ],
              [
                "Filter P95",
                "< 80 ms",
                "Tail latency stays under one animation frame",
              ],
              [
                "Heap used",
                "< 50 MB at 10 000 rows",
                "Virtual list does not hold full DOM in memory",
              ],
            ].map(([metric, target, why]) => (
              <tr key={metric}>
                <td className="py-2 font-mono text-[#1d4ed8]">{metric}</td>
                <td className="py-2 font-medium text-[#111827]">{target}</td>
                <td className="py-2 text-[#6b7280]">{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
