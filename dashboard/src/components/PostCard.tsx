import { PostMediaThumb } from './PostMediaThumb';
import { StatusBadge } from './ui';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import type { Post } from '../types';
import { formatDate, truncate } from '../utils/format';

interface PostCardProps {
  post: Post;
  onViewDetails: () => void;
}

export function PostCard({ post, onViewDetails }: PostCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">
            {formatDate(post.postedAt ?? post.createdAt)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-200">{post.type}</p>
        </div>
        <StatusBadge status={post.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-400">
          {truncate(post.content, 140)}
        </p>
        {post.mediaUrl ? (
          <PostMediaThumb url={post.mediaUrl} size="lg" className="w-full" />
        ) : null}
      </CardContent>

      <CardFooter>
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          View Details
        </button>
      </CardFooter>
    </Card>
  );
}
