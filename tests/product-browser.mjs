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
  discover: async () => ({ creators, nextPageToken: null }),
  analyze: async (_brief, creator) => ({
    ...analysis,
    risks: creator.channelId === creators[1].channelId ? [] : analysis.risks,
  }),
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

async function dragProfile(
  page,
  distance,
  name,
  { touch = false, cancel = false, foreignPointer = false } = {},
) {
  const image = page.locator(".profile > .portrait img");
  await image.scrollIntoViewIfNeeded();
  const box = await image.boundingBox();
  const profile = await page.locator(".discover > .profile").boundingBox();
  const evidence = await page.locator(".discover > aside").boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.evaluate(() => {
    window.swipeProbe?.abort();
    window.swipeProbe = new AbortController();
    window.swipeTrace = [];
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "lostpointercapture",
      "dragstart",
    ])
      document.addEventListener(
        type,
        (e) =>
          window.swipeTrace.push({
            type,
            id: e.pointerId,
            primary: e.isPrimary,
            trusted: e.isTrusted,
            x: e.clientX,
            y: e.clientY,
            target: e.target.tagName,
            state: document.querySelector("#swipeSurface")?.dataset.swipe,
          }),
        { capture: true, signal: window.swipeProbe.signal },
      );
  });
  await image.evaluate((node) =>
    node.addEventListener(
      "pointerdown",
      (event) => {
        node.dataset.testPointer = String(event.pointerId);
      },
      { once: true },
    ),
  );
  const cdp = touch ? await page.context().newCDPSession(page) : null;
  if (cdp)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
  else {
    await page.mouse.move(x, y);
    await page.mouse.down();
  }
  try {
    if (cdp) {
      for (let step = 1; step <= 12; step++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + (distance * step) / 12, y, id: 1 }],
        });
    } else await page.mouse.move(x + distance, y, { steps: 12 });
    if (cdp)
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    const pointerId = Number(await image.getAttribute("data-test-pointer"));
    if (foreignPointer) {
      // These explicitly synthetic events test pointer ownership, not native
      // multitouch support. The main drag above uses browser-native input.
      for (const type of ["pointerdown", "pointermove", "pointerup"])
        await page.locator("#swipeSurface").dispatchEvent(type, {
          pointerId: pointerId + 100,
          isPrimary: false,
          clientX: x - 200,
          clientY: y,
        });
    }
    if (!(await page.locator("#swipeSurface").getAttribute("data-swipe")))
      console.log("swipe trace", await page.evaluate(() => window.swipeTrace));
    assert.equal(
      await page.locator("#swipeSurface").getAttribute("data-swipe"),
      distance > 0 ? "SELECTED" : "PASS",
      "Dragging the portrait must show live swipe feedback",
    );
    // Read both panels in one renderer task. Separate protocol calls can sample
    // different native touchmove frames even though they share one transform.
    const { movedProfile, movedEvidence } = await page
      .locator("#swipeSurface")
      .evaluate((node) => ({
        movedProfile: node
          .querySelector(":scope > .profile")
          .getBoundingClientRect()
          .toJSON(),
        movedEvidence: node
          .querySelector(":scope > aside")
          .getBoundingClientRect()
          .toJSON(),
      }));
    assert.ok(
      Math.abs(movedProfile.x - profile.x) > 10,
      "The creator profile must visibly follow the pointer",
    );
    assert.ok(
      Math.abs(movedProfile.x - profile.x - (movedEvidence.x - evidence.x)) < 1,
      "Profile and evidence must move together",
    );
    if (name)
      await page.screenshot({ path: `tmp/product-qa/${name}-swipe.png` });
    if (cancel) {
      await page
        .locator("#swipeSurface")
        .dispatchEvent("pointercancel", { pointerId });
      assert.equal(
        await page.locator("#swipeSurface").getAttribute("data-swipe"),
        null,
      );
      assert.equal(
        await page
          .locator("#swipeSurface")
          .evaluate((node) => node.style.transform),
        "",
      );
    }
  } finally {
    await page.evaluate(() => window.swipeProbe.abort());
    if (cdp) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    } else await page.mouse.up();
  }
}

async function touchScrollProfile(page) {
  const image = page.locator(".profile > .portrait img");
  await image.scrollIntoViewIfNeeded();
  const box = await image.boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const before = await page.evaluate(() => scrollY);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let step = 1; step <= 12; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - step * 10, id: 1 }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction((old) => scrollY > old + 20, before);
    await page.waitForFunction(() => {
      const previous = window.scrollProbe;
      window.scrollProbe = {
        y: scrollY,
        stable: previous?.y === scrollY ? previous.stable + 1 : 0,
      };
      return window.scrollProbe.stable >= 4;
    });
    assert.equal(
      await page.locator("#swipeSurface").getAttribute("data-swipe"),
      null,
      "A vertical touch must scroll without becoming a decision",
    );
  } finally {
    await cdp.detach();
  }
}

try {
  for (const [engine, name, viewport, mobile] of [
    [chromium, "desktop", { width: 1440, height: 1000 }, false],
    [webkit, "webkit-mobile", { width: 390, height: 720 }, true],
    [chromium, "chromium-touch", { width: 390, height: 720 }, true],
  ]) {
    if (
      process.env.ORBIT_BROWSER_CASE &&
      process.env.ORBIT_BROWSER_CASE !== name
    )
      continue;
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const touch = engine === chromium && mobile;
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
      await page.locator(".discovery-options > summary").click();
      assert.equal(
        await page.getByLabel("Creators per batch").inputValue(),
        "2",
      );
      await page.getByLabel("Creators per batch").selectOption("8");
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
      const campaigns = await (
        await page.request.get(base + "/api/campaigns")
      ).json();
      const campaignId = campaigns.campaigns[0].id;
      const decisionCount = () =>
        app.store.one(
          "SELECT count(*) AS count FROM decisions WHERE campaign_id=?",
          campaignId,
        ).count;
      await dragProfile(page, 45, undefined, { touch, foreignPointer: true });
      if (touch) await touchScrollProfile(page);
      else {
        const image = page.locator(".profile > .portrait img");
        await image.scrollIntoViewIfNeeded();
        const box = await image.boundingBox();
        const y = box.y + box.height / 2;
        await page.mouse.move(box.x + 3, y);
        await page.mouse.down();
        await page.mouse.move(box.x - 5, y);
        await page.mouse.up();
        await page.mouse.move(box.x + box.width / 2, y);
        assert.equal(
          await page.locator("#swipeSurface").getAttribute("data-swipe"),
          null,
          "Releasing a short drag outside the card must clear the gesture",
        );
      }
      assert.equal(
        await page.locator(".profile h1").textContent(),
        "Test Creator 1",
        "A short drag must not make a decision",
      );
      await dragProfile(page, 120, undefined, { touch, cancel: true });
      assert.equal(
        decisionCount(),
        0,
        "Short, cancelled and unrelated pointer gestures must not make decisions",
      );
      await dragProfile(page, 120, name, { touch });
      await page
        .getByRole("heading", { name: "Test Creator 2", exact: true })
        .waitFor();
      assert.equal(
        decisionCount(),
        1,
        "One completed swipe must create exactly one decision",
      );
      await page
        .getByRole("button", { name: "Undo last decision", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Test Creator 1", exact: true })
        .waitFor();
      await page.keyboard.press("ArrowRight");
      await page
        .getByRole("heading", { name: "Test Creator 2", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "＋ Select", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Test Creator 3", exact: true })
        .waitFor();
      await dragProfile(page, -120, undefined, { touch });
      await page
        .getByRole("heading", {
          name: "You’ve reviewed every creator",
          exact: true,
        })
        .waitFor();
      assert.equal(
        decisionCount(),
        4,
        "Swipes, keyboard and button decisions must not be duplicated",
      );
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
        .getByRole("cell", {
          name: "No specific risks identified in this sample",
          exact: true,
        })
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
      await page
        .locator("input[data-task]:checked:not(:disabled):not([aria-busy])")
        .waitFor();
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
        `${name}: ${touch ? "native touch swipe/scroll" : "native pointer drag"}, cancellation/threshold guards, exact decision counts, comparison, draft attachments, PDF approval and persisted task passed`,
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
