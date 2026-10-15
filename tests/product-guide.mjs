import { chromium, webkit } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/index.mjs";

// Browser evidence for the real UI flow. External providers are deterministic
// test doubles; the suite never sends email or claims live Google access.
const creators = Array.from({ length: 7 }, (_, i) => ({
  channelId: `UC-guide-${i}`,
  name: `Guide Creator ${i + 1}`,
  handle: `@guide${i}`,
  description: "Useful independent product reviews.",
  image: "../assets/avatars/jeff-nippard.jpg",
  subscribers: 10000,
  averageViews: 4000,
  engagement: 3,
  fetchedAt: new Date().toISOString(),
  videos: [
    {
      id: "abcdefghijk",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      duration: 300,
      title: "A product review",
      thumbnail: "../assets/avatars/jeff-nippard.jpg",
    },
  ],
}));
const analysis = {
  score: 85,
  summary: "A practical content fit",
  visual: "Clear product shots",
  audio: "Detailed explanations",
  format: "Long-form integration",
  risks: [],
  videoIds: ["abcdefghijk"],
  model: "fixture-only",
  analyzedAt: new Date().toISOString(),
  evidence: [
    {
      videoId: "abcdefghijk",
      seconds: 20,
      observation: "A product demonstration",
      modality: "both",
    },
  ],
};
const brief = {
  title: "Creator direction",
  objective: "Awareness",
  scene: "A real use case",
  opening: "Here is how I use it",
  tone: "Practical",
  deliverables: ["One integration"],
  messages: ["Approved product facts"],
  guardrails: ["No unsupported claims"],
  disclosure: "Paid promotion",
  timeline: "To be confirmed",
  rights: "To be confirmed",
  evidence: "00:20 demonstration",
};
const dir = mkdtempSync(join(tmpdir(), "orbit-guide-"));
const config = {
  database: join(dir, "db.sqlite"),
  appUrl: "http://localhost",
  youtubeKey: "fixture",
  geminiKey: "fixture",
};
let sends = 0;
const app = createApp(config, {
  discover: async (b, options) => ({
    creators: b.name.startsWith("Single")
      ? creators.slice(0, 1)
      : b.name.startsWith("Seven")
        ? creators.slice(0, options.limit)
        : creators.slice(0, Math.min(3, options.limit)),
    nextPageToken: null,
  }),
  analyze: async () => analysis,
  generateBrief: async () => brief,
  draftEmail: async () => ({
    subject: "A partnership opportunity",
    body: "Hi, here is a campaign that fits your practical video format.",
  }),
  sendMail: async () => {
    sends++;
    throw new Error("The guide must never send without approval");
  },
});
await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${app.server.address().port}`;
config.appUrl = base;
mkdirSync("tmp/product-qa", { recursive: true });
try {
  for (const [engine, name, viewport, count] of [
    [chromium, "guided-desktop", { width: 1440, height: 1000 }, 3],
    [webkit, "guided-webkit-mobile", { width: 390, height: 667 }, 3],
    [webkit, "guided-webkit-single", { width: 390, height: 667 }, 1],
    [webkit, "guided-webkit-compact", { width: 360, height: 640 }, 7],
  ]) {
    if (process.env.ORBIT_GUIDE_CASE && process.env.ORBIT_GUIDE_CASE !== name)
      continue;
    const browser = await engine.launch({ headless: true });
    const page = await browser.newPage({
      viewport,
      isMobile: engine === webkit,
      hasTouch: engine === webkit,
      acceptDownloads: true,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(base + "/product/");
      await page
        .getByRole("button", { name: "Create an account", exact: true })
        .click();
      await page.getByLabel("Your name", { exact: true }).fill("Guide Tester");
      await page
        .getByLabel("Work email", { exact: true })
        .fill(`${name}@example.com`);
      await page
        .getByLabel("Password", { exact: true })
        .fill("A long secure guide test password");
      await page
        .getByRole("button", { name: "Create workspace", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Start guided setup", exact: true })
        .click();
      const visited = new Set();
      const reloaded = new Set();
      for (let turn = 0; turn < 75; turn++) {
        const coach = page.locator("#guideCoach");
        await coach.waitFor({ state: "visible" });
        await page.waitForTimeout(170);
        const step = await coach.getAttribute("data-step");
        if (
          ["compare", "email-save", "brief-export"].includes(step) &&
          !reloaded.has(step)
        ) {
          reloaded.add(step);
          await page.reload();
          continue;
        }
        visited.add(step);
        const target = page.locator(".guide-target").first();
        if (step !== "finish") {
          if (!(await target.count()))
            throw new Error(`${name}/${step}: no highlighted control`);
          const box = await target.boundingBox(),
            coachBox = await coach.boundingBox();
          assert.ok(
            box && box.y >= -1 && box.y + box.height <= viewport.height + 1,
            `${name}/${step}: target is outside the visible viewport before any click`,
          );
          const overlapWidth = Math.max(
            0,
            Math.min(box.x + box.width, coachBox.x + coachBox.width) -
              Math.max(box.x, coachBox.x),
          );
          const overlapHeight = Math.max(
            0,
            Math.min(box.y + box.height, coachBox.y + coachBox.height) -
              Math.max(box.y, coachBox.y),
          );
          if (overlapWidth * overlapHeight >= 1)
            console.log(
              name,
              step,
              await page.evaluate(() => {
                const dialog = document.querySelector("dialog[open]");
                return {
                  target: document
                    .querySelector(".guide-target")
                    .getBoundingClientRect()
                    .toJSON(),
                  coach: document
                    .querySelector("#guideCoach")
                    .getBoundingClientRect()
                    .toJSON(),
                  dialog: dialog?.getBoundingClientRect().toJSON(),
                  scrollTop: dialog?.scrollTop,
                  scrollHeight: dialog?.scrollHeight,
                  clientHeight: dialog?.clientHeight,
                  innerHeight,
                  visualViewport: {
                    height: visualViewport.height,
                    offsetTop: visualViewport.offsetTop,
                  },
                };
              }),
            );
          assert.ok(
            overlapWidth * overlapHeight < 1,
            `${name}/${step}: coach covers highlighted control`,
          );
          const occluded = await target.evaluate((node) => {
            const modal = node.closest("dialog");
            if (!modal || node.closest(".dialog-head")) return false;
            const rect = node.getBoundingClientRect();
            const header = modal
              .querySelector(".dialog-head")
              .getBoundingClientRect();
            return rect.top < header.bottom - 1;
          });
          assert.equal(
            occluded,
            false,
            `${name}/${step}: dialog header covers target`,
          );
          await page.waitForTimeout(110);
          const settled = await target.boundingBox();
          assert.ok(
            Math.abs(box.y - settled.y) < 1,
            `${name}/${step}: highlight is shifting while idle`,
          );
        }
        if (
          [
            "batch-size",
            "profile",
            "defer",
            "pick",
            "brief-export",
            "email-save",
          ].includes(step)
        )
          await page.screenshot({ path: `tmp/product-qa/${name}-${step}.png` });
        const fillAndContinue = async (value) => {
          await target.locator("input,textarea").fill(value);
          await coach
            .getByRole("button", { name: "Continue →", exact: true })
            .click();
        };
        if (step === "name") {
          const before = page.url();
          await page.locator('.nav a[href="#home"]').click();
          assert.equal(
            page.url(),
            before,
            "An unrelated click escaped the guide",
          );
          await fillAndContinue(
            count === 1
              ? "Single creator campaign"
              : count === 7
                ? "Seven creator campaign"
                : "Guided creator campaign",
          );
        } else if (step === "brand") await fillAndContinue("Test brand");
        else if (step === "audience")
          await fillAndContinue("Professionals working from home");
        else if (step === "budget") await fillAndContinue("5000");
        else if (step === "category") await fillAndContinue("Technology");
        else if (step === "batch-size") {
          await target.locator("select").selectOption(count > 1 ? "8" : "2");
          await coach
            .getByRole("button", { name: "Continue →", exact: true })
            .click();
        } else if (
          [
            "goal",
            "format",
            "profile",
            "fit",
            "evidence",
            "email-body",
            "brief-review",
            "brief-messages",
            "brief-guardrails",
          ].includes(step)
        )
          await coach
            .getByRole("button", { name: "Continue →", exact: true })
            .click();
        else if (step === "recipient")
          await fillAndContinue("controlled-inbox@example.com");
        else if (step === "pick")
          await page.locator("[data-compare]:not(:checked)").first().check();
        else if (step === "select") {
          const title = await page
            .locator(".profile .identity h1")
            .textContent();
          await target.click();
          await page.waitForFunction(
            (old) =>
              document.querySelector("#guideCoach")?.dataset.step !==
                "select" ||
              document.querySelector(".profile .identity h1")?.textContent !==
                old,
            title,
          );
        } else if (step === "discover") {
          await target.click();
          await page.waitForFunction(
            () =>
              document.querySelector("#guideCoach")?.dataset.step === "profile",
          );
        } else if (step === "email-send")
          await coach
            .getByRole("button", { name: "Keep as draft", exact: true })
            .click();
        else if (step === "brief-export") {
          const download = page.waitForEvent("download");
          await target.click();
          assert.ok((await download).suggestedFilename().endsWith(".pdf"));
        } else if (step === "finish") {
          await coach
            .getByRole("button", { name: "Finish walkthrough", exact: true })
            .click();
          break;
        } else await target.click();
        if (!["pick", "select"].includes(step))
          await page.waitForFunction(
            (previous) =>
              document.querySelector("#guideCoach")?.dataset.step !== previous,
            step,
          );
      }
      assert.equal(
        await page.locator("#guideCoach").count(),
        0,
        `${name}: guide did not finish`,
      );
      for (const required of [
        "budget",
        "audience",
        "discover",
        "pass",
        "undo",
        "defer",
        "select",
        "email-save",
        "brief-generate",
        "brief-export",
        "brief-approve",
        "finish",
      ])
        assert.ok(visited.has(required), `${name}: missing ${required}`);
      if (count > 1) assert.ok(visited.has("pick") && visited.has("compare"));
      else assert.ok(visited.has("single-detail") && !visited.has("pick"));
      const campaigns = await (
        await page.request.get(base + "/api/campaigns")
      ).json();
      const saved = await (
        await page.request.get(
          `${base}/api/campaigns/${campaigns.campaigns[0].id}`,
        )
      ).json();
      assert.ok(saved.briefs.some((b) => b.status === "approved"));
      assert.ok(saved.messages.every((m) => m.status === "draft"));
      assert.equal(sends, 0);
      assert.deepEqual(errors, []);
      console.log(
        `${name}: guided real inputs, visible native highlights, blocked unrelated clicks, real decisions, draft-only outreach, brief export and approval passed (${visited.size} stages)`,
      );
    } catch (error) {
      await page.screenshot({
        path: `tmp/product-qa/${name}-failure.png`,
        fullPage: true,
      });
      throw error;
    } finally {
      await browser.close();
    }
  }
} finally {
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
