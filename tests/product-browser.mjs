import { chromium, webkit } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../server/index.mjs";

// Injected integrations keep this test deterministic; this is not live API evidence.
const creators = Array.from({ length: 3 }, (_, i) => ({
  channelId: `UC-test-${i}`,
  name: `Test Creator ${i + 1}`,
  handle: `@test${i}`,
  description:
    "Independent technology videos with practical product demonstrations.",
  image: "../assets/avatars/jeff-nippard.jpg",
  subscribers: 50000 + i * 20000,
  averageViews: 10000,
  engagement: 3.5,
  fetchedAt: new Date().toISOString(),
  videos: [
    {
      id: "abcdefghijk",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      title: "A practical demonstration",
      duration: 600,
      views: 10000,
      likes: 300,
      comments: 50,
      thumbnail: "../assets/avatars/jeff-nippard.jpg",
    },
  ],
}));
const analysis = {
  summary:
    "A practical technology format with detailed product demonstrations.",
  visual: "Clear desk setup with close-up product shots.",
  audio: "Specific explanations with measured claims.",
  format: "60-second long-form mid-roll",
  scores: { content: 90, visual: 85, message: 88, safety: 90 },
  score: 89,
  topics: ["Technology"],
  risks: ["Confirm competitor exclusivity"],
  evidence: [
    {
      videoId: "abcdefghijk",
      seconds: 42,
      observation: "A close-up demonstration",
      modality: "both",
    },
  ],
  videoIds: ["abcdefghijk"],
  model: "fixture-only",
  analyzedAt: new Date().toISOString(),
};
const brief = {
  title: "Product in practice",
  objective: "Awareness",
  scene: "An everyday desk setup",
  opening: "Here is how I use this product.",
  tone: "Practical",
  deliverables: ["One mid-roll integration"],
  messages: ["Use approved claims"],
  guardrails: ["No unsupported claims"],
  disclosure: "Include paid promotion disclosure",
  timeline: "To be confirmed",
  rights: "To be confirmed",
  evidence: "00:42 product demonstration",
};
const dir = mkdtempSync(join(tmpdir(), "orbit-browser-"));
const config = {
  database: join(dir, "db.sqlite"),
  appUrl: "http://localhost",
  youtubeKey: "fixture",
  geminiKey: "fixture",
};
const app = createApp(config, {
  discover: async () => creators,
  analyze: async () => analysis,
  generateBrief: async () => brief,
  draftEmail: async () => ({
    subject: "A creator partnership",
    body: "Hi, I would love to discuss a campaign that fits your video format.",
  }),
});
await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${app.server.address().port}`;
config.appUrl = base;
mkdirSync("tmp/product-qa", { recursive: true });
try {
  for (const [engine, name, viewport, mobile] of [
    [chromium, "desktop", { width: 1440, height: 1000 }, false],
    [webkit, "webkit-mobile", { width: 390, height: 720 }, true],
  ]) {
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(base + "/product/");
      await page
        .getByRole("button", { name: "Create an account", exact: true })
        .click();
      await page
        .getByLabel("Your name", { exact: true })
        .fill("Product Tester");
      await page
        .getByLabel("Work email", { exact: true })
        .fill(`${name}@example.com`);
      await page
        .getByLabel("Password", { exact: true })
        .fill("a long secure testing password");
      await page
        .getByRole("button", { name: "Create workspace", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Create a campaign", exact: true })
        .click();
      await page
        .getByLabel("Campaign name", { exact: true })
        .fill("Desk setup launch");
      await page
        .getByLabel("Brand / product", { exact: true })
        .fill("Test technology");
      await page
        .getByLabel("Target audience", { exact: true })
        .fill("Independent professionals who work from home");
      await page.getByLabel("Category", { exact: true }).fill("Technology");
      await page
        .getByLabel("Import an existing brief (TXT, PDF or DOCX)", {
          exact: true,
        })
        .setInputFiles({
          name: "brief.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(
            "Launch a desk product. Focus on practical use. No unsupported health claims.",
          ),
        });
      await page.waitForFunction(() =>
        document
          .querySelector("textarea[name=description]")
          .value.includes("Launch a desk product"),
      );
      await page
        .getByRole("button", { name: "Save campaign →", exact: true })
        .click();
      await page.locator('.nav a[href="#workspace"]').click();
      await page
        .getByLabel("Upload brief or deliverable", { exact: true })
        .setInputFiles({
          name: "approved-brief.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Approved collaboration details"),
        });
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await page
        .getByRole("link", { name: "approved-brief.txt", exact: true })
        .waitFor();
      await page.locator('.nav a[href="#discover"]').click();
      await page
        .getByRole("button", { name: "Find creators ✦", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Test Creator 1", exact: true })
        .waitFor();
      await page.screenshot({
        path: `tmp/product-qa/${name}-discover.png`,
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "Discover overflows horizontally",
      );
      await page
        .getByRole("button", { name: "＋ Select", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Test Creator 2", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "＋ Select", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Test Creator 3", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "× Pass", exact: true }).click();
      await page
        .getByRole("heading", {
          name: "You’ve reviewed every creator",
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("button", { name: "Open selected", exact: true })
        .click();
      await page.getByLabel("Compare Test Creator 1", { exact: true }).check();
      await page.getByLabel("Compare Test Creator 2", { exact: true }).check();
      await page
        .getByRole("button", { name: "Compare →", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review your finalists", exact: true })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Prepare outreach for 2 creators",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: /Test Creator 1 A creator partnership/ })
        .click();
      await page
        .getByLabel("To", { exact: true })
        .fill("controlled-inbox@example.com");
      await page
        .getByRole("checkbox", { name: "approved-brief.txt", exact: true })
        .check();
      const savedDraft = page.waitForResponse(
        (response) =>
          response.url().includes("/api/messages/") &&
          response.request().method() === "PATCH",
      );
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      assert.equal((await savedDraft).status(), 200);
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await page.locator('a[href="#selected"]').click();
      await page
        .getByRole("button", { name: /Test Creator 1 50K subscribers/ })
        .click();
      await page
        .getByLabel("Internal notes", { exact: true })
        .fill("Confirm exclusivity with client");
      await page
        .getByRole("button", { name: "Save details", exact: true })
        .click();
      await page
        .getByRole("button", { name: "⚡ Generate AI Brief", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Test Creator 1 · Creator brief",
          exact: true,
        })
        .waitFor();
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download PDF", exact: true })
        .click();
      const download = await downloadPromise;
      assert.ok(download.suggestedFilename().endsWith(".pdf"));
      await page
        .getByRole("button", { name: "Approve saved brief", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Desk setup launch", exact: true })
        .waitFor();
      await page
        .getByLabel("Task", { exact: true })
        .fill("Check creator rates");
      await page.getByRole("button", { name: "Add task", exact: true }).click();
      await page
        .getByRole("checkbox", { name: "Check creator rates No deadline" })
        .check();
      await page.reload();
      await page
        .getByRole("heading", { name: "Desk setup launch", exact: true })
        .waitFor();
      assert.ok(
        await page
          .getByRole("checkbox", { name: "Check creator rates No deadline" })
          .isChecked(),
        "Task not persisted",
      );
      await page.screenshot({
        path: `tmp/product-qa/${name}-workspace.png`,
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      console.log(
        `${name}: registration → brief import → campaign → discovery → selection → comparison → outreach draft → creator note → brief PDF → approval → persisted task passed`,
      );
    } finally {
      await browser.close();
    }
  }
} finally {
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
