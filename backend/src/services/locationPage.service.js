import prisma from '../database/client.js';
import { AppError } from '../utils/AppError.js';
import { getSchemaForIndustry } from './industrySchema.service.js';
import { generatePageContent } from './siteGenerator.service.js';

function slugify(...parts) {
  return parts
    .filter(Boolean)
    .join('-')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateLocations(locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new AppError('Field `locations` must be a non-empty array.', 400, {
      code: 'INVALID_BODY',
    });
  }

  return locations.map((loc, index) => {
    if (!loc || typeof loc !== 'object') {
      throw new AppError(`locations[${index}] must be an object.`, 400, { code: 'INVALID_BODY' });
    }

    const city = String(loc.city ?? '').trim();
    const county = String(loc.county ?? '').trim();
    const state = String(loc.state ?? 'NJ').trim() || 'NJ';

    if (!city) {
      throw new AppError(`locations[${index}].city is required.`, 400, { code: 'INVALID_BODY' });
    }
    if (!county) {
      throw new AppError(`locations[${index}].county is required.`, 400, { code: 'INVALID_BODY' });
    }

    return { city, county, state };
  });
}

export async function generateLocationPages(siteId, locations) {
  try {
    const site = await prisma.generatedSite.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new AppError('Generated site not found.', 404, { code: 'SITE_NOT_FOUND' });
    }

    const schema = await getSchemaForIndustry(site.industry);
    const validatedLocations = validateLocations(locations);
    const createdPages = [];

    for (const location of validatedLocations) {
      const pageSlug = slugify(location.city, `${location.county}-county`);

      const existing = await prisma.locationPage.findUnique({
        where: {
          siteId_slug: { siteId, slug: pageSlug },
        },
      });

      if (existing) {
        throw new AppError(
          `Location page already exists for slug "${pageSlug}".`,
          409,
          { code: 'LOCATION_PAGE_EXISTS' },
        );
      }

      const businessData = {
        businessName: site.businessName,
        industry: site.industry,
        city: location.city,
        state: location.state,
        county: location.county,
        phone: site.phone,
        email: site.email,
        description: site.description,
      };

      const contextNote = `This is a location landing page for ${location.city}, ${location.county} County, ${location.state}. The main business is based in ${site.city}, ${site.state}. Mention ${location.city} and local community details naturally.`;

      const generated = await generatePageContent(
        businessData,
        schema.locationPageSchema,
        schema.systemPrompt,
        'location',
        contextNote,
      );

      const page = await prisma.locationPage.create({
        data: {
          siteId,
          city: location.city,
          county: location.county,
          state: location.state,
          slug: pageSlug,
          content: JSON.stringify(generated),
        },
      });

      createdPages.push(page);

      console.info(
        JSON.stringify({
          event: 'location_page_generated',
          siteId,
          pageId: page.id,
          slug: page.slug,
          city: location.city,
          county: location.county,
          industrySchema: schema.industry,
        }),
      );
    }

    return createdPages;
  } catch (e) {
    if (e instanceof AppError) {
      throw e;
    }

    console.error(
      JSON.stringify({
        event: 'location_pages_generate_failed',
        siteId,
        error: e?.message ?? String(e),
      }),
    );

    throw new AppError(e?.message ?? 'Failed to generate location pages.', 502, {
      code: 'LOCATION_PAGE_GENERATION_FAILED',
    });
  }
}
