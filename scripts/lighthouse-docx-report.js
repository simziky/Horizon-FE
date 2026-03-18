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
} = require("docx");

const outputPath = path.resolve("lighthouse/reports/lighthouse-summary.docx");
const mobileManifestPath = path.resolve("lighthouse/reports/mobile/manifest.json");
const desktopManifestPath = path.resolve("lighthouse/reports/desktop/manifest.json");
const legacyManifestPath = path.resolve("lighthouse/reports/manifest.json");

function toPercent(score) {
  if (typeof score !== "number") return "N/A";
  return `${Math.round(score * 100)}%`;
}

function makeCell(value, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(value), bold })],
      }),
    ],
  });
}

async function main() {
  const mobilePath = fs.existsSync(mobileManifestPath) ? mobileManifestPath : legacyManifestPath;
  if (!fs.existsSync(mobilePath)) {
    throw new Error(`Mobile manifest not found: ${mobileManifestPath}`);
  }
  if (!fs.existsSync(desktopManifestPath)) {
    throw new Error(
      `Desktop manifest not found: ${desktopManifestPath}. Run desktop lighthouse baseline first.`
    );
  }

  const mobileManifest = JSON.parse(fs.readFileSync(mobilePath, "utf8"));
  const desktopManifest = JSON.parse(fs.readFileSync(desktopManifestPath, "utf8"));
  if (!Array.isArray(mobileManifest) || mobileManifest.length === 0) {
    throw new Error("Mobile manifest is empty or invalid.");
  }
  if (!Array.isArray(desktopManifest) || desktopManifest.length === 0) {
    throw new Error("Desktop manifest is empty or invalid.");
  }

  function buildTableRows(manifest) {
    const header = new TableRow({
      children: [
        makeCell("Page URL", true),
        makeCell("Performance", true),
        makeCell("Accessibility", true),
        makeCell("Best Practices", true),
        makeCell("SEO", true),
      ],
    });

    const rows = manifest.map((entry) => {
      const summary = entry.summary || {};
      return new TableRow({
        children: [
          makeCell(entry.url || "N/A"),
          makeCell(toPercent(summary.performance)),
          makeCell(toPercent(summary.accessibility)),
          makeCell(toPercent(summary["best-practices"])),
          makeCell(toPercent(summary.seo)),
        ],
      });
    });

    return [header, ...rows];
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Lighthouse Summary", bold: true, size: 32 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toISOString()}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Mobile Metrics", bold: true, size: 26 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: buildTableRows(mobileManifest),
          }),
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Desktop Metrics", bold: true, size: 26 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: buildTableRows(desktopManifest),
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  try {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Wrote ${outputPath}`);
  } catch (error) {
    if (error && error.code === "EBUSY") {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fallbackPath = path.resolve(`lighthouse/reports/lighthouse-summary-${stamp}.docx`);
      fs.writeFileSync(fallbackPath, buffer);
      console.log(`Primary output is locked. Wrote ${fallbackPath}`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
