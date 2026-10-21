import { prisma } from '../src/config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRestore() {
  console.log('=== RUNNING ISOLATED RESTORE VERIFICATION TEST ===');
  const backupDir = path.resolve(__dirname, '../backups/pre_cleanup_2026-10-21_16-34-46');
  const snapshotPath = path.join(backupDir, 'complete_database_snapshot.json');

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found: ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  const testSchema = 'amoga_backup_validation';

  console.log(`[TEST RESTORE]: Creating isolated validation schema "${testSchema}"...`);
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${testSchema}";`);

  try {
    // Test restoring representative core tables: collections, products, orders, payments
    const testTables = ['collections', 'products', 'orders', 'payments'];

    for (const table of testTables) {
      console.log(`[TEST RESTORE]: Replicating table structure for "${table}" into "${testSchema}"...`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "${testSchema}"."${table}" (LIKE "public"."${table}" INCLUDING DEFAULTS);
      `);

      const rows = snapshot[table] || [];
      console.log(`[TEST RESTORE]: Restoring ${rows.length} rows into "${testSchema}"."${table}"...`);

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const quotedCols = columns.map((c) => `"${c}"`).join(', ');

        for (const row of rows.slice(0, 50)) { // Verify batch of rows
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return String(val);
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');

          await prisma.$executeRawUnsafe(`
            INSERT INTO "${testSchema}"."${table}" (${quotedCols}) VALUES (${values});
          `);
        }
      }

      const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${testSchema}"."${table}";`);
      const insertedCount = countRes[0]?.count || 0;
      console.log(`[TEST RESTORE SUCCESS]: Table "${testSchema}"."${table}" restored and verified with ${insertedCount} sampled rows.`);
    }

    console.log('\n[VERIFICATION RESULT]: Isolated schema restoration succeeded with zero errors!');
  } finally {
    console.log(`[TEST RESTORE]: Cleaning up temporary isolated validation schema "${testSchema}"...`);
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
    console.log(`[TEST RESTORE]: Temporary schema dropped cleanly. Public database remains untouched.`);
  }

  await prisma.$disconnect();
}

testRestore().catch(async (err) => {
  console.error('[TEST RESTORE FAILURE]:', err);
  await prisma.$disconnect();
  process.exit(1);
});
