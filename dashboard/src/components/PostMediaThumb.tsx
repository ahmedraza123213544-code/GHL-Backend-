import { cn } from '../lib/utils';

interface PostMediaThumbProps {
  url: string | null | undefined;
  alt?: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export function PostMediaThumb({
  url,
  alt = 'Post media',
  size = 'sm',
  className,
}: PostMediaThumbProps) {
  if (!url) {
    return <span className="text-xs text-slate-600">—</span>;
  }

  const sizeClass =
    size === 'lg' ? 'h-48 w-full max-w-md rounded-lg' : 'h-10 w-16 rounded';

  return (
    <img
      src={url}
      alt={alt}
      className={cn('object-cover ring-1 ring-slate-700', sizeClass, className)}
      loading="lazy"
    />
  );
}
