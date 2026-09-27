import playwright from '/Users/starry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.js';

const { chromium } = playwright;

const baseURL = process.env.ORBIT_URL || 'http://127.0.0.1:4173';

async function runTour(label, contextOptions, selectDevice) {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const context = await browser.newContext({ acceptDownloads: true, ...contextOptions });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto(`${baseURL}/?screen=home&tour=0`, { waitUntil: 'networkidle' });
  if (selectDevice) await page.locator(`[data-device="${selectDevice}"]`).click();

  for (let step = 0; step < 18; step += 1) {
    const coach = page.locator('.tour-coach');
    await coach.waitFor({ state: 'visible' });
    const stepLabel = await coach.locator('.tour-copy > span').textContent();
    if (!stepLabel?.includes(`${step + 1}/19`)) {
      throw new Error(`${label}: expected tour step ${step + 1}, saw ${stepLabel}`);
    }

    if (step === 10 || step === 11) {
      await page.locator('#briefDrawer.open').waitFor({ state: 'visible' });
    }
    if (step === 11) {
      const closeButton = page.locator('#closeBriefDrawer');
      await closeButton.scrollIntoViewIfNeeded();
      if (!(await closeButton.isVisible())) throw new Error(`${label}: close brief button is not visible`);
      if (label === 'mobile-touch') await page.screenshot({ path: 'tmp/qa-20260927-tour-close.png', fullPage: true });
    }

    const continueButton = page.locator('#tourContinue');
    if (await continueButton.count()) {
      await continueButton.click();
    } else {
      const target = page.locator('.tour-target');
      if (!(await target.count())) throw new Error(`${label}: step ${step + 1} has no actionable target`);
      await target.click();
    }

    if ([5, 8, 12, 16, 17].includes(step)) await page.waitForTimeout(800);
    else await page.waitForTimeout(120);
  }

  const finish = page.locator('#finishTour');
  await finish.waitFor({ state: 'visible' });
  await finish.click();
  await page.locator('.transition-shell').waitFor({ state: 'visible' });
  if (errors.length) throw new Error(`${label}: ${errors.join('\n')}`);
  console.log(`${label}: all 19 guided-tour steps passed`);
  await browser.close();
}

await runTour('mobile-touch', {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
});

await runTour('desktop-browser', { viewport: { width: 1440, height: 900 } }, 'laptop');

async function runScreenSmoke(label, contextOptions, selectDevice) {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext(contextOptions);
  const screens = ['welcome','onboarding','transition','home','create','match','profile','pool','messages','chat','workspace','brief','review'];
  for (const screen of screens) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/?screen=${screen}`, { waitUntil: 'networkidle' });
    if (selectDevice) await page.locator(`[data-device="${selectDevice}"]`).click();
    await page.locator('#app').waitFor({ state: 'visible' });
    if (!(await page.locator('#app').innerText()).trim()) errors.push('empty app screen');
    if (errors.length) throw new Error(`${label}/${screen}: ${errors.join('; ')}`);
    await page.close();
  }
  console.log(`${label}: all ${screens.length} standalone screens rendered without runtime errors`);
  await browser.close();
}

await runScreenSmoke('mobile-routes', { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
await runScreenSmoke('desktop-routes', { viewport: { width: 1440, height: 900 } }, 'laptop');
