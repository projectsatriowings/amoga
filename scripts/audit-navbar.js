import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\aaaa1961-8768-4292-842a-0bd4613aa28b';

async function auditPage(url, name) {
  console.log(`\n================= AUDITING ${name}: ${url} =================`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot of top portion (header & hero)
    const screenshotPath = path.join(ARTIFACT_DIR, `${name}-header.png`);
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1440, height: 400 } });
    console.log(`Saved screenshot to ${screenshotPath}`);

    // Inspect header elements and computed styles
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return { error: 'No header found' };

      const announcement = header.querySelector('div:first-child');
      const logoImg = header.querySelector('img[alt*="AMOGA"], img[alt*="Portal"], img');
      const tagline = header.querySelector('span.border-l, span.font-serif, span.italic');
      const navLinks = Array.from(header.querySelectorAll('nav a, nav button')).map(el => ({
        text: el.innerText.trim(),
        tag: el.tagName,
        href: el.getAttribute('href')
      }));
      const searchInput = header.querySelector('input[type="text"]');
      const buttons = Array.from(header.querySelectorAll('button, a')).map(el => ({
        tag: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        text: el.innerText.trim()
      }));

      const getStyles = (el) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          padding: cs.padding,
          margin: cs.margin
        };
      };

      return {
        headerStyles: getStyles(header),
        announcementText: announcement ? announcement.innerText.trim() : null,
        announcementStyles: getStyles(announcement),
        logoSrc: logoImg ? logoImg.getAttribute('src') : null,
        logoStyles: getStyles(logoImg),
        taglineText: tagline ? tagline.innerText.trim() : null,
        taglineStyles: getStyles(tagline),
        navLinks,
        hasSearchInput: !!searchInput,
        searchStyles: getStyles(searchInput),
        allButtonLabels: buttons.map(b => b.ariaLabel || b.text).filter(Boolean)
      };
    });

    console.log('Audit Results for', name, ':\n', JSON.stringify(headerInfo, null, 2));
    return headerInfo;
  } finally {
    await browser.close();
  }
}

async function run() {
  const local = await auditPage('http://localhost:5173/sarees', 'local-sarees');
  const live = await auditPage('https://amogastores.com/sarees', 'live-sarees');
  
  console.log('\n================= SIDE-BY-SIDE DIFFERENCES =================');
  console.log('Announcement Text:');
  console.log('  Local:', local.announcementText);
  console.log('  Live: ', live.announcementText);
  console.log('Tagline Text:');
  console.log('  Local:', local.taglineText);
  console.log('  Live: ', live.taglineText);
  console.log('Header Height:');
  console.log('  Local:', local.headerStyles?.height, 'Live:', live.headerStyles?.height);
  console.log('Logo Height / Width:');
  console.log('  Local:', `${local.logoStyles?.width}x${local.logoStyles?.height}`, 'Live:', `${live.logoStyles?.width}x${live.logoStyles?.height}`);
  console.log('Search Box:');
  console.log('  Local:', local.searchStyles ? `${local.searchStyles.width}x${local.searchStyles.height}` : 'None');
  console.log('  Live: ', live.searchStyles ? `${live.searchStyles.width}x${live.searchStyles.height}` : 'None');
  console.log('Nav Links:');
  console.log('  Local:', local.navLinks?.map(l => l.text).join(' | '));
  console.log('  Live: ', live.navLinks?.map(l => l.text).join(' | '));
}

run().catch(console.error);
