const baseUrl = process.env.LHCI_BASE_URL || "http://localhost:3000";
const loginUrl = process.env.LHCI_LOGIN_URL || `${baseUrl}/`;
const email = process.env.LHCI_EMAIL;
const password = process.env.LHCI_PASSWORD;

const protectedPrefixes = [
  "/dashboard",
  "/settings",
  "/subscriptions",
  "/referral",
  "/history",
  "/seller",
  "/go-compare",
];

function needsAuth(targetUrl) {
  try {
    const url = new URL(targetUrl, baseUrl);
    return protectedPrefixes.some((prefix) => url.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

module.exports = async (browser, context = {}) => {
  const targetUrl = context.url || baseUrl;
  if (!needsAuth(targetUrl)) return;
  if (!email || !password) {
    throw new Error("Missing LHCI_EMAIL or LHCI_PASSWORD in environment.");
  }

  const page = await browser.newPage();
  await page.goto(loginUrl, { waitUntil: "networkidle2" });

  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.waitForSelector('input[name="password"]', { timeout: 30000 });

  await page.evaluate(() => {
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
  });

  await page.type('input[name="email"]', email, { delay: 30 });
  await page.type('input[name="password"]', password, { delay: 30 });

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]).catch(() => {});

  try {
    await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 60000 });
  } catch {
    // Some routes may redirect to signup checkpoints; allow Lighthouse to proceed.
  }

  await page.close();
};
