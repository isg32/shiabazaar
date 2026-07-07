import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];

function pass(name) { results.push({ name, ok: true });  console.log(`  ✓ ${name}`); }
function fail(name, err) { results.push({ name, ok: false, err: String(err) }); console.error(`  ✗ ${name}: ${err}`); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  // ── 1. Homepage ──────────────────────────────────────────────────────────
  console.log("\n[1] Homepage");
  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    await page.waitForSelector("text=SHIA BAZAAR", { timeout: 8000 });
    pass("loads with 200");
  } catch(e) { fail("loads with 200", e); }

  try {
    await page.waitForSelector("text=Browse by Category", { timeout: 5000 });
    pass("category grid visible");
  } catch(e) { fail("category grid visible", e); }

  try {
    // Featured products section exists (may be empty if no featured set)
    await page.waitForSelector("text=Featured Products", { timeout: 5000 });
    pass("featured products section visible");
  } catch(e) { fail("featured products section visible", e); }

  // ── 2. Products listing ──────────────────────────────────────────────────
  console.log("\n[2] Products page");
  try {
    const res = await page.goto(`${BASE}/products`, { waitUntil: "domcontentloaded", timeout: 10000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    pass("loads with 200");
  } catch(e) { fail("loads with 200", e); }

  try {
    await page.waitForSelector("[data-testid='product-card'], a[href^='/products/'], .product-card, article", { timeout: 8000 });
    pass("product cards rendered");
  } catch(e) {
    // fallback: check for any link to a product
    try {
      const links = await page.$$("a[href^='/products/']");
      if (links.length === 0) throw "no product links";
      pass(`product cards rendered (${links.length} links)`);
    } catch(e2) { fail("product cards rendered", e2); }
  }

  // ── 3. Product detail ────────────────────────────────────────────────────
  console.log("\n[3] Product detail");
  let productUrl = null;
  try {
    const link = await page.$("a[href^='/products/']");
    if (!link) throw "no product link found on listing page";
    productUrl = await link.getAttribute("href");
    const res  = await page.goto(`${BASE}${productUrl}`, { waitUntil: "domcontentloaded", timeout: 10000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    pass(`loads ${productUrl}`);
  } catch(e) { fail("product detail page loads", e); }

  try {
    const addBtn = await page.$("button:has-text('Add to Cart'), button:has-text('Add to Bag')");
    if (!addBtn) throw "Add to Cart button not found";
    pass("Add to Cart button present");
  } catch(e) { fail("Add to Cart button present", e); }

  // ── 4. Cart ──────────────────────────────────────────────────────────────
  console.log("\n[4] Cart");
  try {
    const res = await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded", timeout: 10000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    pass("loads with 200");
  } catch(e) { fail("loads with 200", e); }

  // ── 5. Search ────────────────────────────────────────────────────────────
  console.log("\n[5] Search");
  try {
    const res = await page.goto(`${BASE}/search?q=book`, { waitUntil: "domcontentloaded", timeout: 10000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    await page.waitForSelector("text=result", { timeout: 6000 });
    pass("search returns results count");
  } catch(e) { fail("search results", e); }

  // ── 6. Auth pages ────────────────────────────────────────────────────────
  console.log("\n[6] Auth pages");
  for (const path of ["/auth/sign-in", "/auth/sign-up"]) {
    try {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 10000 });
      if (res.status() !== 200) throw `HTTP ${res.status()}`;
      pass(`${path} loads`);
    } catch(e) { fail(`${path} loads`, e); }
  }

  // ── 7. Category pages ────────────────────────────────────────────────────
  console.log("\n[7] Category pages");
  for (const slug of ["books", "gifts"]) {
    try {
      const res = await page.goto(`${BASE}/category/${slug}`, { waitUntil: "domcontentloaded", timeout: 10000 });
      if (res.status() !== 200) throw `HTTP ${res.status()}`;
      pass(`/category/${slug} loads`);
    } catch(e) { fail(`/category/${slug} loads`, e); }
  }

  // ── 8. Account redirect (should redirect to sign-in) ─────────────────────
  console.log("\n[8] Auth-protected routes");
  try {
    await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const url = page.url();
    if (!url.includes("sign-in") && !url.includes("login")) throw `Expected redirect to sign-in, got: ${url}`;
    pass("unauthenticated /account redirects to sign-in");
  } catch(e) { fail("unauthenticated /account redirects", e); }

  // ── 9. Admin redirect (should redirect to sign-in) ───────────────────────
  console.log("\n[9] Admin protection");
  try {
    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded", timeout: 10000 });
    const url = page.url();
    if (!url.includes("sign-in") && !url.includes("login")) throw `Expected redirect to sign-in, got: ${url}`;
    pass("unauthenticated /admin redirects to sign-in");
  } catch(e) { fail("unauthenticated /admin redirects", e); }

  // ── 10. API routes smoke tests ───────────────────────────────────────────
  console.log("\n[10] API smoke tests");
  const apiChecks = [
    { url: "/api/products", expect: "products" },
    { url: "/api/cart",     expect: null },        // 401 expected
  ];
  for (const { url, expect } of apiChecks) {
    try {
      const res = await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 8000 });
      const body = await page.textContent("body");
      if (expect && !body.includes(expect)) throw `body missing "${expect}"`;
      pass(`${url} responds (${res.status()})`);
    } catch(e) { fail(`${url}`, e); }
  }

  // ── 11. Checkout (unauthenticated — should load with empty cart msg) ──────
  console.log("\n[11] Checkout");
  try {
    const res = await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded", timeout: 10000 });
    if (res.status() !== 200) throw `HTTP ${res.status()}`;
    pass("checkout page loads");
  } catch(e) { fail("checkout page loads", e); }

  // ── 12. Static pages ─────────────────────────────────────────────────────
  console.log("\n[12] Static pages");
  for (const path of ["/about", "/contact", "/privacy", "/terms", "/returns"]) {
    try {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 8000 });
      if (res.status() !== 200) throw `HTTP ${res.status()}`;
      pass(`${path} loads`);
    } catch(e) { fail(`${path} loads`, e); }
  }

  await browser.close();

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed:");
    failed.forEach(r => console.log(`  ✗ ${r.name}\n    ${r.err}`));
  }
  console.log("─".repeat(50));
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
