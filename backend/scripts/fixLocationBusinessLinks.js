/**
 * Fixes swapped business ↔ GHL location links in existing DB (no data wipe).
 * Run: node scripts/fixLocationBusinessLinks.js
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/** GHL location id → business (must match GHL URLs and dashboard config) */
const CANONICAL = [
  {
    ghlLocationId: 'NDYfMNSuMjNJz3N2CjPd',
    businessName: 'Bergen Car Company',
    ghlAccountId: 'bergen-car',
  },
  {
    ghlLocationId: '4diJ9Q8sTqY55I5ihUD7',
    businessName: '551 HVAC',
    ghlAccountId: '551-hvac',
  },
  {
    ghlLocationId: 'cFaTJXAmUqSLpoaxQ2fn',
    businessName: 'Biz Solutions INC',
    ghlAccountId: 'biz-solutions',
  },
];

async function main() {
  console.log('Linking each GHL location to the correct business...\n');

  for (const row of CANONICAL) {
    let business = await prisma.business.findFirst({
      where: { ghlAccountId: row.ghlAccountId },
    });

    if (!business) {
      business = await prisma.business.findFirst({
        where: { name: row.businessName },
      });
    }

    if (!business) {
      console.warn(`  SKIP: no business row for ${row.businessName}`);
      continue;
    }

    const location = await prisma.location.findFirst({
      where: { ghlLocationId: row.ghlLocationId },
      include: { business: { select: { name: true } } },
    });

    if (!location) {
      console.warn(`  SKIP: no location for GHL id ${row.ghlLocationId}`);
      continue;
    }

    if (location.businessId === business.id) {
      console.log(`  OK: ${row.businessName} already linked to ${row.ghlLocationId}`);
      continue;
    }

    await prisma.location.update({
      where: { id: location.id },
      data: { businessId: business.id },
    });

    console.log(
      `  FIXED: ${location.id} | GHL ${row.ghlLocationId} | was "${location.business.name}" → now "${row.businessName}"`,
    );
  }

  console.log('\nCurrent mapping:');
  const locations = await prisma.location.findMany({
    include: { business: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  for (const loc of locations) {
    console.log(`  ${loc.business.name} | ${loc.ghlLocationId} | ${loc.id}`);
  }

  console.log('\nFixing post content that mentions the wrong business name...');
  let postsUpdated = 0;
  for (const row of CANONICAL) {
    const location = await prisma.location.findFirst({
      where: { ghlLocationId: row.ghlLocationId },
    });
    if (!location) continue;

    const wrongNames = CANONICAL.filter((r) => r.businessName !== row.businessName).map(
      (r) => r.businessName,
    );

    const posts = await prisma.post.findMany({
      where: { locationId: location.id },
      select: { id: true, content: true },
    });

    for (const post of posts) {
      let content = post.content;
      let changed = false;
      for (const wrong of wrongNames) {
        if (content.includes(wrong)) {
          content = content.split(wrong).join(row.businessName);
          changed = true;
        }
      }
      if (changed) {
        await prisma.post.update({
          where: { id: post.id },
          data: { content },
        });
        postsUpdated += 1;
      }
    }
  }
  console.log(`  Updated ${postsUpdated} post(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
