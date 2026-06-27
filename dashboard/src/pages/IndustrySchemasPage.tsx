import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createIndustrySchema,
  deleteIndustrySchema,
  fetchIndustrySchemas,
  updateIndustrySchema,
  type IndustrySchema,
  type IndustrySchemaPayload,
} from '../api/endpoints';
import { ErrorBanner, PageHeader, SuccessBanner } from '../components/ui';
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
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { CardListSkeleton, TableSkeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import { formatDate } from '../utils/format';

const emptyForm: IndustrySchemaPayload = {
  industry: '',
  displayName: '',
  systemPrompt: '',
  homePageSchema: '',
  aboutPageSchema: '',
  servicesPageSchema: '',
  contactPageSchema: '',
  locationPageSchema: '',
  blogPageSchema: '',
  isDefault: false,
};

function slugifyIndustry(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

const textareaClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

export function IndustrySchemasPage() {
  const [schemas, setSchemas] = useState<IndustrySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IndustrySchema | null>(null);
  const [form, setForm] = useState<IndustrySchemaPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IndustrySchema | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIndustrySchemas();
      setSchemas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load industry schemas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchemas();
  }, [loadSchemas]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(schema: IndustrySchema) {
    setEditing(schema);
    setForm({
      industry: schema.industry,
      displayName: schema.displayName,
      systemPrompt: schema.systemPrompt,
      homePageSchema: schema.homePageSchema,
      aboutPageSchema: schema.aboutPageSchema,
      servicesPageSchema: schema.servicesPageSchema,
      contactPageSchema: schema.contactPageSchema,
      locationPageSchema: schema.locationPageSchema,
      blogPageSchema: schema.blogPageSchema,
      isDefault: schema.isDefault,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: IndustrySchemaPayload = {
        industry: slugifyIndustry(form.industry),
        displayName: form.displayName.trim(),
        systemPrompt: form.systemPrompt.trim(),
        homePageSchema: form.homePageSchema.trim(),
        aboutPageSchema: form.aboutPageSchema.trim(),
        servicesPageSchema: form.servicesPageSchema.trim(),
        contactPageSchema: form.contactPageSchema.trim(),
        locationPageSchema: form.locationPageSchema.trim(),
        blogPageSchema: form.blogPageSchema.trim(),
        isDefault: Boolean(form.isDefault),
      };

      if (editing) {
        await updateIndustrySchema(editing.id, payload);
        setSuccess('Industry schema updated.');
      } else {
        await createIndustrySchema(payload);
        setSuccess('Industry schema created.');
      }

      setDialogOpen(false);
      await loadSchemas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save industry schema');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteIndustrySchema(deleteTarget.id);
      setSuccess(`Schema "${deleteTarget.displayName}" deleted.`);
      setDeleteTarget(null);
      await loadSchemas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete industry schema');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Industry Schemas"
        description="Manage AI content schemas for each industry."
        action={
          <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Schema
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {loading ? (
        <>
          <CardListSkeleton count={4} />
          <div className="mt-6 hidden lg:block">
            <TableSkeleton rows={5} />
          </div>
        </>
      ) : schemas.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 py-16 text-center text-sm text-slate-500">
          No industry schemas yet. Add one to get started.
        </div>
      ) : (
        <>
          <div className="space-y-4 lg:hidden">
            {schemas.map((schema) => (
              <div
                key={schema.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{schema.displayName}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{schema.industry}</p>
                  </div>
                  {schema.isDefault ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                      Default
                    </span>
                  ) : null}
                </div>
                <p className="mb-4 text-sm text-slate-400">{formatDate(schema.createdAt)}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(schema)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => setDeleteTarget(schema)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-[900px] w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Display Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Default
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {schemas.map((schema) => (
                  <tr key={schema.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-sm text-slate-300">
                      {schema.industry}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">
                      {schema.displayName}
                    </td>
                    <td className="px-4 py-3">
                      {schema.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                          Default
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                      {formatDate(schema.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(schema)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => setDeleteTarget(schema)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,100dvh)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Industry Schema' : 'Add Industry Schema'}</DialogTitle>
            <DialogDescription>
              Configure AI prompts and JSON page schemas for an industry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Industry slug
                </label>
                <input
                  type="text"
                  required
                  value={form.industry}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      industry: slugifyIndustry(e.target.value),
                    }))
                  }
                  className={inputClass}
                  placeholder="automotive"
                  disabled={Boolean(editing)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className={inputClass}
                  placeholder="Automotive"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.isDefault)}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500/40"
              />
              Set as default schema (only one can be default)
            </label>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                System Prompt
              </label>
              <textarea
                rows={6}
                required
                value={form.systemPrompt}
                onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                className={cn(textareaClass, 'text-sm')}
                placeholder="AI instructions for content generation..."
              />
            </div>

            {(
              [
                ['homePageSchema', 'Home Page Schema (JSON)'],
                ['aboutPageSchema', 'About Page Schema (JSON)'],
                ['servicesPageSchema', 'Services Page Schema (JSON)'],
                ['contactPageSchema', 'Contact Page Schema (JSON)'],
                ['locationPageSchema', 'Location Page Schema (JSON)'],
                ['blogPageSchema', 'Blog Page Schema (JSON)'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                <textarea
                  rows={4}
                  required
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className={textareaClass}
                  placeholder="{}"
                />
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete industry schema?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the schema for &quot;{deleteTarget?.displayName}&quot;.
              This cannot be undone if sites are using this industry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
