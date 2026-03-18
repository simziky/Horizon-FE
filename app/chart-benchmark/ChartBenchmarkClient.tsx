"use client";

import {
  Profiler,
  type ProfilerOnRenderCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "next/navigation";

type BenchResult = {
  library: "recharts";
  chartType: "LineChart";
  size: number;
  runs: number;
  mountActualDurationMs: number;
  updateAvgDurationMs: number;
  updateP95DurationMs: number;
  updateMaxDurationMs: number;
  totalBenchmarkMs: number;
  committedUpdates: number;
  timestamp: string;
  heapUsedMB?: number;
};

type BenchWindow = Window & {
  __chartBenchResult?: BenchResult;
};

type Point = {
  label: string;
  amazon: number;
  buybox: number;
  salesRank: number;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function makeData(size: number, seed: number): Point[] {
  let state = (seed || 1) >>> 0;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  return Array.from({ length: size }, (_, i) => {
    const x = i / Math.max(1, size - 1);
    const trend = 20 + x * 80;
    const amazonNoise = rand() * 8 - 4;
    const buyboxNoise = rand() * 6 - 3;
    const rankNoise = rand() * 50 - 25;

    return {
      label: `P${i + 1}`,
      amazon: trend + Math.sin(i / 12) * 18 + amazonNoise,
      buybox: trend + Math.cos(i / 14) * 12 + buyboxNoise,
      salesRank: 3000 - x * 2400 + Math.sin(i / 20) * 320 + rankNoise,
    };
  });
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export default function ChartBenchmarkClient() {
  const searchParams = useSearchParams();
  const size = useMemo(() => parsePositiveInt(searchParams.get("size"), 300), [searchParams]);
  const runs = useMemo(() => parsePositiveInt(searchParams.get("runs"), 20), [searchParams]);
  const autostart = useMemo(() => searchParams.get("autostart") === "1", [searchParams]);

  const [data, setData] = useState<Point[]>(() => makeData(size, 1));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BenchResult | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const mountDurations = useRef<number[]>([]);
  const updateDurations = useRef<number[]>([]);
  const pendingResolve = useRef<((committed: boolean) => void) | null>(null);

  useEffect(() => {
    setData(makeData(size, 1));
    setResult(null);
    mountDurations.current = [];
    updateDurations.current = [];
  }, [size]);

  useEffect(() => {
    if (autostart) {
      void runBenchmark();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart, size, runs]);

  const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
    if (phase === "mount") {
      mountDurations.current.push(actualDuration);
      return;
    }

    updateDurations.current.push(actualDuration);
    if (pendingResolve.current) {
      const resolve = pendingResolve.current;
      pendingResolve.current = null;
      resolve(true);
    }
  };

  const waitForCommit = (timeoutMs = 5000) =>
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  async function runBenchmark() {
    if (running) return;
    setRunning(true);
    setResult(null);

    mountDurations.current = [];
    updateDurations.current = [];
    const mountStart = performance.now();
    setChartKey((prev) => prev + 1);
    setData(makeData(size, 1));
    await waitForPaint();
    const mountMeasured = performance.now() - mountStart;
    await new Promise((resolve) => setTimeout(resolve, 30));
    const started = performance.now();
    let committedUpdates = 0;

    for (let i = 0; i < runs; i += 1) {
      setData(makeData(size, i + 2));
      const committed = await waitForCommit();
      if (!committed) break;
      committedUpdates += 1;
    }

    const finished = performance.now();
    const mount = mountMeasured;
    const updateAvg =
      updateDurations.current.reduce((sum, value) => sum + value, 0) /
      Math.max(1, updateDurations.current.length);
    const updateP95 = percentile(updateDurations.current, 95);
    const updateMax = updateDurations.current.length ? Math.max(...updateDurations.current) : 0;

    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const nextResult: BenchResult = {
      library: "recharts",
      chartType: "LineChart",
      size,
      runs,
      mountActualDurationMs: Number(mount.toFixed(2)),
      updateAvgDurationMs: Number(updateAvg.toFixed(2)),
      updateP95DurationMs: Number(updateP95.toFixed(2)),
      updateMaxDurationMs: Number(updateMax.toFixed(2)),
      totalBenchmarkMs: Number((finished - started).toFixed(2)),
      committedUpdates,
      timestamp: new Date().toISOString(),
      heapUsedMB: memory ? Number((memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : undefined,
    };

    (window as BenchWindow).__chartBenchResult = nextResult;
    setResult(nextResult);
    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] p-6">
      <section className="mx-auto max-w-6xl rounded-xl border border-[#e6ecea] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#111827]">Recharts Benchmark</h1>
        <p className="mt-1 text-sm text-[#4b5563]">
          Size: {size} points | Update runs: {runs}
        </p>
        <button
          type="button"
          onClick={() => void runBenchmark()}
          disabled={running}
          className="mt-4 rounded-md bg-[#18CB96] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? "Running..." : "Run Benchmark"}
        </button>

        <div className="mt-6 h-[420px] w-full rounded-lg border border-[#e7ece9] p-2">
          <Profiler id="recharts-bench" onRender={onRender}>
            <ResponsiveContainer width="100%" height="100%" key={chartKey}>
              <LineChart data={data} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={Math.max(1, Math.floor(size / 10))}
                />
                <YAxis yAxisId="price" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="rank" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="amazon"
                  stroke="#18CB96"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="buybox"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="salesRank"
                  stroke="#6B7280"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Profiler>
        </div>

        <pre className="mt-5 overflow-auto rounded-lg bg-[#0b1020] p-4 text-xs text-[#e5e7eb]">
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </main>
  );
}
