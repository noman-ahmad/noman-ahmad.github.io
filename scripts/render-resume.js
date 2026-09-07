const { chromium } = require('playwright-core') // npm i playwright-core;
const fs = require('fs');
const EXE = '/Users/nomanahmad/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const ROOT = '/Users/nomanahmad/Desktop/noman-ahmad.github.io';
const SCALE = 2.6; // ~1590px wide for US Letter; displayed at ~900 CSS px

const page_html = `<!DOCTYPE html><html><body><script type="module">
  import * as pdfjs from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs';
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';
  window.renderAll = async (bytes, scale) => {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
    const out = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pg = await doc.getPage(n);
      const vp = pg.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      out.push({ w: c.width, h: c.height, data: c.toDataURL('image/png') });
    }
    return out;
  };
  window.__ready = true;
<\/script></body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext()).newPage();
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  await p.setContent(page_html);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });

  const bytes = Array.from(fs.readFileSync(ROOT + '/assets/resume.pdf'));
  const pages = await p.evaluate(([b, s]) => window.renderAll(b, s), [bytes, SCALE]);

  pages.forEach((pg, i) => {
    const file = `${ROOT}/assets/resume-p${i + 1}.png`;
    fs.writeFileSync(file, Buffer.from(pg.data.split(',')[1], 'base64'));
    console.log(`page ${i + 1}: ${pg.w}x${pg.h} -> ${file}`);
  });
  console.log('pages rendered:', pages.length);
  await b.close();
})();
