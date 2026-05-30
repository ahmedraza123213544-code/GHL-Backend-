import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { fetchMedia, uploadMedia } from '../api/endpoints';
import { PostMediaThumb } from './PostMediaThumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { MediaRecord, PostType } from '../types';
import { DateTimePicker } from './ui/datetime-picker';

const PLACEHOLDER_HOSTS = ['placehold.co', 'via.placeholder.com'];
const CONTENT_MAX = 1500;

function isPlaceholderUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export interface PostFormValues {
  type: PostType;
  content: string;
  mediaUrl: string;
  scheduledAt: string;
}

interface PostFormFieldsProps {
  locationId: string;
  values: PostFormValues;
  onChange: (values: PostFormValues) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function PostFormFields({
  locationId,
  values,
  onChange,
  disabled = false,
  idPrefix = 'post',
}: PostFormFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [library, setLibrary] = useState<MediaRecord[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const patch = (partial: Partial<PostFormValues>) => {
    onChange({ ...values, ...partial });
  };

  const loadLibrary = useCallback(async () => {
    if (!locationId) return;
    setLibraryLoading(true);
    try {
      const media = await fetchMedia(locationId);
      setLibrary(
        media.filter((m) => !isPlaceholderUrl(m.url) && m.postType === values.type),
      );
    } catch {
      setLibrary([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [locationId, values.type]);

  useEffect(() => {
    if (showLibrary) {
      void loadLibrary();
    }
  }, [showLibrary, loadLibrary]);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadMedia(locationId, file, values.type);
      patch({ mediaUrl: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please choose an image file (JPEG, PNG, WebP, etc.).');
        return;
      }
      void handleFileUpload(file);
    }
  }

  const contentLen = values.content.length;
  const previewUrl = values.mediaUrl.trim() || null;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Post type <span className="text-red-400">*</span>
        </label>
        <Select
          value={values.type}
          onValueChange={(v) => patch({ type: v as PostType })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATE">UPDATE — standard post</SelectItem>
            <SelectItem value="OFFER">OFFER — promotion</SelectItem>
            <SelectItem value="EVENT">EVENT — event announcement</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-slate-500">
          Media library uploads are tagged by type; changing type may affect which images appear.
        </p>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-content`} className="mb-1 block text-sm font-medium text-slate-400">
          Content <span className="text-red-400">*</span>
        </label>
        <textarea
          id={`${idPrefix}-content`}
          required
          rows={6}
          maxLength={CONTENT_MAX}
          value={values.content}
          onChange={(e) => patch({ content: e.target.value })}
          disabled={disabled}
          placeholder="Write the post text for Google Business Profile…"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        />
        <p
          className={`mt-1 text-xs ${contentLen > CONTENT_MAX ? 'text-red-400' : 'text-slate-500'}`}
        >
          {contentLen} / {CONTENT_MAX} characters
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <p className="mb-3 text-sm font-medium text-slate-300">Image / media</p>

        {previewUrl ? (
          <div className="mb-4">
            <PostMediaThumb url={previewUrl} size="lg" />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => patch({ mediaUrl: '' })}
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Remove image
            </button>
          </div>
        ) : (
          <p className="mb-3 text-xs text-slate-500">
            Optional. Upload an image or paste a URL. If empty, the daily job may pick media from your
            library for this post type.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 px-4 py-3 text-sm text-slate-300 hover:border-emerald-500/50 hover:bg-slate-900 ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <ImagePlus className="h-4 w-4 text-emerald-400" />
            )}
            {uploading ? 'Uploading…' : 'Upload image'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading}
              onChange={onFileChange}
            />
          </label>

          <button
            type="button"
            disabled={disabled || !locationId}
            onClick={() => setShowLibrary((v) => !v)}
            className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            {showLibrary ? 'Hide library' : 'Pick from media library'}
          </button>
        </div>

        {uploadError ? (
          <p className="mt-2 text-xs text-red-400">{uploadError}</p>
        ) : null}

        <div className="mt-4">
          <label htmlFor={`${idPrefix}-media-url`} className="mb-1 block text-xs text-slate-500">
            Or paste image URL
          </label>
          <input
            id={`${idPrefix}-media-url`}
            type="url"
            value={values.mediaUrl}
            onChange={(e) => patch({ mediaUrl: e.target.value })}
            disabled={disabled}
            placeholder="https://res.cloudinary.com/…"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {showLibrary ? (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Media for {values.type}
            </p>
            {libraryLoading ? (
              <p className="text-sm text-slate-500">Loading library…</p>
            ) : library.length === 0 ? (
              <p className="text-sm text-slate-500">
                No images for this type. Upload on the Media Library page first.
              </p>
            ) : (
              <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {library.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      patch({ mediaUrl: item.url });
                      setShowLibrary(false);
                    }}
                    className={`overflow-hidden rounded-lg ring-2 transition hover:ring-emerald-500 ${
                      values.mediaUrl === item.url
                        ? 'ring-emerald-500'
                        : 'ring-slate-700'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Scheduled at (optional)
        </label>
        <DateTimePicker
          value={values.scheduledAt}
          onChange={(iso) => patch({ scheduledAt: iso })}
          disabled={disabled}
          placeholder="Select date and time"
        />
        <p className="mt-2 text-xs text-slate-500">
          Stored on the post record for planning; publish still runs immediately unless you add
          scheduling later.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-400">Platform</label>
        <input
          type="text"
          value="google"
          readOnly
          disabled
          className="w-full max-w-xs rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-500"
        />
      </div>
    </div>
  );
}

export function postToFormValues(post: {
  type: PostType;
  content: string;
  mediaUrl: string | null;
  scheduledAt: string | null;
}): PostFormValues {
  return {
    type: post.type,
    content: post.content,
    mediaUrl: post.mediaUrl ?? '',
    scheduledAt: post.scheduledAt ?? '',
  };
}

export function formValuesToPayload(values: PostFormValues) {
  const scheduled = values.scheduledAt.trim();
  let scheduledAt: string | null = null;
  if (scheduled) {
    const d = new Date(scheduled);
    scheduledAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return {
    type: values.type,
    content: values.content.trim(),
    mediaUrl: values.mediaUrl.trim() || null,
    scheduledAt,
  };
}
