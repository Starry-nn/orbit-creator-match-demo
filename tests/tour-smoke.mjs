import playwright from '/Users/starry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.js';

const { chromium } = playwright;

const baseURL = process.env.ORBIT_URL || 'http://127.0.0.1:4173';
const totalTourSteps = 21;

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

  for (let step = 0; step < totalTourSteps - 1; step += 1) {
    const coach = page.locator('.tour-coach');
    await coach.waitFor({ state: 'visible' });
    const stepLabel = await coach.locator('.tour-copy > span').textContent();
    if (!stepLabel?.includes(`${step + 1}/${totalTourSteps}`)) {
      throw new Error(`${label}: expected tour step ${step + 1}, saw ${stepLabel}`);
    }
    if (label === 'mobile-touch' && [7, 8, 14, 18].includes(step)) {
      await page.screenshot({ path: `tmp/qa-20260927-mobile-step-${step + 1}.png`, fullPage: true });
    }
    if (label === 'desktop-browser' && [7, 8, 14, 18].includes(step)) {
      await page.screenshot({ path: `tmp/qa-20260927-desktop-step-${step + 1}.png`, fullPage: true });
    }
    if (step === 7 && !(await page.locator('.decision-main').innerText()).includes('Pass')) throw new Error(`${label}: Pass/Select controls are not explicit`);
    if (step === 8 && !(await page.locator('.decision-tools').innerText()).includes('Save for later')) throw new Error(`${label}: review controls are not explicit`);
    if (step === 18 && !(await page.locator('[data-tour="open-brief"]').isVisible())) throw new Error(`${label}: creator brief transition is missing`);

    if (step === 11 || step === 12) {
      await page.locator('#briefDrawer.open').waitFor({ state: 'visible' });
    }
    if (step === 12) {
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

    if ([5, 9, 13, 17, 19].includes(step)) await page.waitForTimeout(800);
    else await page.waitForTimeout(120);
  }

  const finish = page.locator('#finishTour');
  await finish.waitFor({ state: 'visible' });
  await finish.click();
  await page.locator('.transition-shell').waitFor({ state: 'visible' });
  if (errors.length) throw new Error(`${label}: ${errors.join('\n')}`);
  console.log(`${label}: all ${totalTourSteps} guided-tour steps passed`);
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
    if (selectDevice) {
      await page.locator(`[data-device="${selectDevice}"]`).click();
      await page.waitForTimeout(400);
    }
    await page.locator('#app').waitFor({ state: 'visible' });
    if (!(await page.locator('#app').innerText()).trim()) errors.push('empty app screen');
    if (screen === 'chat' && !(await page.locator('.email-actions').innerText()).includes('Back to inbox')) errors.push('email return label is ambiguous');
    if (screen === 'pool') {
      const checkBox = await page.locator('.creator-list-item .check').first().boundingBox();
      const avatarBox = await page.locator('.creator-list-item .creator-avatar').first().boundingBox();
      if (!checkBox || !avatarBox || checkBox.x + checkBox.width > avatarBox.x) errors.push('selection box overlaps creator photo');
    }
    if (screen === 'messages') {
      const navColor = await page.locator('[data-nav="messages"]').evaluate(element => getComputedStyle(element).color);
      const iconColor = await page.locator('[data-nav="messages"] .nav-channel-icon').evaluate(element => getComputedStyle(element).backgroundColor);
      if (navColor !== iconColor) errors.push('Inbox icon does not inherit active navigation color');
    }
    if (errors.length) throw new Error(`${label}/${screen}: ${errors.join('; ')}`);
    await page.close();
  }
  console.log(`${label}: all ${screens.length} standalone screens rendered without runtime errors`);
  await browser.close();
}

await runScreenSmoke('mobile-routes', { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
await runScreenSmoke('desktop-routes', { viewport: { width: 1440, height: 900 } }, 'laptop');
