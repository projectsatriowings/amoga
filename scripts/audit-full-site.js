import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\aaaa1961-8768-4292-842a-0bd4613aa28b';

const ROUTES = [
  '/',
  '/food',
  '/food/products',
  '/tea',
  '/tea/products',
  '/sarees',
  '/sarees/products',
  '/jewellery',
  '/jewellery/products',
  '/cart',
  '/checkout',
  '/account',
  '/account/orders'
];

async function runSiteAudit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditReport = [];

  for (const r of ROUTES) {
    console.log(`\nAuditing route: ${r}`);
    const localUrl = `http://localhost:5173${r}`;
    const liveUrl = `https://amogastores.com${r}`;

    let localData = null;
    let liveData = null;

    // Check Local
    try {
      await page.goto(localUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(res => setTimeout(res, 1000));
      localData = await page.evaluate(() => {
        const header = document.querySelector('header');
        const announcement = header ? header.querySelector('div:first-child') : null;
        const navLinks = header ? Array.from(header.querySelectorAll('nav a, nav button')).map(el => el.innerText.trim()) : [];
        const hasSearch = header ? !!header.querySelector('input[type="text"]') : false;
        const logo = header ? header.querySelector('img') : null;
        const tagline = header ? header.querySelector('span.font-serif, span.border-l') : null;
        const h1 = document.querySelector('h1');
        return {
          hasHeader: !!header,
          headerHeight: header ? header.offsetHeight : 0,
          headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
          hasAnnouncement: !!announcement && announcement.offsetHeight > 0,
          announcementText: announcement ? announcement.innerText.trim() : null,
          announcementBg: announcement ? window.getComputedStyle(announcement).backgroundColor : null,
          taglineText: tagline ? tagline.innerText.trim() : null,
          navLinks,
          hasSearch,
          h1Text: h1 ? h1.innerText.trim() : null
        };
      });
    } catch(err) {
      localData = { error: err.message };
    }

    // Check Live
    try {
      await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(res => setTimeout(res, 1000));
      liveData = await page.evaluate(() => {
        const header = document.querySelector('header');
        const announcement = header ? header.querySelector('div:first-child') : null;
        const navLinks = header ? Array.from(header.querySelectorAll('nav a, nav button')).map(el => el.innerText.trim()) : [];
        const hasSearch = header ? !!header.querySelector('input[type="text"]') : false;
        const logo = header ? header.querySelector('img') : null;
        const tagline = header ? header.querySelector('span.font-serif, span.border-l') : null;
        const h1 = document.querySelector('h1');
        return {
          hasHeader: !!header,
          headerHeight: header ? header.offsetHeight : 0,
          headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
          hasAnnouncement: !!announcement && announcement.offsetHeight > 0,
          announcementText: announcement ? announcement.innerText.trim() : null,
          announcementBg: announcement ? window.getComputedStyle(announcement).backgroundColor : null,
          taglineText: tagline ? tagline.innerText.trim() : null,
          navLinks,
          hasSearch,
          h1Text: h1 ? h1.innerText.trim() : null
        };
      });
    } catch(err) {
      liveData = { error: err.message };
    }

    auditReport.push({
      route: r,
      local: localData,
      live: liveData
    });
  }

  await browser.close();

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'site_audit_report.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('\n=================== AUDIT SUMMARY ===================');
  for (const item of auditReport) {
    console.log(`\nRoute: ${item.route}`);
    if (item.local?.error || item.live?.error) {
      console.log('  Local Error:', item.local?.error);
      console.log('  Live Error: ', item.live?.error);
      continue;
    }
    console.log(`  Header Present: Local=${item.local?.hasHeader}, Live=${item.live?.hasHeader}`);
    console.log(`  Header Height:  Local=${item.local?.headerHeight}px, Live=${item.live?.headerHeight}px`);
    console.log(`  Announcement:   Local=${item.local?.hasAnnouncement} ("${item.local?.announcementText?.substring(0, 30)}..."), Live=${item.live?.hasAnnouncement}`);
    console.log(`  Tagline:        Local="${item.local?.taglineText}", Live="${item.live?.taglineText}"`);
    console.log(`  Nav Links:      Local=[${item.local?.navLinks?.join(', ')}], Live=[${item.live?.navLinks?.join(', ')}]`);
    console.log(`  Search Box:     Local=${item.local?.hasSearch}, Live=${item.live?.hasSearch}`);
  }
}

runSiteAudit().catch(console.error);
