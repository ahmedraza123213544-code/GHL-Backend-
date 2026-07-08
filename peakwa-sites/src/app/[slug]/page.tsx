import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_BASE_URL } from '@/src/config/config';
import { Phone } from 'lucide-react';
import { CtaBanner } from '@/src/components/CtaBanner';
import { LocalBusinessSchema } from '@/src/components/SchemaMarkup';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { SiteImage } from '@/src/components/SiteImage';
import { getSiteBySlug } from '@/src/lib/api';
import { parseJson, type HomeContent } from '@/src/lib/content';
import { getIcon } from '@/src/lib/iconMap';
import { getSiteImages } from '@/src/lib/images';
import { darkenHex, getTextColor, hexToRgb, resolveTheme } from '@/src/lib/theme';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return {};

  const home = parseJson<HomeContent>(site.homeContent, {});

  return {
    title: home?.seo?.title || `${site.businessName} | ${site.city}, ${site.state}`,
    description:
      home?.seo?.metaDescription ||
      `${site.businessName} serving ${site.city} ${site.state}`,
    alternates: { canonical: `${SITE_BASE_URL}/${site.slug}` },
    robots: { index: false, follow: false },
  };
}

function colorWithOpacity(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default async function HomePage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const images = await getSiteImages(slug);
  const content = parseJson<HomeContent>(site.homeContent, {});
  const theme = resolveTheme(site);
  const hero = content.hero ?? {};
  const about = content.about ?? {};
  const services = content.services ?? [];
  const homeServices = services.length > 6 ? services.slice(0, 6) : services;
  const whyChooseUs = content.whyChooseUs ?? [];
  const cta = content.cta ?? {};

  const heroDark = theme.heroStyle === 'dark';
  const heroBg = heroDark
    ? `linear-gradient(135deg, ${theme.primaryColor}, ${darkenHex(theme.primaryColor, 0.2)})`
    : theme.secondaryColor;
  const heroText = heroDark ? '#FFFFFF' : getTextColor(theme.secondaryColor);
  const heroOverlay = heroDark
    ? `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)`
    : `radial-gradient(circle at 20% 50%, rgba(0,0,0,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.03) 0%, transparent 50%)`;

  return (
    <>
      <LocalBusinessSchema site={site} />
      <section
        className="relative flex min-h-screen items-center overflow-hidden"
        style={
          images.hero
            ? { color: '#FFFFFF' }
            : { background: heroBg, color: heroText }
        }
      >
        {images.hero ? (
          <>
            <div className="absolute inset-0">
              <SiteImage
                src={images.hero}
                alt={`${site.businessName} hero background`}
                fill
                className="object-cover"
                priority
                fallback={
                  <div className="h-full w-full" style={{ background: heroBg }} />
                }
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: colorWithOpacity(theme.primaryColor, 0.7) }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: heroOverlay }} />
            <div
              className={
                heroDark ? 'hero-pattern absolute inset-0' : 'hero-pattern-light absolute inset-0'
              }
            />
          </>
        )}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl animate-fade-up">
            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
              {hero.heading || `Welcome to ${site.businessName}`}
            </h1>
            <p className="mt-6 text-xl opacity-80 md:text-2xl">
              {hero.subheading || `Serving ${site.city}, ${site.state} with pride.`}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={`/${slug}/contact`}
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-bold shadow-lg transition hover:scale-105"
                style={{
                  backgroundColor: theme.accentColor,
                  color: getTextColor(theme.accentColor),
                }}
              >
                {hero.ctaButton || 'Get Started'}
              </Link>
              {site.phone ? (
                <a
                  href={`tel:${site.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-semibold transition hover:bg-white/10"
                  style={{ borderColor: heroText, color: images.hero ? '#FFFFFF' : heroText }}
                >
                  <Phone className="h-4 w-4" />
                  {site.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <SectionWrapper
        background="#fff"
        className="py-24"
        style={{ borderTop: `4px solid ${theme.accentColor}` }}
      >
        <div className="grid items-center gap-12 md:grid-cols-2">
          {images.about ? (
            <div className="relative h-[300px] w-full overflow-hidden rounded-3xl md:h-full md:min-h-[420px]">
              <SiteImage
                src={images.about}
                alt={`About ${site.businessName}`}
                fill
                className="object-cover"
                fallback={
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: colorWithOpacity(theme.accentColor, 0.15) }}
                  />
                }
              />
            </div>
          ) : (
            <div className="relative h-64 md:h-80">
              <div
                className="absolute inset-4 rounded-3xl"
                style={{ backgroundColor: colorWithOpacity(theme.accentColor, 0.15) }}
              />
              <div
                className="absolute bottom-0 right-0 h-40 w-40 rounded-2xl"
                style={{ backgroundColor: theme.accentColor }}
              />
              <div
                className="absolute left-6 top-6 h-24 w-24 rounded-full border-4 bg-white"
                style={{ borderColor: theme.primaryColor }}
              />
              <div
                className="absolute bottom-12 left-12 h-16 w-16 rotate-45 rounded-lg"
                style={{ backgroundColor: colorWithOpacity(theme.primaryColor, 0.3) }}
              />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {about.heading || 'About Us'}
            </h2>
            <div
              className="my-6 h-1 w-16 rounded-full"
              style={{ backgroundColor: theme.accentColor }}
            />
            <p className="text-lg leading-relaxed text-gray-600">
              {about.paragraph1 || site.description}
            </p>
            <div
              className="my-6 h-px w-full"
              style={{ backgroundColor: colorWithOpacity(theme.accentColor, 0.35) }}
            />
            <p className="text-lg leading-relaxed text-gray-600">
              {about.paragraph2 || `Proudly serving ${site.city} and nearby communities.`}
            </p>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper background={theme.secondaryColor} className="py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((service, i) => (
            <article
              key={`${service.title}-${i}`}
              className="overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderTop: `4px solid ${theme.accentColor}` }}
            >
              {images.services[i] ? (
                <div className="relative h-[180px] w-full overflow-hidden rounded-t-xl">
                  <SiteImage
                    src={images.services[i]!}
                    alt={`${service.title} service`}
                    fill
                    className="object-cover"
                    fallback={
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ backgroundColor: colorWithOpacity(theme.primaryColor, 0.2) }}
                      >
                        <span style={{ color: theme.accentColor }}>
                          {getIcon(service.icon || 'wrench', 'w-8 h-8')}
                        </span>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 items-center justify-center"
                  style={{ backgroundColor: colorWithOpacity(theme.primaryColor, 0.2) }}
                >
                  <span style={{ color: theme.accentColor }}>
                    {getIcon(service.icon || 'wrench', 'w-8 h-8')}
                  </span>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-3 text-gray-600">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper background="#fff" className="py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-4 text-lg text-gray-600">
              {site.businessName} delivers dependable {site.industry} service with a personal touch.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {whyChooseUs.map((item, i) => (
              <div key={`${item.point}-${i}`} className="rounded-xl border border-gray-100 p-6">
                <div className="flex items-start gap-3">
                  <span className="shrink-0" style={{ color: theme.accentColor }}>
                    {getIcon('check-circle', 'w-5 h-5')}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{item.point}</p>
                    <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <CtaBanner
        site={site}
        heading={cta.heading || `Ready to work with ${site.businessName}?`}
        subtext={cta.subtext}
        buttonText={cta.buttonText}
      />
    </>
  );
}
