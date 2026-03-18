const path = require("node:path");
const {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  TextRun, WidthType, HeadingLevel, AlignmentType, BorderStyle,
  ShadingType, TableLayoutType,
} = require("docx");
const fs = require("node:fs");

// ── helpers ────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { before: 60, after: 60 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: { before: 40, after: 40 },
  });
}

function code(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Courier New",
        size: 18,
        color: "1F2937",
      }),
    ],
    shading: { type: ShadingType.SOLID, color: "F3F4F6" },
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
  });
}

function gap() {
  return new Paragraph({ text: "", spacing: { before: 80, after: 80 } });
}

function makeTable(headers, rows, colWidths) {
  const headerCells = headers.map((h, i) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF" })],
          alignment: AlignmentType.LEFT,
        }),
      ],
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "1D4ED8" },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    })
  );

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, size: 20 })],
            }),
          ],
          width: { size: colWidths[ci], type: WidthType.PERCENTAGE },
          shading: {
            type: ShadingType.SOLID,
            color: ri % 2 === 0 ? "FFFFFF" : "EFF6FF",
          },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        })
      ),
    })
  );

  return new Table({
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: headerCells }), ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100 },
  });
}

// ── document ───────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        run: { size: 36, bold: true, color: "1E3A5F" },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        run: { size: 28, bold: true, color: "1D4ED8" },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        run: { size: 24, bold: true, color: "374151" },
      },
    ],
  },
  sections: [
    {
      children: [

        // ── Title ──────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: "Caching Strategy — Implementation Report", bold: true, size: 52, color: "1E3A5F" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}`, size: 20, color: "6B7280" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
        }),

        // ── 1. Objective ───────────────────────────────────────────────────
        h1("1. Objective"),
        body("Optimise API cost and UI responsiveness by implementing a production-grade caching strategy for two high-frequency data sources:"),
        bullet("IP Alerts – critical safety data for Amazon sellers."),
        bullet("Keepa Data – high-density time-series data (Price, Sales Rank, Ratings)."),
        gap(),

        // ── 2. Problem Statement ───────────────────────────────────────────
        h1("2. Problem Statement"),
        makeTable(
          ["Issue", "Root Cause", "Impact"],
          [
            ["Aggressive refetching", "productsApi had refetchOnMountOrArgChange: 10 applied globally", "IP Alert endpoint hit every 10 s on each mount — wasteful and risks stale-data suspension"],
            ["No Keepa TTL", "keepaApi endpoints had no keepUnusedDataFor configured", "Cache evicted immediately on unmount; every ASIN re-visit triggered a full network round-trip"],
            ["No key normalisation", "ASIN strings not normalised before use as cache keys", "Minor case / whitespace differences created duplicate cache entries for the same product"],
          ],
          [34, 40, 26]
        ),
        gap(),

        // ── 3. Approach ────────────────────────────────────────────────────
        h1("3. Approach"),
        body("L1 RTK Query cache only. LocalStorage (L2) was explicitly excluded to avoid persistent hard-caching across browser sessions."),
        body("A Stale-While-Revalidate (SWR) model is applied to IP Alerts at the component level, giving a soft TTL (serve cached, no spinner) and a hard TTL (force fresh fetch)."),
        gap(),

        // ── 4. Files Modified ──────────────────────────────────────────────
        h1("4. Files Modified"),
        makeTable(
          ["File", "Change Summary"],
          [
            ["redux/api/productsApi.ts", "Removed global 10 s refetch; added keepUnusedDataFor: 600 to getIpAlert"],
            ["redux/api/keepa.ts", "Added keepUnusedDataFor per endpoint; added serializeQueryArgs for ASIN normalisation"],
            ["components/features/dashboard/ProductDetails.tsx", "Added fetchedAtRef + SWR gate (soft 5 min / hard 10 min) for IP Alert lazy query"],
          ],
          [40, 60]
        ),
        gap(),

        // ── 5. Detailed Changes ────────────────────────────────────────────
        h1("5. Detailed Changes"),

        // 5.1
        h2("5.1  redux/api/productsApi.ts"),
        h3("Removed"),
        body("The following line was deleted from the top-level createApi config:"),
        code("refetchOnMountOrArgChange: 10"),
        body("This setting was causing every endpoint in productsApi — including getIpAlert — to refetch 10 seconds after each component mount, making no use of the RTK cache."),
        gap(),
        h3("Added"),
        body("Endpoint-level override on getIpAlert:"),
        code("keepUnusedDataFor: 600,  // Hard TTL: 10 min"),
        body("RTK Query now retains the IP Alert response in-store for 10 minutes after the last subscriber unmounts. Re-mounting the component within that window returns the cached response with zero network cost."),
        gap(),

        // 5.2
        h2("5.2  redux/api/keepa.ts"),
        h3("Added — normalizePeriod helper"),
        code("const VALID_PERIODS = new Set(['7d', '30d', '90d', '1y', 'all']);"),
        code("function normalizePeriod(p) { return VALID_PERIODS.has(p) ? p : '30d'; }"),
        body("Ensures any non-canonical period string falls back to '30d', preventing duplicate cache slots."),
        gap(),
        h3("Added — keepUnusedDataFor & serializeQueryArgs per endpoint"),
        makeTable(
          ["Endpoint", "keepUnusedDataFor", "Cache Key Pattern"],
          [
            ["productSummary", "1200 s (20 min)", "keepa_summary:{id}:{ASIN}"],
            ["priceHistory",   "1800 s (30 min)", "keepa_price_history:{id}:{ASIN}:{period}"],
            ["salesRank",      "1800 s (30 min)", "keepa_sales_rank:{id}:{ASIN}:{period}"],
            ["ratingReview",   "1800 s (30 min)", "keepa_rating:{id}:{ASIN}:{period}"],
          ],
          [25, 25, 50]
        ),
        gap(),
        body("ASIN is normalised to uppercase/trimmed in every key. Period is validated against the canonical set. This guarantees that navigating back to the same ASIN within the TTL window produces a cache hit regardless of how the caller formatted the arguments."),
        gap(),

        // 5.3
        h2("5.3  components/features/dashboard/ProductDetails.tsx"),
        h3("Added — fetchedAtRef"),
        code("const fetchedAtRef = useRef<Map<string, number>>(new Map());"),
        body("A Map ref keyed by `${asin}:${marketplaceId}` recording the timestamp of the last successful IP Alert fetch. Stored in a ref (not state) so updates never trigger re-renders."),
        gap(),
        h3("Added — SWR gate inside fetchIpData"),
        body("At the top of the fetchIpData async function, before any network call:"),
        code("const ageMs = lastFetch ? Date.now() - lastFetch : Infinity;"),
        gap(),
        makeTable(
          ["Age of Last Fetch", "Behaviour"],
          [
            ["< 5 min (soft TTL)",  "Return immediately — data is fresh, skip fetch entirely"],
            ["5 – 10 min",          "Fire background revalidation silently; no loading spinner; UI keeps showing existing ipData"],
            ["> 10 min / first load", "Normal fetch with loading state; fetchedAtRef updated on success"],
          ],
          [30, 70]
        ),
        gap(),
        body("The ref resets naturally on page refresh (memory-only), ensuring a full reload always fetches fresh data — no stale-data risk across sessions."),
        gap(),

        // ── 6. TTL Reference ───────────────────────────────────────────────
        h1("6. TTL Reference"),
        makeTable(
          ["Data", "RTK keepUnusedDataFor (L1)", "SWR Soft TTL (component)", "SWR Hard TTL (component)"],
          [
            ["IP Alert",                    "600 s  (10 min)",  "300 s (5 min)",   "600 s (10 min)"],
            ["Keepa — Summary",             "1200 s (20 min)", "—",               "—"],
            ["Keepa — Price / Sales / Ratings", "1800 s (30 min)", "—",           "—"],
          ],
          [28, 24, 24, 24]
        ),
        gap(),

        // ── 7. Verification ────────────────────────────────────────────────
        h1("7. Verification Checklist"),
        makeTable(
          ["Test", "Expected Result"],
          [
            ["Open a product page, navigate away, return within 5 min",
             "No ip-alert request in DevTools Network tab"],
            ["Return to same product at ~7 min",
             "One background ip-alert request fires; no loading spinner shown"],
            ["Return to same product after 11+ min",
             "Full fetch with loading state; new ip-alert request visible"],
            ["Visit an ASIN Keepa chart, navigate away, return within 30 min",
             "No Keepa network requests — all served from RTK L1 cache"],
            ["Visit same ASIN Keepa chart with ASIN in different casing (if applicable)",
             "Still a cache hit — serializeQueryArgs normalises to uppercase"],
            ["Hard page refresh",
             "All RTK cache cleared; fresh fetch on all endpoints as expected"],
            ["TypeScript check (tsc --noEmit)",
             "Zero errors ✓"],
            ["Production build (npm run build)",
             "Successful — all routes compiled ✓"],
          ],
          [45, 55]
        ),
        gap(),

        // ── 8. Build Results ───────────────────────────────────────────────
        h1("8. Build Results"),
        body("Both the TypeScript compiler check and the Next.js production build passed with zero errors after the changes were applied."),
        gap(),
        makeTable(
          ["Check", "Result"],
          [
            ["tsc --noEmit", "✓  Passed — 0 errors"],
            ["npm run build", "✓  Passed — all routes compiled successfully"],
          ],
          [50, 50]
        ),

        gap(),
        new Paragraph({
          children: [new TextRun({ text: "— End of Report —", size: 20, color: "9CA3AF", italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 480 },
        }),
      ],
    },
  ],
});

// ── write file ─────────────────────────────────────────────────────────────

const outDir = path.resolve(__dirname, "../docs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "caching-strategy-report.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Report written to: ${outPath}`);
});
