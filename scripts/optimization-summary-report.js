const fs = require("node:fs");
const path = require("node:path");
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  TableLayoutType,
} = require("docx");

const outputPath = path.resolve("docs/optimization-summary.docx");

// ─── helpers ────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, color: "18CB96" })],
    spacing: { before: 320, after: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, color: "1A1A1A" })],
    spacing: { before: 280, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, color: "374151" })],
    spacing: { before: 200, after: 80 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22, bold })],
    spacing: { after: 80 },
  });
}

function gap() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E5E7EB" } },
    spacing: { before: 200, after: 200 },
    children: [],
  });
}

function makeCell(text, bold = false, shade = false) {
  return new TableCell({
    shading: shade ? { fill: "F3FAF7", type: ShadingType.SOLID } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), bold, size: 20 })],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function headerCell(text) {
  return new TableCell({
    shading: { fill: "18CB96", type: ShadingType.SOLID },
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), bold: true, size: 20, color: "FFFFFF" })],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function table(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell) => makeCell(cell, false, ri % 2 === 0)),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

// ─── document content ────────────────────────────────────────────────────────

async function main() {
  const children = [
    // Title block
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Horizon FE", bold: true, size: 52, color: "18CB96" }),
      ],
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Performance & Resilience Optimisation Summary", bold: true, size: 36 }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "February – March 2026  |  Branch: update/optimization", size: 22, color: "6B7280" }),
      ],
      spacing: { after: 320 },
    }),

    divider(),

    // Overview
    h1("Overview"),
    body(
      "This document summarises all performance and resilience work completed across the update/optimization branch. " +
      "The effort spanned two phases: an initial research phase that produced technical specifications and evaluation reports, " +
      "followed by a full implementation phase covering virtual scrolling, API caching, chart performance, code splitting, " +
      "loading UX, error pages, and offline support."
    ),

    divider(),

    // Phase 1
    h1("Phase 1 — Research & Specifications (Week 1)"),
    body(
      "Before writing any production code, a structured research phase was completed to de-risk technical decisions " +
      "and establish a measurable baseline."
    ),

    h2("Deliverables Produced"),
    table(
      ["Document", "Purpose"],
      [
        ["docs/virtual-scrolling-technical-spec.md", "Component-by-component virtualisation migration plan (react-window)"],
        ["docs/caching-strategy-technical-spec.md", "RTK Query TTL matrix, cache key structure, invalidation rules"],
        ["docs/chart-library-evaluation.md", "Recharts vs Chart.js benchmark results and keep/migrate decision"],
        ["docs/folder-structure-refactor.md", "Component reorganisation plan and rationale"],
        ["docs/week1-performance-plan.md", "Full workstream plan with acceptance criteria"],
      ]
    ),
    gap(),

    h2("Key Decisions Made"),
    bullet("Virtualisation library: react-window with VariableSizeList for seller cards; table-body virtualisation for UPC scanner tables"),
    bullet("Caching: Keep existing RTK Query — no additional library needed (React Query / SWR)"),
    bullet("Charts: Keep recharts for most routes; adopt canvas-based rendering only for Keepa and Seller heavy chart paths where benchmark showed clear gain"),
    bullet("Bundle splitting: Dynamic imports for heavy chart and drawer components"),

    divider(),

    // Phase 2
    h1("Phase 2 — Implementation"),

    // 1. Codebase restructure
    h2("1. Codebase Restructure"),
    body(
      "Moved all feature components out of co-located _components/ directories inside page routes into a top-level " +
      "components/ tree with clear feature and UI separation."
    ),
    h3("New structure"),
    bullet("components/features/ — Dashboard, Go Compare, Keepa, Seller, Settings, History, Monitor, Referral, Subscriptions, Totan, UPC Scanner"),
    bullet("components/layout/ — DashNav, DashSider, LogoutModal"),
    bullet("components/modals/ — RenewSubModal, AmazonConnectModal, PackageRestrictionModal, ExpiredSubscriptionModal"),
    bullet("components/ui/ — Button, Table, Heading, SearchInput, CountrySelect, Pagination, and more"),
    bullet("constants/ — countries.ts (moved from lib/)"),
    h3("Why"),
    body(
      "Co-located _components/ directories prevented cross-route component reuse, made imports verbose and inconsistent, " +
      "and obscured which components were shared vs page-specific."
    ),
    h3("Impact"),
    body("All imports updated. Zero regressions. Codebase is now navigable by concern rather than by route."),
    gap(),

    // 2. Virtual scrolling
    h2("2. Virtual Scrolling"),
    body("Implemented react-window VariableSizeList virtualisation for the two heaviest list renderers."),
    h3("Files"),
    bullet("components/features/seller/Seller.tsx — Seller product cards (variable height rows)"),
    bullet("components/features/upc-scanner/scan-results-table.tsx — UPC scan results (fixed height rows, sticky header)"),
    bullet("components/features/upc-scanner/scan-details-table.tsx — UPC scan details"),
    h3("Problem solved"),
    body(
      "At 1k–10k rows, the browser rendered all DOM nodes upfront causing page jank and 2–4 s delays before the list " +
      "became interactive. With virtualisation only the ~15–20 visible rows are in the DOM at any time."
    ),
    h3("Impact"),
    body(
      "O(n) render cost eliminated; scroll is native-speed regardless of dataset size. Validated with React DevTools Profiler — " +
      "render time constant across 100 / 1k / 10k row datasets."
    ),
    gap(),

    // 3. RTK Query caching
    h2("3. RTK Query Caching"),
    body(
      "Applied explicit TTL (keepUnusedDataFor) and stale-while-revalidate (refetchOnMountOrArgChange) policies to all RTK Query endpoints."
    ),
    h3("TTL matrix"),
    table(
      ["Endpoint group", "keepUnusedDataFor", "refetchOnMountOrArgChange"],
      [
        ["IP alerts", "300 s", "false"],
        ["Keepa summaries", "900 s", "600 s"],
        ["Keepa price history", "1800 s", "900 s"],
        ["Keepa sales rank", "1800 s", "900 s"],
        ["Product search", "120 s", "false"],
        ["Go Compare quick-search", "300 s", "false"],
        ["Seller products", "300 s", "300 s"],
        ["Monitor list", "60 s", "60 s"],
      ]
    ),
    gap(),
    body("Added: refetchOnReconnect: true globally so stale data auto-refreshes when the user comes back online."),
    h3("Why"),
    body(
      "Without explicit TTL, RTK Query defaults to 60 s for all endpoints. High-cost endpoints (Keepa, IP alerts) were being " +
      "re-fetched on every component mount within the same session."
    ),
    h3("Impact"),
    body(
      "In-session re-navigation to previously loaded product pages is now instant (cache hit). Keepa chart switching between " +
      "time ranges within a session no longer re-fetches."
    ),
    gap(),

    // 4. Chart performance
    h2("4. Chart Performance"),
    body("Replaced recharts SVG rendering with canvas-based chart libraries on the two heaviest chart paths."),
    h3("Components"),
    bullet("components/features/keepa/KeepaLineChart.tsx — new canvas implementation (replaces recharts LineChart in KeepaChart)"),
    bullet("components/features/seller/LazyKeepaChart.tsx — lazy-loaded canvas chart with IntersectionObserver"),
    h3("Decision basis — benchmark at 5k datapoints"),
    table(
      ["Library", "Scripting time", "FPS on interaction"],
      [
        ["Recharts (SVG)", "~1,800 ms", "~12 FPS"],
        ["Canvas (new)", "~180 ms", "~55 FPS"],
      ]
    ),
    gap(),
    body(
      "LazyKeepaChart: Seller page renders multiple product cards each with a Keepa chart. IntersectionObserver defers chart " +
      "initialisation until the card enters the viewport, preventing all N charts from rendering at mount."
    ),
    h3("Impact"),
    body("Keepa chart page interaction is smooth at full dataset sizes. Seller page initial render is not blocked by off-screen chart computations."),
    gap(),

    // 5. Code splitting
    h2("5. Code Splitting & Bundle Reduction"),
    body("Applied dynamic() imports (Next.js) to heavy components that are not needed on initial page load."),
    h3("Key splits"),
    table(
      ["Component", "Before", "After"],
      [
        ["AlertsDrawer (dashboard)", "Bundled in dashboard chunk", "dynamic() — loaded on first open"],
        ["KeepaChart (keepa route)", "Bundled eagerly", "dynamic({ loading: <Skeleton> })"],
        ["KeepaChart (seller route)", "Bundled eagerly", "LazyKeepaChart — deferred until in-viewport"],
        ["Product detail tabs", "All tab content in one chunk", "Split per tab with dynamic imports"],
      ]
    ),
    gap(),
    h3("Impact"),
    body(
      "Dashboard TBT dropped from 2,560 ms → 1,640 ms (−36%) on production build. Public page Speed Index improved dramatically: " +
      "/ went from 13.3 s → 1.6 s, /signUp from 6.9 s → 1.5 s."
    ),
    gap(),

    // 6. Skeletons
    h2("6. Loading UX — Skeleton Screens"),
    body("Replaced spinner/blank states with content-shaped skeleton placeholders across all major data views."),
    h3("Skeletons implemented"),
    table(
      ["Component", "Skeleton layout"],
      [
        ["Dashboard search results", "64px image + 3 text lines per row"],
        ["Go Compare product card", "Image block + title + 2 stat lines"],
        ["Go Compare search table", "Header row + 8 table rows with cell-width shimmer"],
        ["Keepa chart", "Chart area block + legend strip"],
        ["Seller product list", "Card with image + text lines"],
        ["Monitor list", "Table rows with shimmer"],
        ["History", "Table rows with shimmer"],
        ["Product details quick-info", "Stat boxes with shimmer"],
        ["Totan AI", "Message thread placeholders"],
      ]
    ),
    gap(),
    h3("Impact"),
    body(
      "Measurable CLS improvement on pages with skeletons. Accessibility improved on checkout (86 → 95) " +
      "and product details (83 → 85)."
    ),
    gap(),

    // 7. Auth cleanup
    h2("7. Auth Route Cleanup"),
    body(
      "Removed the app/(auth1)/ route group entirely — it was a legacy duplicate of app/(auth)/ with stale copies " +
      "of Login, Steps, Signup, and Layout components."
    ),
    h3("Impact"),
    body("6 files deleted. No regressions. Confirmed by grep — zero references to auth1 remain anywhere in the codebase."),
    gap(),

    // 8. Error pages
    h2("8. Error Pages & Resilience"),
    body("Replaced Next.js default error screens with branded, navigable error pages."),
    h3("Files"),
    table(
      ["File", "Type", "Purpose"],
      [
        ["app/not-found.tsx", "Server component", "Custom 404 — shown for missing routes and resources"],
        ["app/error.tsx", "Client component", "Route-level error boundary — runtime JS errors and failed fetches"],
        ["app/global-error.tsx", "Client component", "Root-level error boundary — wraps root layout failures"],
      ]
    ),
    gap(),
    h3("404 page features"),
    bullet("Branded — Optisage logo, #18CB96 accent"),
    bullet("Friendly headline + short copy"),
    bullet("Navigation shortcuts: Dashboard, Go Compare, Home"),
    h3("Error page features"),
    bullet("User-facing message — no raw stack traces in production"),
    bullet("Retry button using the Next.js reset prop (clears error boundary, re-renders)"),
    bullet("Link back to Dashboard / Home"),
    bullet("Sentry integration via useEffect to log errors to monitoring"),
    h3("Why"),
    body(
      "The default Next.js error pages are unbranded, provide no recovery path, and break the user experience for " +
      "common production edge cases (wrong ASIN, expired token, 500 from a slow API)."
    ),
    gap(),

    // 9. Preferences
    h2("9. User Preference Persistence (Marketplace Selection)"),
    body("Marketplace selection (country/currency) now persists across page reloads via localStorage."),
    h3("Files modified"),
    bullet("redux/slice/globalSlice.ts — getStoredMarketplace() reads from localStorage on boot (with SSR guard)"),
    bullet("components/ui/CountrySelect.tsx — writes selection to localStorage on every change"),
    h3("Default handling"),
    body(
      "Initial state falls back to Canada (marketplaceId: 6, currencyCode: CAD, currencySymbol: C$) when no preference is stored. " +
      "Once the user selects a country, that selection is persisted and restored on next visit."
    ),
    h3("Why"),
    body(
      "Users had to re-select their marketplace on every page reload, which was especially disruptive for " +
      "multi-marketplace power users."
    ),
    gap(),

    // 10. Offline banner
    h2("10. Offline Detection Banner"),
    body("An amber banner appears at the top of all dashboard pages when the browser loses network connectivity, " +
      "and disappears automatically when the connection is restored."),
    h3("File"),
    bullet("app/(dashboard)/layout.tsx"),
    h3("Implementation"),
    bullet("useState(true) for isOnline"),
    bullet("useEffect registers window online / offline event listeners"),
    bullet("Banner injected below <DashNav /> — zero layout shift when it appears"),
    bullet("refetchOnReconnect: true on RTK Query store — stale data auto-refreshes when the banner disappears"),
    h3("Why"),
    body(
      "Dashboard pages display live pricing and Buy Box data. Without an offline indicator, users may make sourcing " +
      "decisions based on stale data without realising the connection dropped."
    ),

    divider(),

    // Items not implemented
    h1("Items Assessed — Deliberately Not Implemented"),
    body("The following items from the original backlog were evaluated and skipped for documented reasons."),
    gap(),
    table(
      ["Item", "Reason Not Implemented"],
      [
        [
          "ProductDetails progressive loading",
          "FinalLoader is a conscious UX pattern — partial product data would create inconsistent UI with missing Buy Box and eligibility. API speed is the real bottleneck.",
        ],
        [
          "UPC Scanner progress indicator",
          "products_found represents matched products, not processed count. No reliable progress fraction available from the API.",
        ],
        [
          "Reverse-search server-side filtering",
          "ReverseSearchTable exists but is not rendered anywhere. Reverse search results are emailed to users, not shown in-app.",
        ],
        [
          "Fuse.js fuzzy search for UPC scanner",
          "UPC scanner search filters the user's own scan list (5–30 items). includes() is instant at that scale; a fuzzy library adds bundle weight for no benefit.",
        ],
        [
          "Cache recent product data locally",
          "RTK Query in-session cache already handles same-session re-navigation. Product data changes hourly — persisting stale prices would mislead sourcing decisions.",
        ],
        [
          "Redux store rename / restructure",
          "No user-facing impact. Internals are clear with existing naming. Deferred to keep the diff focused on performance.",
        ],
        [
          "ProductDetails sub-panel skeletons",
          "Tab panels only render after the parent FinalLoader resolves. Sub-panel skeletons would flash briefly then be replaced immediately, creating visual noise.",
        ],
        [
          "UPC Scanner lazy-load from redux",
          "Scan results are already paginated by the API. Lazy-loading within the local slice adds complexity without addressing the API round-trip bottleneck.",
        ],
      ]
    ),
    gap(),

    divider(),

    // Lighthouse results
    h1("Lighthouse Before / After"),
    body("Full report: docs/lighthouse-before-after.docx (or .md). Summary below."),
    gap(),
    table(
      ["Route group", "Performance Δ", "Key metric"],
      [
        ["/ (home)", "+8 pts", "Speed Index 13.3 s → 1.6 s"],
        ["/signUp", "+9 pts", "Speed Index 6.9 s → 1.5 s"],
        ["/renewSubscription", "+10 pts", "TBT −170 ms"],
        ["/checkout", "+8 pts", "Best Practices 74 → 100"],
        ["/pricing", "+3 pts", "TBT −50 ms"],
        ["/packages", "+4 pts", "TBT −150 ms"],
        ["/dashboard", "0 pts (API-gated)", "TBT −920 ms (−36%)"],
        ["Dashboard routes (avg)", "0 pts (API-gated)", "TBT improvements visible per route"],
      ]
    ),
    gap(),

    h2("Why Dashboard Performance Scores Did Not Move"),
    body(
      "The Lighthouse performance score for authenticated pages is dominated by LCP. On dashboard routes, LCP is the " +
      "product content which only renders after 3 parallel API calls resolve (getItem + getBuyboxDetails + getIpAlert). " +
      "These API round-trips take 30–55 seconds in the test environment, completely masking frontend optimisation. " +
      "The score will improve only if backend API response times improve."
    ),

    h2("What Lighthouse Doesn't Capture"),
    body("Our optimisations primarily benefit runtime performance, which Lighthouse does not measure:"),
    bullet("Virtual scrolling — only active when user scrolls past the visible window"),
    bullet("LazyKeepaChart IntersectionObserver — only active when seller cards enter viewport"),
    bullet("RTK Query cache hits — only relevant on re-navigation within a session"),
    bullet("Skeleton screens — perceived performance improvement, not a Lighthouse metric"),
    bullet("Marketplace preference persistence — session quality improvement"),
    bullet("Offline banner — resilience improvement"),
    body(
      "These improvements are best validated with React DevTools Profiler and Chrome Performance tab recordings of " +
      "real authenticated user sessions."
    ),

    divider(),

    // Definition of done
    h1("Definition of Done — Final Status"),
    table(
      ["Criterion", "Status"],
      [
        ["Baseline metrics recorded", "✅  docs/lighthouse-before-after — Feb 2026 baseline"],
        ["Virtual scrolling implemented", "✅  Seller + UPC Scanner"],
        ["RTK Query caching tuned", "✅  All endpoints have explicit TTL"],
        ["Chart performance improved", "✅  Canvas charts for Keepa + Seller; lazy load for seller cards"],
        ["Bundle splitting applied", "✅  Dynamic imports for all heavy components"],
        ["Loading UX — skeletons", "✅  9 components"],
        ["Error pages implemented", "✅  404, error boundary, global error"],
        ["Offline resilience", "✅  Banner + auto-refetch on reconnect"],
        ["User preference persistence", "✅  Marketplace selection persists via localStorage"],
        ["Lighthouse after-run completed", "✅  March 15 2026 production build audit"],
        ["Optimization tracker up to date", "✅  docs/horizon-fe-optimization-tracker.xlsx"],
      ]
    ),
    gap(),
  ];

  const doc = new Document({
    sections: [{ children }],
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 22 },
        },
      ],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  try {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Wrote ${outputPath}`);
  } catch (err) {
    if (err && err.code === "EBUSY") {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fallback = path.resolve(`docs/optimization-summary-${stamp}.docx`);
      fs.writeFileSync(fallback, buffer);
      console.log(`File busy — wrote ${fallback}`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
