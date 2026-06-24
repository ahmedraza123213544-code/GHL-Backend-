import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { HeroBanner } from '@/src/components/HeroBanner';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { SiteImage } from '@/src/components/SiteImage';
import { getSiteBySlug } from '@/src/lib/api';
import { parseJson, type BlogContent } from '@/src/lib/content';
import { getSiteImages } from '@/src/lib/images';
import { getTextColor, hexToRgb, resolveTheme } from '@/src/lib/theme';

type PageProps = { params: Promise<{ slug: string }> };

function colorWithOpacity(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const images = await getSiteImages(slug);
  const content = parseJson<BlogContent>(site.blogContent, {});
  const theme = resolveTheme(site);
  const posts = content.posts ?? [];

  return (
    <>
      <HeroBanner
        site={site}
        heroImage={images.hero}
        title="Blog"
        subtitle={`Insights and updates from ${site.businessName}`}
      >
        <Breadcrumbs site={site} items={[{ label: 'Blog' }]} />
      </HeroBanner>

      <SectionWrapper background={theme.secondaryColor}>
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((post, index) => (
            <article
              key={`${post.title}-${index}`}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderBottom: `4px solid ${theme.accentColor}` }}
            >
              {images.blog[index] ? (
                <div className="relative h-[200px] w-full overflow-hidden rounded-t-xl">
                  <SiteImage
                    src={images.blog[index]!}
                    alt={`${post.title} blog post`}
                    fill
                    className="object-cover"
                    fallback={
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: colorWithOpacity(theme.primaryColor, 0.15) }}
                      />
                    }
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <span
                  className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: theme.accentColor,
                    color: getTextColor(theme.accentColor),
                  }}
                >
                  {post.category || 'News'}
                </span>
                <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                <p className="mt-3 flex-1 text-gray-600">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {post.readTime || '5 min read'}
                </div>
                <Link
                  href={`/${slug}/blog/${index}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: theme.accentColor }}
                >
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
