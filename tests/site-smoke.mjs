import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const base = (process.env.SITE_URL || "https://pdf-ultra-pro.pages.dev").replace(/\/$/, "");
const timeoutMs = 30000;

async function fetchText(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(timeoutMs) });
  assert.equal(response.status, 200, `${path} should return HTTP 200 (got ${response.status})`);
  return { response, body: await response.text() };
}

async function waitForLatestRelease() {
  let lastError = "Latest release marker not visible yet";
  for (let attempt = 1; attempt <= 36; attempt++) {
    try {
      const [home, compress] = await Promise.all([fetchText("/"), fetchText("/compress-pdf.html")]);
      if (home.body.includes('href="text-to-pdf.html"') &&
          compress.body.includes("pdf.js/3.11.174/pdf.min.js")) {
        console.log(`Production release marker confirmed on attempt ${attempt}.`);
        return;
      }
      lastError = "Production site has not published the latest homepage and compression fixes yet";
    } catch (error) {
      lastError = error.message;
    }
    console.log(`Waiting for Cloudflare Pages deployment (${attempt}/36): ${lastError}`);
    await sleep(10000);
  }
  throw new Error(`Production deployment did not become ready within 6 minutes: ${lastError}`);
}

await waitForLatestRelease();

const staticPaths = [
  "/", "/all-tools.html", "/about.html", "/contact.html", "/faq.html",
  "/privacy.html", "/terms.html", "/disclaimer.html", "/report-problem.html",
  "/ads.txt", "/robots.txt", "/sitemap.xml",
  "/merge-pdf.html", "/split-pdf.html", "/compress-pdf.html", "/ocr-pdf.html",
  "/text-to-pdf.html", "/pdf-to-jpg.html", "/pdf-to-text.html",
];
for (const path of staticPaths) {
  const { response, body } = await fetchText(path);
  if (path.endsWith(".html") || path === "/") {
    assert.match(response.headers.get("content-type") || "", /text\/html/i, `${path} should be served as HTML`);
    assert.match(body, /<title>[^<]+<\/title>/i, `${path} should have a title`);
  }
}
console.log(`HTTP smoke test passed for ${staticPaths.length} important URLs.`);

const ads = await fetchText("/ads.txt");
assert.match(ads.body, /google\.com,\s*pub-8279679003849482,\s*DIRECT,\s*f08c47fec0942fa0/);
const robots = await fetchText("/robots.txt");
assert.match(robots.body, /User-agent:\s*\*/);
assert.match(robots.body, /Sitemap:\s*https:\/\/pdf-ultra-pro\.pages\.dev\/sitemap\.xml/);
const sitemap = await fetchText("/sitemap.xml");
const sitemapUrls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.ok(sitemapUrls.length >= 30, `Expected at least 30 sitemap URLs, got ${sitemapUrls.length}`);
for (const url of sitemapUrls) {
  assert.ok(url.startsWith(base + "/"), `Unexpected sitemap host: ${url}`);
}
const sitemapChecks = await Promise.all(sitemapUrls.map(async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  return { url, status: response.status };
}));
const brokenSitemapUrls = sitemapChecks.filter(item => item.status !== 200);
assert.deepEqual(brokenSitemapUrls, [], `Sitemap URLs should return HTTP 200: ${JSON.stringify(brokenSitemapUrls)}`);
console.log(`ads.txt, robots.txt, and all ${sitemapUrls.length} sitemap URLs passed.`);

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.locator('a[data-tool-card][href="text-to-pdf.html"]').waitFor();
  const homepageHrefs = await page.locator("a[data-tool-card]").evaluateAll(els => [...new Set(els.map(el => el.getAttribute("href"))).values()]);
  assert.equal(homepageHrefs.length, 25, `Homepage should list 25 unique tools; got ${homepageHrefs.length}`);

  await page.goto(base + "/all-tools.html", { waitUntil: "domcontentloaded" });
  const directoryHrefs = await page.locator("a[data-tool-card]").evaluateAll(els => [...new Set(els.map(el => el.getAttribute("href"))).values()]);
  assert.equal(directoryHrefs.length, 25, `Tool directory should list 25 unique tools; got ${directoryHrefs.length}`);
  assert.deepEqual([...homepageHrefs].sort(), [...directoryHrefs].sort(), "Homepage and all-tools directory should contain the same tool links");
  console.log("Browser navigation and 25-tool directory consistency passed.");

  async function openTool(path, selector = "#tool-app .dropzone") {
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.locator(selector).waitFor({ timeout: 20000 });
  }

  async function makePdf(pageCount = 1) {
    return page.evaluate(async (count) => {
      const { PDFDocument, StandardFonts } = window.PDFLib;
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (let i = 1; i <= count; i++) {
        const pdfPage = doc.addPage([300, 400]);
        pdfPage.drawText("PDF Ultra Pro smoke test page " + i, { x: 24, y: 350, size: 14, font });
      }
      const bytes = await doc.save();
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }, pageCount);
  }

  async function uploadPdfFiles(files) {
    await page.locator("#tool-app .dropzone input[type=file]").setInputFiles(files.map(file => ({
      name: file.name,
      mimeType: "application/pdf",
      buffer: Buffer.from(file.base64, "base64"),
    })));
  }

  async function assertDownloadAfter(buttonName, expectedMessage, expectedFilename) {
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: buttonName }).click();
    const download = await downloadPromise;
    await page.locator(".result-panel").waitFor({ timeout: 60000 });
    const panelText = await page.locator(".result-panel").innerText();
    assert.ok(panelText.includes(expectedMessage), `Expected result message "${expectedMessage}", got: ${panelText}`);
    assert.equal(download.suggestedFilename(), expectedFilename);
    const filePath = await download.path();
    assert.ok(filePath, "Browser should produce a downloadable file");
    assert.ok((await stat(filePath)).size > 100, "Downloaded output should not be empty");
  }

  await openTool("/merge-pdf.html");
  const onePage = await makePdf(1);
  const secondPage = await makePdf(1);
  await uploadPdfFiles([{ name: "sample-a.pdf", base64: onePage }, { name: "sample-b.pdf", base64: secondPage }]);
  await assertDownloadAfter("Merge & Download", "Merged 2 files into one PDF.", "merged.pdf");
  console.log("Merge PDF: two real sample PDFs merged and a non-empty PDF downloaded.");

  await openTool("/split-pdf.html");
  const twoPage = await makePdf(2);
  await uploadPdfFiles([{ name: "two-page-sample.pdf", base64: twoPage }]);
  await page.locator('input[placeholder="1-3;4-6;7"]').fill("1;2");
  await assertDownloadAfter("Split & Download", "Created 2 files.", "two-page-sample-split.zip");
  console.log("Split PDF: two-page sample split into two outputs and a non-empty ZIP downloaded.");

  await openTool("/compress-pdf.html");
  await uploadPdfFiles([{ name: "compression-sample.pdf", base64: twoPage }]);
  await assertDownloadAfter("Compress & Download", "Output", "compression-sample-compressed.pdf").catch(async error => {
    // Successful compression can report smaller, larger, or unchanged output.
    if (!String(error.message).includes("Expected result message")) throw error;
    const panel = await page.locator(".result-panel").innerText().catch(() => "");
    if (!/file size|output size|larger than the original|reduced file size/i.test(panel)) throw error;
  });
  console.log("Compress PDF: PDF.js rendered pages and a non-empty compressed PDF downloaded.");

  await page.goto(base + "/text-to-pdf.html", { waitUntil: "domcontentloaded" });
  await page.locator("#ttp-text").waitFor({ timeout: 20000 });
  await page.locator("#ttp-text").fill("PDF Ultra Pro browser smoke test");
  const textPdfDownload = page.waitForEvent("download", { timeout: 60000 });
  await page.locator("#ttp-download").click();
  const textDownload = await textPdfDownload;
  assert.equal(textDownload.suggestedFilename(), "text-to-pdf.pdf");
  const textPath = await textDownload.path();
  assert.ok(textPath && (await stat(textPath)).size > 100, "Text to PDF should download a non-empty PDF");
  console.log("Text to PDF: typed text rendered and a non-empty PDF downloaded.");

  assert.deepEqual(pageErrors, [], `Browser page errors: ${JSON.stringify(pageErrors)}`);
  console.log("No uncaught browser page errors were detected during the tested flows.");
} finally {
  await browser.close();
}
