import { chromium } from "playwright";
import { mkdirSync, renameSync, existsSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "public/videos");
const TMP = "/tmp/wine-rec";
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: TMP, size: { width: 1280, height: 720 } },
});

const page = await context.newPage();
await page.goto("http://127.0.0.1:3000/demo/product-motion.html", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(16500);
await context.close();
await browser.close();

const webm = readdirSync(TMP).find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("Aucune vidéo Playwright générée");
const src = join(TMP, webm);
const destWebm = join(OUT, "wine-product-demo.webm");
copyFileSync(src, destWebm);
console.log("OK webm", destWebm);
