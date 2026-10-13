import { prisma } from '../src/config/prisma.js';

async function backfillInquiries() {
  console.log('--- CHECKING HISTORICAL INQUIRIES IN AUDIT LOGS ---');
  const auditInquiries = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: 'CUSTOMER_INQUIRY' },
        { entityType: 'ContactInquiry' },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${auditInquiries.length} historical audit inquiry entries.`);

  let createdCount = 0;
  for (const log of auditInquiries) {
    const details = log.details || {};
    const ref = details.inquiryReference || log.entityId || `INQ-HIST-${log.id.slice(0, 8).toUpperCase()}`;

    const existing = await prisma.customerInquiry.findUnique({
      where: { reference: ref },
    });

    if (!existing) {
      await prisma.customerInquiry.create({
        data: {
          reference: ref,
          fullName: details.fullName || 'Anonymous Customer',
          email: details.email || log.adminEmail || 'customer@amoga.com',
          phone: details.phone || null,
          subject: details.subject || 'General Inquiry',
          message: details.message || 'Historical inquiry message preserved from audit log.',
          collectionId: details.collectionId || 'general',
          status: 'NEW',
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        },
      });
      createdCount++;
    }
  }

  console.log(`✓ Successfully backfilled ${createdCount} inquiries into customer_inquiries.`);
}

backfillInquiries()
  .catch((e) => {
    console.error('Backfill error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
