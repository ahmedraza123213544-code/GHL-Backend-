import { Mail, MapPin, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { ContactForm } from '@/src/components/ContactForm';
import { HeroBanner } from '@/src/components/HeroBanner';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { getSiteBySlug } from '@/src/lib/api';
import { parseJson, type ContactContent } from '@/src/lib/content';
import { getSiteImages } from '@/src/lib/images';
import { getTextColor, resolveTheme } from '@/src/lib/theme';

type PageProps = { params: Promise<{ slug: string }> };

export default async function ContactPage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const images = await getSiteImages(slug);
  const content = parseJson<ContactContent>(site.contactContent, {});
  const theme = resolveTheme(site);

  return (
    <>
      <HeroBanner
        site={site}
        heroImage={images.hero}
        title={content.hero?.heading || 'Contact Us'}
        subtitle={content.hero?.subheading || content.intro}
      >
        <Breadcrumbs site={site} items={[{ label: 'Contact' }]} />
      </HeroBanner>

      <SectionWrapper background="#fff" className="py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm site={site} heading={content.formHeading || 'Get in touch'} />
          </div>
          <aside
            className="rounded-3xl p-8 shadow-xl lg:col-span-2"
            style={{
              backgroundColor: theme.primaryColor,
              color: getTextColor(theme.primaryColor),
            }}
          >
            <h2 className="text-2xl font-bold">{site.businessName}</h2>
            <ul className="mt-8 space-y-5 text-sm">
              {site.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <a href={`tel:${site.phone}`}>{site.phone}</a>
                </li>
              ) : null}
              {site.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
              ) : null}
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5" />
                <span>
                  {site.city}, {site.state}
                </span>
              </li>
            </ul>
            {content.hoursSection ? (
              <div className="mt-8 border-t border-white/20 pt-6">
                <p className="font-semibold">{content.hoursSection.heading}</p>
                <p className="mt-2 text-sm opacity-90">{content.hoursSection.description}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </SectionWrapper>

      <SectionWrapper background={theme.secondaryColor} className="py-20">
        <div
          className="flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
          style={{
            backgroundColor: '#f3f4f6',
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          <MapPin className="h-12 w-12" style={{ color: theme.accentColor }} />
          <p className="mt-4 text-lg font-semibold text-gray-800">
            {site.city}, {site.state}
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            {content.addressSection?.heading || `Visit ${site.businessName} in ${site.city}`}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.city}, ${site.state}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-90"
            style={{
              backgroundColor: theme.accentColor,
              color: getTextColor(theme.accentColor),
            }}
          >
            <MapPin className="h-4 w-4" />
            View on Google Maps
          </a>
        </div>
      </SectionWrapper>
    </>
  );
}
