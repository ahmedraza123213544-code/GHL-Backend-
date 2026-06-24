import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { ContactForm } from '@/src/components/ContactForm';
import { CtaBanner } from '@/src/components/CtaBanner';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { getLocationPages, getSiteBySlug } from '@/src/lib/api';
import { parseJson, type LocationContent } from '@/src/lib/content';
import { getTextColor, resolveTheme } from '@/src/lib/theme';

type PageProps = { params: Promise<{ slug: string; locationSlug: string }> };

export default async function LocationPage({ params }: PageProps) {
  const { slug, locationSlug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const pages = await getLocationPages(slug);
  const page = pages.find((p) => p.slug === locationSlug);
  if (!page) notFound();

  const content = parseJson<LocationContent>(page.content, {});
  const theme = resolveTheme(site);

  return (
    <>
      <section
        className="py-20 md:py-28"
        style={{ backgroundColor: theme.primaryColor, color: getTextColor(theme.primaryColor) }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            site={site}
            items={[{ label: `${page.city}, ${page.county} County` }]}
          />
          <h1 className="text-4xl font-bold md:text-5xl">
            {content.hero?.heading || `${site.businessName} in ${page.city}`}
          </h1>
          <p className="mt-4 max-w-2xl text-lg opacity-90">{content.hero?.subheading}</p>
        </div>
      </section>

      <SectionWrapper background="#fff">
        <div className="mx-auto max-w-3xl space-y-8 text-lg leading-relaxed text-gray-600">
          <p>{content.localIntro}</p>
          <p>{content.whyLocal}</p>
          <p>{content.serviceArea}</p>
        </div>
      </SectionWrapper>

      <CtaBanner
        site={site}
        heading={content.cta?.heading || `Serving ${page.city} and ${page.county} County`}
        buttonText={content.cta?.buttonText}
      />

      <SectionWrapper background={theme.secondaryColor}>
        <div className="mx-auto max-w-2xl">
          <ContactForm site={site} heading={`Contact us in ${page.city}`} />
        </div>
      </SectionWrapper>
    </>
  );
}
