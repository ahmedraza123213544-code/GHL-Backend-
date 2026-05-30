import { useCallback, useEffect, useState } from 'react';
import { approvePost, fetchPendingPosts, rejectPost } from '../api/endpoints';
import { PostMediaThumb } from '../components/PostMediaThumb';
import { PostDetailModal } from '../components/PostDetailModal';
import {
  ErrorBanner,
  PageHeader,
  StatusBadge,
  SuccessBanner,
} from '../components/ui';
import { ListSkeleton } from '../components/ui/skeleton';
import type { PendingPostItem } from '../types/location';
import type { Post } from '../types';
import { formatDate } from '../utils/format';

export function ApprovalQueuePage() {
  const [pending, setPending] = useState<PendingPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<Post | null>(null);
  const [viewLocationName, setViewLocationName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPending(await fetchPendingPosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleApprove(locationId: string, postId: string) {
    setActionId(postId);
    setError(null);
    try {
      await approvePost(locationId, postId);
      setSuccess('Post approved and published.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve post');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(locationId: string, postId: string) {
    setActionId(postId);
    setError(null);
    try {
      await rejectPost(locationId, postId);
      setSuccess('Post rejected.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject post');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Approval Queue"
        description="Posts with PENDING status from the backend approval API."
        action={
          <button
            type="button"
            onClick={() => void loadData()}
            className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 sm:w-auto"
          >
            Refresh
          </button>
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {loading ? (
        <ListSkeleton count={3} />
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
          <p className="text-slate-300">No posts awaiting approval.</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            The API returned 0 posts with status <strong className="text-amber-400">PENDING</strong>.
            Published posts will not appear here. Enable{' '}
            <code className="text-emerald-400">requiresApproval</code> on a location to queue new
            posts for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-amber-500/20 bg-slate-900/60 p-4 sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-white">{post.locationName}</h2>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(post.createdAt)} · {post.type}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewPost(post);
                      setViewLocationName(post.locationName);
                    }}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={actionId === post.id}
                    onClick={() => handleApprove(post.locationId, post.id)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionId === post.id}
                    onClick={() => handleReject(post.locationId, post.id)}
                    className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-300">{post.content}</p>

              {post.mediaUrl ? (
                <div className="mt-4">
                  <PostMediaThumb url={post.mediaUrl} size="lg" />
                </div>
              ) : null}

              <p className="mt-3 font-mono text-[10px] text-slate-600">
                {post.locationId} / {post.id}
              </p>
            </article>
          ))}
        </div>
      )}

      <PostDetailModal
        post={viewPost}
        locationId={viewPost?.locationId ?? ''}
        locationName={viewLocationName}
        open={!!viewPost}
        onOpenChange={(open) => {
          if (!open) setViewPost(null);
        }}
        onUpdated={() => {
          setSuccess('Post updated.');
          void loadData();
        }}
        onDeleted={() => {
          setViewPost(null);
          setSuccess('Post deleted.');
          void loadData();
        }}
        onApprove={
          viewPost?.status === 'PENDING'
            ? async (postId) => {
                await approvePost(viewPost.locationId, postId);
                setSuccess('Post approved and published.');
                await loadData();
              }
            : undefined
        }
        onReject={
          viewPost?.status === 'PENDING'
            ? async (postId) => {
                await rejectPost(viewPost.locationId, postId);
                setSuccess('Post rejected.');
                await loadData();
              }
            : undefined
        }
      />
    </div>
  );
}
