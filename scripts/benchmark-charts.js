const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const chromeLauncher = require("chrome-launcher");
const puppeteer = require("@lhci/cli/node_modules/puppeteer-core");

const BASE_URL = process.env.CHART_BENCH_BASE_URL || "http://localhost:3000";
const DATASET_SIZES = [300, 1000, 5000];
const RUNS_PER_SIZE = Number.parseInt(process.env.CHART_BENCH_RUNS || "20", 10);
const OUTPUT_PATH = path.resolve("docs/chart-benchmark-results.json");

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for server: ${url}`);
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  process.kill(-pid, "SIGTERM");
}

async function run() {
  let devProcess = null;
  let startedDevServer = false;
  let chrome = null;
  let browser = null;

  try {
    const alive = await isServerUp(`${BASE_URL}/chart-benchmark`);
    if (!alive) {
      console.log("[bench] Starting Next dev server...");
      devProcess = spawn("cmd", ["/c", "npm", "run", "dev"], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      });
      startedDevServer = true;

      devProcess.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        if (text.includes("Ready") || text.includes("ready")) {
          process.stdout.write(text);
        }
      });
      devProcess.stderr.on("data", (chunk) => process.stderr.write(chunk.toString()));

      await waitForServer(`${BASE_URL}/chart-benchmark`);
    }

    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
      logLevel: "silent",
    });

    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
    const results = [];

    for (const size of DATASET_SIZES) {
      const page = await browser.newPage();
      const url = `${BASE_URL}/chart-benchmark?size=${size}&runs=${RUNS_PER_SIZE}&autostart=1`;
      console.log(`[bench] Running size=${size}, runs=${RUNS_PER_SIZE}`);
      await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
      await page.waitForFunction(() => window.__chartBenchResult !== undefined, {
        timeout: 180000,
      });

      const result = await page.evaluate(() => window.__chartBenchResult);
      results.push(result);
      await page.close();
    }

    const output = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      datasetSizes: DATASET_SIZES,
      runsPerSize: RUNS_PER_SIZE,
      results,
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`[bench] Wrote ${OUTPUT_PATH}`);
    console.table(
      results.map((r) => ({
        size: r.size,
        mountMs: r.mountActualDurationMs,
        updateAvgMs: r.updateAvgDurationMs,
        updateP95Ms: r.updateP95DurationMs,
        totalMs: r.totalBenchmarkMs,
      }))
    );
  } finally {
    if (browser) await browser.disconnect().catch(() => {});
    if (chrome) await chrome.kill().catch(() => {});
    if (startedDevServer && devProcess?.pid) killProcessTree(devProcess.pid);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
