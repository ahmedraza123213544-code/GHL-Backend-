'use client';

import Image from 'next/image';
import { useState } from 'react';

type SiteImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
};

export function SiteImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  fallback,
  priority,
  sizes,
}: SiteImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <>{fallback ?? null}</>;
  }

  const sharedProps = {
    src,
    alt,
    className,
    priority,
    unoptimized: true,
    referrerPolicy: 'no-referrer' as const,
    onError: () => setError(true),
  };

  if (fill) {
    return (
      <Image
        {...sharedProps}
        fill
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      />
    );
  }

  return (
    <Image
      {...sharedProps}
      width={width ?? 800}
      height={height ?? 600}
    />
  );
}
