import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createPhase4Template,
  deletePhase4Template,
  fetchPhase4Templates,
  updatePhase4Template,
  type Phase4Template,
  type Phase4TemplatePayload,
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { CardGridSkeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

const INDUSTRY_OPTIONS = [
  'automotive',
  'hvac',
  'business',
  'restaurant',
  'plumbing',
  'electrical',
  'landscaping',
  'cleaning',
  'general',
] as const;

const emptyForm: Phase4TemplatePayload = {
  name: '',
  industry: 'general',
  slug: '',
  description: '',
  previewImage: '',
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function TemplateStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
          : 'bg-red-500/15 text-red-400 ring-red-500/30',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Phase4Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Phase4Template | null>(null);
  const [form, setForm] = useState<Phase4TemplatePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Phase4Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPhase4Templates();
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(template: Phase4Template) {
    setEditing(template);
    setForm({
      name: template.name,
      industry: template.industry,
      slug: template.slug,
      description: template.description ?? '',
      previewImage: template.previewImage ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Phase4TemplatePayload = {
        name: form.name.trim(),
        industry: form.industry,
        slug: slugify(form.slug || form.name),
        description: form.description?.trim() || null,
        previewImage: form.previewImage?.trim() || null,
      };

      if (editing) {
        await updatePhase4Template(editing.id, payload);
        setSuccess('Template updated.');
      } else {
        await createPhase4Template(payload);
        setSuccess('Template created.');
      }

      setDialogOpen(false);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
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
      await deletePhase4Template(deleteTarget.id);
      setSuccess(`Template "${deleteTarget.name}" deactivated.`);
      setDeleteTarget(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Manage website templates for Phase 4 site generation."
        action={
          <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 py-16 text-center text-sm text-slate-500">
          No templates yet. Add your first template to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col overflow-hidden">
              {template.previewImage ? (
                <div className="aspect-video w-full overflow-hidden border-b border-slate-800 bg-slate-950">
                  <img
                    src={template.previewImage}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <TemplateStatusBadge active={template.isActive} />
                </div>
                <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium capitalize text-slate-300">
                    {template.industry}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{template.slug}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-slate-400">
                  {template.description || 'No description provided.'}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(template)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => setDeleteTarget(template)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'Add Template'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update template details used for website generation.'
                : 'Create a new template for a specific industry.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="Automotive Template"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Industry</label>
              <Select
                value={form.industry}
                onValueChange={(value) => setForm((f) => ({ ...f, industry: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                onBlur={() => {
                  if (!form.slug.trim() && form.name.trim()) {
                    setForm((f) => ({ ...f, slug: slugify(f.name) }));
                  }
                }}
                className={inputClass}
                placeholder="automotive-template"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
                placeholder="Brief description of this template"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Preview image URL
              </label>
              <input
                type="url"
                value={form.previewImage ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, previewImage: e.target.value }))}
                className={inputClass}
                placeholder="https://example.com/preview.png"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save changes' : 'Create template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{deleteTarget?.name}&quot;. It will no longer appear in
              the active templates list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
