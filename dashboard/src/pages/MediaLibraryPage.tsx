import { useCallback, useEffect, useState } from 'react';
import { deleteMedia, fetchMedia, uploadMedia } from '../api/endpoints';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  ErrorBanner,
  PageHeader,
  SuccessBanner,
} from '../components/ui';
import { ListSkeleton } from '../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useLocations } from '../contexts/LocationsContext';
import type { MediaRecord, PostType } from '../types';
import { formatDate } from '../utils/format';

const PLACEHOLDER_HOSTS = ['placehold.co', 'via.placeholder.com'];

function isPlaceholderUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  }
  catch {
    return false;
  }
}

interface LocationMedia {
  locationId: string;
  name: string;
  items: MediaRecord[];
}

export function MediaLibraryPage() {
  const { locations, loading: locationsLoading } = useLocations();
  const [mediaByLocation, setMediaByLocation] = useState<LocationMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (locations.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        locations.map(async (location) => {
          const media = await fetchMedia(location.id);
          const items = media.filter((item) => !isPlaceholderUrl(item.url));
          return {
            locationId: location.id,
            name: location.businessName,
            items,
          };
        }),
      );
      setMediaByLocation(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [locations]);

  useEffect(() => {
    if (!locationsLoading && locations.length > 0) {
      void loadData();
    }
  }, [loadData, locationsLoading, locations.length]);

  async function handleUpload(locationId: string, file: File, postType: PostType) {
    setUploading(locationId);
    setError(null);
    setSuccess(null);
    try {
      const { url, media } = await uploadMedia(locationId, file, postType);
      const locationName =
        locations.find((l) => l.id === locationId)?.businessName ?? locationId;

      if (isPlaceholderUrl(url)) {
        setSuccess(
          `Upload saved for ${locationName}, but MOCK_MODE returns a placeholder. Disable MOCK_MODE for real Cloudinary URLs.`,
        );
      } else {
        setSuccess(`Uploaded to ${locationName}`);
      }

      if (!isPlaceholderUrl(media.url)) {
        setMediaByLocation((prev) =>
          prev.map((loc) =>
            loc.locationId === locationId
              ? {
                  ...loc,
                  items: [media, ...loc.items.filter((m) => m.id !== media.id)],
                }
              : loc,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Uploaded images from GET /locations/:id/media."
        action={
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 sm:w-auto"
          >
            Refresh
          </button>
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {loading || locationsLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <div className="space-y-8">
          {mediaByLocation.map((loc) => (
            <LocationMediaSection
              key={loc.locationId}
              locationId={loc.locationId}
              name={loc.name}
              items={loc.items}
              uploading={uploading === loc.locationId}
              onUpload={handleUpload}
              onDeleted={() => {
                setSuccess('Image deleted.');
                void loadData();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationMediaSectionProps {
  locationId: string;
  name: string;
  items: MediaRecord[];
  uploading: boolean;
  onUpload: (locationId: string, file: File, postType: PostType) => Promise<void>;
  onDeleted: () => void;
}

function LocationMediaSection({
  locationId,
  name,
  items,
  uploading,
  onUpload,
  onDeleted,
}: LocationMediaSectionProps) {
  const [postType, setPostType] = useState<PostType>('UPDATE');
  const [deleteTarget, setDeleteTarget] = useState<MediaRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMedia(locationId, deleteTarget.id);
      setDeleteTarget(null);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void onUpload(locationId, file, postType);
    }
    e.target.value = '';
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <p className="font-mono text-xs text-slate-500">{locationId}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="OFFER">OFFER</SelectItem>
              <SelectItem value="EVENT">EVENT</SelectItem>
            </SelectContent>
          </Select>
          <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-500">
            {uploading ? 'Uploading…' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {deleteError ? (
        <p className="mb-3 text-sm text-red-400">{deleteError}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No uploaded media yet for this location.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-lg ring-1 ring-slate-700 hover:ring-emerald-500/50"
            >
              <a href={item.url} target="_blank" rel="noreferrer">
                <img
                  src={item.url}
                  alt={`${item.postType} media`}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </a>
              <div className="space-y-1 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                    {item.postType}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-mono text-[10px] text-emerald-400 hover:underline"
                >
                  {item.url}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(item);
                  }}
                  className="mt-1 w-full rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image from the library and Cloudinary. Posts that already used
              this URL are not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              loading={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? 'Deleting…' : 'Delete image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
