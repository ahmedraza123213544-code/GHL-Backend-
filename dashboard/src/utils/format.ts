import type { Post, PostStatus } from '../types';

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Value for `<input type="datetime-local" />` from ISO string. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO string from `<input type="datetime-local" />`, or null if empty. */
export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function sortPostsNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.postedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.postedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function getLatestPost(posts: Post[]): Post | null {
  const sorted = sortPostsNewestFirst(posts);
  return sorted[0] ?? null;
}

export function statusBadgeClass(status: PostStatus | string): string {
  switch (status) {
    case 'PUBLISHED':
    case 'POSTED':
      return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30';
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-400 ring-amber-500/30';
    case 'FAILED':
    case 'REJECTED':
      return 'bg-red-500/15 text-red-400 ring-red-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 ring-slate-500/30';
  }
}
