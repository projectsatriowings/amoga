import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\aaaa1961-8768-4292-842a-0bd4613aa28b';

async function checkHomepageIcons() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gatekeeper-before.png') });

  const info = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('article, [role="region"]'));
    return panels.map((p, idx) => {
      const svgs = Array.from(p.querySelectorAll('svg')).map(s => {
        const rect = s.getBoundingClientRect();
        const cs = window.getComputedStyle(s);
        return {
          classes: s.getAttribute('class'),
          width: rect.width,
          height: rect.height,
          display: cs.display,
          color: cs.color,
          fill: cs.fill,
          stroke: cs.stroke,
          parent: s.parentElement ? s.parentElement.tagName + '.' + s.parentElement.className.substring(0, 30) : null
        };
      });
      const buttons = Array.from(p.querySelectorAll('button, a')).map(b => ({
        tag: b.tagName,
        text: b.innerText.trim(),
        classes: b.className,
        rect: b.getBoundingClientRect()
      }));
      return {
        panelIndex: idx,
        svgs,
        buttons
      };
    });
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

checkHomepageIcons().catch(console.error);
