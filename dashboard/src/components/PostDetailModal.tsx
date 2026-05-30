import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { deletePost, updatePost } from '../api/endpoints';
import {
  PostFormFields,
  formValuesToPayload,
  postToFormValues,
  type PostFormValues,
} from './PostFormFields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { StatusBadge } from './ui';
import type { Post } from '../types';
import { formatDate } from '../utils/format';
import { PostMediaThumb } from './PostMediaThumb';

interface PostDetailModalProps {
  post: Post | null;
  locationId: string;
  locationName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
  onApprove?: (postId: string) => Promise<void>;
  onReject?: (postId: string) => Promise<void>;
}

function PostMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/50 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-200">{value}</dd>
    </div>
  );
}

export function PostDetailModal({
  post,
  locationId,
  locationName,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
  onApprove,
  onReject,
}: PostDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<PostFormValues>({
    type: 'UPDATE',
    content: '',
    mediaUrl: '',
    scheduledAt: '',
  });

  useEffect(() => {
    if (post) {
      setFormValues(postToFormValues(post));
      setMode('view');
      setError(null);
    }
  }, [post]);

  useEffect(() => {
    if (!open) {
      setMode('view');
      setDeleteOpen(false);
      setError(null);
    }
  }, [open]);

  if (!post) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    try {
      const updated = await updatePost(locationId, post!.id, formValuesToPayload(formValues));
      onUpdated?.(updated);
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deletePost(locationId, post!.id);
      onDeleted?.(post!.id);
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleApprove() {
    if (!onApprove) return;
    setActionLoading(true);
    setError(null);
    try {
      await onApprove(post!.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve post');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!onReject) return;
    setActionLoading(true);
    setError(null);
    try {
      await onReject(post!.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject post');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit Post' : 'Post Details'}</DialogTitle>
            <DialogDescription>
              {locationName ? `${locationName} · ` : ''}
              {post.type} · {formatDate(post.postedAt ?? post.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {mode === 'view' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={post.status} />
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {post.type}
                </span>
                <span className="text-xs text-slate-500">Platform: {post.platform}</span>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2">
                <PostMetaRow label="Status" value={post.status} />
                <PostMetaRow label="Type" value={post.type} />
                <PostMetaRow label="Created" value={formatDate(post.createdAt)} />
                <PostMetaRow label="Posted" value={formatDate(post.postedAt)} />
                <PostMetaRow
                  label="Scheduled"
                  value={formatDate(post.scheduledAt)}
                />
                <PostMetaRow label="Platform" value={post.platform} />
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Content
                </p>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {post.content}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Media
                </p>
                {post.mediaUrl ? (
                  <>
                    <PostMediaThumb url={post.mediaUrl} size="lg" />
                    <a
                      href={post.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all font-mono text-xs text-emerald-400 hover:underline"
                    >
                      {post.mediaUrl}
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No media attached.</p>
                )}
              </div>

              <p className="font-mono text-[10px] text-slate-600">Post ID: {post.id}</p>

              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </button>
                {post.status === 'PENDING' && onApprove && onReject ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleReject}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <PostFormFields
                locationId={locationId}
                values={formValues}
                onChange={setFormValues}
                disabled={updating}
                idPrefix="edit-post"
              />

              <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setFormValues(postToFormValues(post));
                    setMode('view');
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !formValues.content.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {updating ? 'Updating…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post from the database. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              loading={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? 'Deleting…' : 'Delete Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
