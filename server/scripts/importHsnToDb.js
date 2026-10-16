import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERIFIED_RATE_MASTER_SEEDS = [
  {
    hsnCode: '5007',
    description: 'Woven fabrics of silk or of silk waste (including Mulberry silk sarees, bridal silk drapes)',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule I, Sl. No. 201',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Silk sarees (handloom or powerloom), value irrespective of per-piece ceiling under Notification No. 14/2021-CT(R)'
  },
  {
    hsnCode: '50072010',
    description: 'Sarees of silk or silk waste, handloom',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule I',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Kanchipuram, Banarasi pure silk handloom sarees'
  },
  {
    hsnCode: '5208',
    description: 'Woven fabrics of cotton, containing 85% or more by weight of cotton (including Cotton Sarees)',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule I, Sl. No. 205',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Pure cotton woven sarees and textile drapes'
  },
  {
    hsnCode: '7113',
    description: 'Articles of jewellery and parts thereof, of precious metal or of metal clad with precious metal (including BIS 925 Sterling Silver Jewellery)',
    gstRate: 3.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule V, Sl. No. 13',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'BIS Hallmarked 925 sterling silver rings, necklaces, earrings, and pendants'
  },
  {
    hsnCode: '71131120',
    description: 'Silver jewellery set with gems',
    gstRate: 3.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule V, Sl. No. 13',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Gemstone studded sterling silver pendants and rings'
  },
  {
    hsnCode: '0902',
    description: 'Tea, whether or not flavoured (including green tea, black tea, flavoured artisanal infusions)',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule I, Sl. No. 43',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Single estate loose leaf teas and blended teas'
  },
  {
    hsnCode: '2106',
    description: 'Food preparations not elsewhere specified or included (including herbal infusions, botanical teas, nutraceutical powders)',
    gstRate: 18.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule III, Sl. No. 23',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Herbal & root brews, Ayurvedic nutritional powder mixes'
  },
  {
    hsnCode: '2104',
    description: 'Soups and broths and preparations therefor; homogenised composite food preparations',
    gstRate: 18.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule III, Sl. No. 21',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Dehydrated ready-to-cook vegetable, moringa, and lentil soup mixes'
  },
  {
    hsnCode: '1008',
    description: 'Buckwheat, millet and canary seeds; other cereals (pre-packaged and labelled)',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 06/2022-Central Tax (Rate), Schedule I, Sl. No. 56',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Barnyard, Foxtail, Kodo, Little and Finger millets in branded consumer packaging'
  },
  {
    hsnCode: '2103',
    description: 'Sauces and preparations therefor; mixed condiments and mixed seasonings (including traditional rice podis)',
    gstRate: 12.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule II, Sl. No. 37',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Paruppu podi, Idli chilli powder, Curry leaf rice podi'
  },
  {
    hsnCode: '1513',
    description: 'Coconut, palm kernel or babassu oil and fractions thereof (Cold-pressed culinary oils)',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 01/2017-Central Tax (Rate), Schedule I, Sl. No. 90',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Edible cold-pressed unrefined coconut and vegetable oils'
  },
  {
    hsnCode: '0409',
    description: 'Natural honey, pre-packaged and labelled',
    gstRate: 5.00,
    taxTreatment: 'TAXABLE',
    cessRate: 0.00,
    officialSource: 'CBIC Notification No. 06/2022-Central Tax (Rate), Schedule I, Sl. No. 29',
    status: 'APPROVED',
    verifiedBy: 'tax-admin@amoga.com',
    verifiedAt: new Date('2026-10-16T12:00:00Z'),
    effectiveFrom: new Date('2026-04-01T00:00:00Z'),
    notes: 'Artisanal single-source wild forest honey in glass jars'
  }
];

async function main() {
  console.log('--- SEEDING GST RATE MASTER ---');
  for (const item of VERIFIED_RATE_MASTER_SEEDS) {
    const existing = await prisma.gstRateMaster.findFirst({
      where: {
        hsnCode: item.hsnCode,
        status: item.status
      }
    });

    if (existing) {
      await prisma.gstRateMaster.update({
        where: { id: existing.id },
        data: item
      });
      console.log(`Updated Rate Master: [${item.hsnCode}] ${item.gstRate}% - ${item.description.substring(0, 40)}`);
    } else {
      await prisma.gstRateMaster.create({
        data: item
      });
      console.log(`Created Rate Master: [${item.hsnCode}] ${item.gstRate}% - ${item.description.substring(0, 40)}`);
    }
  }

  console.log('\n--- SEEDING HSN REFERENCE CATALOGUE (FROM HSN_SAC.pdf) ---');
  const existingCount = await prisma.hsnReference.count();
  console.log('Current HsnReference table count:', existingCount);

  const datasetPath = path.resolve(__dirname, '../data/hsn_reference_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error('hsn_reference_dataset.json not found! Please run parseAllHsn.js first.');
    return;
  }

  const rawData = fs.readFileSync(datasetPath, 'utf8');
  const items = JSON.parse(rawData);
  console.log(`Read ${items.length} records from ${datasetPath}`);

  if (existingCount < items.length) {
    console.log('Populating HSN Reference table in chunks of 2500...');
    const chunkSize = 2500;
    // Clear any partial data to ensure clean idempotency
    await prisma.hsnReference.deleteMany({});
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize).map(item => ({
        hsnCode: item.hsnCode,
        description: item.description,
        level: item.type,
        codeLength: item.codeLength,
        sourceFileName: item.sourceFileName || 'HSN_SAC.pdf',
        importDate: new Date(item.importDate || Date.now()),
        sourcePage: item.sourcePage || null
      }));

      await prisma.hsnReference.createMany({
        data: chunk,
        skipDuplicates: true
      });
      console.log(`Inserted chunk ${i + 1} to ${Math.min(i + chunkSize, items.length)} of ${items.length}`);
    }
  } else {
    console.log('HsnReference table is already fully populated.');
  }

  const finalRef = await prisma.hsnReference.count();
  const finalRates = await prisma.gstRateMaster.count();
  console.log(`\nImport complete! Total HsnReference: ${finalRef}, Total GstRateMaster: ${finalRates}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
