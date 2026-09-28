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
    await page.waitForFunction(() => !document.querySelector('#tourLayer')?.classList.contains('tour-positioning'));
    const stepLabel = await coach.locator('.tour-copy > span').textContent();
    if (!stepLabel?.includes(`${step + 1}/${totalTourSteps}`)) {
      throw new Error(`${label}: expected tour step ${step + 1}, saw ${stepLabel}`);
    }
    if (label === 'mobile-touch' && [7, 8, 9, 14, 15, 17, 18, 19].includes(step)) {
      await page.screenshot({ path: `tmp/qa-20260927-mobile-step-${step + 1}.png`, fullPage: true });
    }
    if (label === 'desktop-browser' && [7, 8, 14, 18].includes(step)) {
      await page.screenshot({ path: `tmp/qa-20260927-desktop-step-${step + 1}.png`, fullPage: true });
    }
    if (step === 7 && !(await page.locator('.decision-main').innerText()).includes('Pass')) throw new Error(`${label}: Pass/Select controls are not explicit`);
    if (step === 8) {
      if (await page.locator('.tour-highlight-multi').count() !== 2) throw new Error(`${label}: side controls do not have two separate highlights`);
      if (await page.locator('.decision-main.tour-target').count()) throw new Error(`${label}: Pass/Select should not be highlighted with side controls`);
    }
    if (step === 9) {
      const target = page.locator('.tour-target');
      if (!(await target.isVisible())) throw new Error(`${label}: evidence control is not visible or actionable`);
      const box = await target.boundingBox();
      const viewport = page.viewportSize();
      if (!box || !viewport || box.y < 0 || box.y + box.height > viewport.height) throw new Error(`${label}: evidence control is outside the visible viewport`);
    }
    if (step === 18 && !(await page.locator('[data-tour="open-brief"]').isVisible())) throw new Error(`${label}: creator brief transition is missing`);

    if (label.startsWith('mobile-') && [8, 9, 14, 15, 17, 18, 19].includes(step)) {
      await page.waitForTimeout(550);
      const coachBox = await coach.boundingBox();
      const phoneBox = await page.locator('.phone').boundingBox();
      const highlights = page.locator('.tour-highlight');
      if (!coachBox || !phoneBox || !(await highlights.count())) throw new Error(`${label}: step ${step + 1} is missing its visible guidance geometry`);
      for (let index = 0; index < await highlights.count(); index += 1) {
        const highlight = highlights.nth(index);
        const box = await highlight.boundingBox();
        const opacity = Number(await highlight.evaluate(element => getComputedStyle(element).opacity));
        if (!box || opacity < .9 || box.width < 24 || box.height < 24) throw new Error(`${label}: step ${step + 1} highlight ${index + 1} is not visible`);
        if (box.y < phoneBox.y || box.y + box.height > phoneBox.y + phoneBox.height) throw new Error(`${label}: step ${step + 1} highlight ${index + 1} is outside the phone viewport`);
        const overlapWidth = Math.max(0, Math.min(box.x + box.width, coachBox.x + coachBox.width) - Math.max(box.x, coachBox.x));
        const overlapHeight = Math.max(0, Math.min(box.y + box.height, coachBox.y + coachBox.height) - Math.max(box.y, coachBox.y));
        if (overlapWidth * overlapHeight > 4) throw new Error(`${label}: step ${step + 1} coach covers highlight ${index + 1}`);
      }
    }

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

const mobileContext = (height = 844) => ({
  viewport: { width: 390, height },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
});

await runTour('mobile-touch', mobileContext());
await runTour('mobile-safari-short', { ...mobileContext(667), viewport: { width: 390, height: 667 } });

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
