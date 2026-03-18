const path = require("node:path");
const { spawnSync } = require("node:child_process");

const lhciCliPath = path.resolve(__dirname, "../node_modules/@lhci/cli/src/cli.js");

function runLhci(args, envOverrides = {}) {
  const result = spawnSync(process.execPath, [lhciCliPath, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...envOverrides },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runPreset(preset) {
  const outputDir = `./lighthouse/reports/${preset}`;
  const env = { LHCI_FORM_FACTOR: preset };

  console.log(`\n[lhci] Collecting ${preset} report...`);
  runLhci(["collect"], env);

  console.log(`[lhci] Uploading ${preset} report to ${outputDir}...`);
  runLhci(["upload", "--target=filesystem", `--outputDir=${outputDir}`], env);
}

function getTargets(mode) {
  if (mode === "mobile") return ["mobile"];
  if (mode === "desktop") return ["desktop"];
  return ["mobile", "desktop"];
}

function main() {
  const mode = (process.argv[2] || "all").toLowerCase();
  const validModes = new Set(["all", "mobile", "desktop"]);

  if (!validModes.has(mode)) {
    console.error("Invalid mode. Use: all, mobile, or desktop.");
    process.exit(1);
  }

  const targets = getTargets(mode);
  targets.forEach((preset) => runPreset(preset));

  console.log("\n[lhci] Completed baseline run.");
}

main();
