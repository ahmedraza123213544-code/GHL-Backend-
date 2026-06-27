import type { MetadataRoute } from 'next';

type RobotsProps = {
  params: Promise<{ slug: string }>;
};

export default async function robots({ params }: RobotsProps): Promise<MetadataRoute.Robots> {
  const { slug } = await params;
  const baseUrl = `${process.env.NEXT_PUBLIC_SITE_BASE_URL || 'https://site.peakwa.com'}/${slug}`;

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
