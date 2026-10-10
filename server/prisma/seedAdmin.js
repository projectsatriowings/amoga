import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/adminAuth.js';

async function seedAdmin() {
  console.log('--- SEEDING ADMIN USERS & STORE DEFAULTS ---');

  const defaultAdmins = [
    {
      email: 'admin@amoga.com',
      name: 'Amoga Super Admin',
      password: 'Admin@Amoga2026!',
      role: 'SUPER_ADMIN',
    },
    {
      email: 'catalogue@amoga.com',
      name: 'Priya Sharma (Catalogue Lead)',
      password: 'Catalogue@Amoga2026!',
      role: 'CATALOGUE_MANAGER',
    },
    {
      email: 'orders@amoga.com',
      name: 'Vikram Mehta (Fulfilment Lead)',
      password: 'Orders@Amoga2026!',
      role: 'ORDER_MANAGER',
    },
    {
      email: 'content@amoga.com',
      name: 'Ananya Roy (Content Lead)',
      password: 'Content@Amoga2026!',
      role: 'CONTENT_MANAGER',
    },
  ];

  for (const admin of defaultAdmins) {
    const passwordHash = hashPassword(admin.password);
    const user = await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: admin.role,
        isActive: true,
      },
      create: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        role: admin.role,
        isActive: true,
      },
    });
    console.log(`✓ Admin user configured: ${user.email} (${user.role})`);
  }

  // 2. Default Store Settings
  const settings = await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Amoga Luxury Atelier',
      contactEmail: 'concierge@amoga.com',
      contactPhone: '+91 98200 12345',
      shippingStandardRate: 0.0,
      freeShippingThreshold: 2500.0,
      taxPercentage: 5.0,
      enableOrderNotifications: true,
      enableInventoryAlerts: true,
    },
  });
  console.log(`✓ Store settings initialized: ${settings.storeName}`);

  // 3. Default Banners for Homepage CMS
  const existingBanners = await prisma.banner.count();
  if (existingBanners === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'The Royal Harvest of Kashmir & Malabar',
          subtitle: 'Pure single-origin spices, cold-pressed elixirs & sacred botanical harvests.',
          imageUrl: '/images/food/hero-spice.jpg',
          mobileImageUrl: '/images/food/hero-spice-mobile.jpg',
          ctaLabel: 'Explore Gourmet Food',
          ctaLink: '/food',
          displayOrder: 1,
          isPublished: true,
        },
        {
          title: 'Artisanal Botanical Teas',
          subtitle: 'Documented traditional infusions, whole floral calyces & single-estate herbs.',
          imageUrl: '/images/tea/tea-hero.jpg',
          mobileImageUrl: '/images/tea/tea-hero-mobile.jpg',
          ctaLabel: 'Discover Herbal Teas',
          ctaLink: '/tea',
          displayOrder: 2,
          isPublished: true,
        },
        {
          title: 'Kanchipuram & Banarasi Masterpieces',
          subtitle: 'Hand-loomed in pure mulberry silk with real zari borders by seventh-generation weavers.',
          imageUrl: '/images/sarees/hero-saree.jpg',
          mobileImageUrl: '/images/sarees/hero-saree-mobile.jpg',
          ctaLabel: 'View Heritage Sarees',
          ctaLink: '/sarees',
          displayOrder: 3,
          isPublished: true,
        },
        {
          title: 'Hallmarked 925 Sterling Silver',
          subtitle: 'Sculptural elegance crafted with precision gemstones and timeless motifs.',
          imageUrl: '/images/jewellery/hero-jewellery.jpg',
          mobileImageUrl: '/images/jewellery/hero-jewellery-mobile.jpg',
          ctaLabel: 'Shop Silver Jewellery',
          ctaLink: '/jewellery',
          displayOrder: 4,
          isPublished: true,
        },
      ],
    });
    console.log('✓ Initial homepage CMS banners created');
  }

  // 4. Default Coupons
  const existingCoupons = await prisma.coupon.count();
  if (existingCoupons === 0) {
    await prisma.coupon.createMany({
      data: [
        {
          code: 'WELCOME10',
          discountType: 'PERCENTAGE',
          discountValue: 10.0,
          minOrderAmount: 1000.0,
          maxDiscountAmount: 500.0,
          usageLimit: 500,
          isActive: true,
        },
        {
          code: 'FESTIVE500',
          discountType: 'FIXED',
          discountValue: 500.0,
          minOrderAmount: 4000.0,
          usageLimit: 200,
          isActive: true,
        },
      ],
    });
    console.log('✓ Initial promotional coupons seeded');
  }

  console.log('--- ADMIN SEED COMPLETE ---');
}

seedAdmin()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
