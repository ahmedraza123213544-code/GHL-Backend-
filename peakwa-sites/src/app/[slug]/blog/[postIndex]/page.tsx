import Link from 'next/link';
import { Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { getSiteBySlug } from '@/src/lib/api';
import { parseJson, type BlogContent } from '@/src/lib/content';
import { getTextColor, resolveTheme } from '@/src/lib/theme';

type PageProps = { params: Promise<{ slug: string; postIndex: string }> };

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, postIndex } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const content = parseJson<BlogContent>(site.blogContent, {});
  const index = Number.parseInt(postIndex, 10);
  const post = content.posts?.[index];
  if (!post) notFound();

  const theme = resolveTheme(site);
  const paragraphs = (post.content || '').split(/\n\n+/).filter(Boolean);

  return (
    <>
      <SectionWrapper background="#fff">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            site={site}
            items={[
              { label: 'Blog', href: `/${slug}/blog` },
              { label: post.title || 'Article' },
            ]}
          />
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: theme.accentColor,
              color: getTextColor(theme.accentColor),
            }}
          >
            {post.category || 'News'}
          </span>
          <h1 className="mt-6 text-4xl font-bold text-gray-900 md:text-5xl">{post.title}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {post.readTime || '5 min read'}
          </p>
          <article className="prose prose-lg mt-10 max-w-none text-gray-700">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-6 leading-relaxed">
                {p}
              </p>
            ))}
          </article>
          <Link
            href={`/${slug}/blog`}
            className="mt-10 inline-flex text-sm font-semibold"
            style={{ color: theme.accentColor }}
          >
            ← Back to blog
          </Link>
        </div>
      </SectionWrapper>
    </>
  );
}
