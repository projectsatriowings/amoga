import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mergeWithOverlap(baseStr, spillStr) {
  const cleanBase = baseStr.trimEnd();
  const cleanSpill = spillStr.trim();
  if (!cleanSpill) return cleanBase;

  // Find longest overlap between suffix of baseStr and prefix of spillStr (case-insensitive)
  const maxOverlap = Math.min(cleanBase.length, cleanSpill.length);
  for (let len = maxOverlap; len >= 4; len--) {
    const baseSuffix = cleanBase.slice(-len);
    const spillPrefix = cleanSpill.slice(0, len);
    if (baseSuffix.toLowerCase() === spillPrefix.toLowerCase()) {
      return cleanBase + cleanSpill.slice(len);
    }
  }

  // If cleanBase already ends with cleanSpill
  if (cleanBase.toLowerCase().endsWith(cleanSpill.toLowerCase())) {
    return cleanBase;
  }

  // If no overlap found, check if it should append with space
  return cleanBase + ' ' + cleanSpill;
}

async function extractAllHsn() {
  const startTime = Date.now();
  const pdfPath = path.resolve(__dirname, '../../HSN_SAC.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  console.log('Loading PDF...');
  const parser = new pdf.PDFParse({ data: dataBuffer });
  await parser.load();
  
  const info = await parser.getInfo();
  console.log('PDF loaded. Pages:', info.total);

  console.log('Extracting text from all pages...');
  const allText = await parser.getText();
  const pages = allText.pages;
  console.log(`Extracted text from ${pages.length} pages in ${(Date.now() - startTime) / 1000}s`);

  const VERTICAL_PAGES = 448;
  const NUM_BLOCKS = 15;

  // Step 1: Parse base records from pages 0..447
  const basePages = [];
  let totalBaseRecords = 0;

  for (let p = 0; p < VERTICAL_PAGES; p++) {
    const pageText = pages[p]?.text || '';
    const rawLines = pageText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const records = [];

    for (const line of rawLines) {
      if (line === 'HSN_CD HSN_Description') continue;

      const m = line.match(/^(\d{2,10})\s+(.*)$/);
      if (m) {
        records.push({
          code: m[1], // String with leading zeroes preserved
          desc: m[2].trim(),
          page: p + 1
        });
      } else {
        const onlyCode = line.match(/^(\d{2,10})$/);
        if (onlyCode) {
          records.push({
            code: onlyCode[1],
            desc: '',
            page: p + 1
          });
        }
      }
    }

    basePages.push(records);
    totalBaseRecords += records.length;
  }

  console.log(`Parsed ${totalBaseRecords} base records from ${VERTICAL_PAGES} pages.`);

  // Step 2: Stitch horizontal spill pages
  let totalStitched = 0;
  for (let p = 0; p < VERTICAL_PAGES; p++) {
    const pageRecords = basePages[p];
    if (!pageRecords || pageRecords.length === 0) continue;

    for (let b = 1; b < NUM_BLOCKS; b++) {
      const spillPageIndex = p + b * VERTICAL_PAGES;
      if (spillPageIndex >= pages.length) break;

      const spillText = pages[spillPageIndex]?.text?.trim();
      if (!spillText) continue;

      const spillLines = spillText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      for (const spillLine of spillLines) {
        let bestRec = null;
        let bestOverlap = 0;

        for (const rec of pageRecords) {
          const baseText = rec.desc;
          if (!baseText) continue;

          for (let len = Math.min(baseText.length, spillLine.length); len >= 4; len--) {
            const baseSuffix = baseText.slice(-len);
            const spillPrefix = spillLine.slice(0, len);
            if (baseSuffix.toLowerCase() === spillPrefix.toLowerCase()) {
              if (len > bestOverlap) {
                bestOverlap = len;
                bestRec = rec;
              }
            }
          }
        }

        if (bestRec && bestOverlap >= 4) {
          const newDesc = mergeWithOverlap(bestRec.desc, spillLine);
          if (newDesc !== bestRec.desc) {
            bestRec.desc = newDesc;
            totalStitched++;
          }
        }
      }
    }
  }

  console.log(`Stitched ${totalStitched} line continuations across horizontal pages.`);

  // Step 3: Flatten, deduplicate exact entries, retain parent & child codes
  const importDate = new Date().toISOString();
  const sourceFileName = 'HSN_SAC.pdf';

  // Map by composite key (code + normalized description) to eliminate exact duplicates
  const uniqueMap = new Map();
  let exactDuplicates = 0;

  for (const pageRecords of basePages) {
    for (const rec of pageRecords) {
      // Clean description whitespace
      const cleanDesc = rec.desc.replace(/\s+/g, ' ').trim();
      const key = `${rec.code}:::${cleanDesc.toLowerCase()}`;
      if (uniqueMap.has(key)) {
        exactDuplicates++;
      } else {
        uniqueMap.set(key, {
          hsnCode: rec.code,
          description: cleanDesc,
          codeLength: rec.code.length,
          type: rec.code.length === 2 ? 'CHAPTER' :
                rec.code.length === 4 ? 'HEADING' :
                rec.code.length === 6 ? 'SUBHEADING' :
                rec.code.length === 8 ? 'TARIFF_ITEM' : 'OTHER',
          sourceFileName,
          importDate,
          sourcePage: rec.page
        });
      }
    }
  }

  const structuredList = Array.from(uniqueMap.values());
  console.log(`Total structured reference records: ${structuredList.length} (exact duplicates removed: ${exactDuplicates})`);

  // Code length breakdown
  const countsByType = {};
  for (const item of structuredList) {
    countsByType[item.type] = (countsByType[item.type] || 0) + 1;
  }
  console.log('Breakdown by classification level:', countsByType);

  // Check specific test codes requested in requirements:
  // - Soup mix, millet mix, rice podi
  // - Herbal tea, hibiscus tea, botanical tea
  // - Silk saree, cotton saree
  // - Silver pendant, silver jewellery
  console.log('\n--- Checking sample target search terms in reference data ---');
  const testTerms = ['soup', 'millet', 'rice', 'tea', 'saree', 'silk', 'cotton', 'silver', 'jewellery'];
  for (const term of testTerms) {
    const hits = structuredList.filter(item => new RegExp(`\\b${term}`, 'i').test(item.description));
    console.log(`Term "${term}": ${hits.length} matching entries. Sample: [${hits[0]?.hsnCode}] ${hits[0]?.description.substring(0, 60)}`);
  }

  // Save parsed structured dataset as JSON for quick indexing / seed / database loading
  const outPath = path.resolve(__dirname, '../data/hsn_reference_dataset.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(structuredList, null, 2));
  console.log(`Saved structured dataset to ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)`);

  await parser.destroy();
}

extractAllHsn().catch(console.error);
