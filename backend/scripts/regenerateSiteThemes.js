import prisma from '../src/database/client.js';
import { generateSiteTheme } from '../src/services/siteGenerator.service.js';

const DEFAULT_PRIMARY = '#1F2937';
const DEFAULT_ACCENT = '#6366F1';

async function main() {
  const sites = await prisma.generatedSite.findMany({ orderBy: { createdAt: 'asc' } });

  if (sites.length === 0) {
    console.log('No generated sites found.');
    return;
  }

  for (const site of sites) {
    const hasCustomTheme =
      site.primaryColor !== DEFAULT_PRIMARY || site.accentColor !== DEFAULT_ACCENT;

    if (hasCustomTheme) {
      console.log(`Skip ${site.businessName} — already has custom theme (${site.primaryColor})`);
      continue;
    }

    console.log(`Regenerating theme for ${site.businessName} (${site.industry})...`);
    const theme = await generateSiteTheme(site.businessName, site.industry, site.city);

    await prisma.generatedSite.update({
      where: { id: site.id },
      data: {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        heroStyle: theme.heroStyle,
        fontStyle: theme.fontStyle,
      },
    });

    console.log(`  → primary ${theme.primaryColor}, accent ${theme.accentColor}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
