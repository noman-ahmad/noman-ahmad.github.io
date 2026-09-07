const { chromium } = require('playwright-core');
const EXE = '/Users/nomanahmad/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext({ viewport:{width:1200,height:630}, deviceScaleFactor:2 })).newPage();
  await p.goto('file://' + process.argv[2], { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(900);
  await p.screenshot({ path: process.argv[3] });
  await b.close(); console.log('rendered');
})();
