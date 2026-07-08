import Script from 'next/script'

export function LocalBusinessSchema({ site }: { site: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.businessName,
    description: site.description || '',
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.state,
      addressCountry: 'US',
    },
    telephone: site.phone || '',
    email: site.email || '',
    url: `${process.env.NEXT_PUBLIC_SITE_BASE_URL || 'https://site.peakwa.com'}/${site.slug}`,
  }
  return (
    <Script id='local-business-schema' type='application/ld+json'>
      {JSON.stringify(schema)}
    </Script>
  )
}

export function ServiceSchema({ businessName, services }: { businessName: string, services: any[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: { '@type': 'LocalBusiness', name: businessName },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${businessName} Services`,
      itemListElement: services.map((s, i) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.shortDescription || s.description || '',
        },
        position: i + 1,
      })),
    },
  }
  return (
    <Script id='service-schema' type='application/ld+json'>
      {JSON.stringify(schema)}
    </Script>
  )
}

export function FAQSchema({ faqs }: { faqs: { question: string, answer: string }[] }) {
  if (!faqs || faqs.length === 0) return null
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
  return (
    <Script id='faq-schema' type='application/ld+json'>
      {JSON.stringify(schema)}
    </Script>
  )
}

export function ArticleSchema({ title, excerpt, businessName, slug, postIndex }: { title: string, excerpt: string, businessName: string, slug: string, postIndex: number }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    author: { '@type': 'Organization', name: businessName },
    publisher: { '@type': 'Organization', name: businessName },
    url: `${process.env.NEXT_PUBLIC_SITE_BASE_URL || 'https://site.peakwa.com'}/${slug}/blog/${postIndex}`,
  }
  return (
    <Script id='article-schema' type='application/ld+json'>
      {JSON.stringify(schema)}
    </Script>
  )
}
