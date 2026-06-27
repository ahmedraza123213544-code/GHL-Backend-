import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import { fetchAllContacts, type ContactSubmission } from '../api/endpoints';
import { ErrorBanner, PageHeader } from '../components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { CardListSkeleton, TableSkeleton } from '../components/ui/skeleton';
import { formatDate } from '../utils/format';

function messagePreview(message: string, max = 80) {
  const trimmed = message.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

export function ContactSubmissionsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllContacts();
      setContacts(data.contacts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      (contact.site?.businessName ?? '').toLowerCase().includes(query),
    );
  }, [contacts, search]);

  return (
    <div>
      <PageHeader
        title="Contact Submissions"
        description="View contact form submissions from all generated sites."
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by site name…"
            className={inputClass}
          />
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} submission${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <>
          <CardListSkeleton count={4} />
          <div className="mt-6 hidden lg:block">
            <TableSkeleton rows={5} />
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">
            {search.trim() ? 'No submissions match your search.' : 'No contact submissions yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 lg:hidden">
            {filtered.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelected(contact)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-colors hover:bg-slate-800/40"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{contact.name}</p>
                    <p className="text-sm text-slate-400">{contact.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDate(contact.createdAt)}
                  </span>
                </div>
                <p className="mb-1 text-sm text-emerald-400/90">
                  {contact.site?.businessName ?? 'Unknown site'}
                </p>
                <p className="line-clamp-2 text-sm text-slate-400">
                  {messagePreview(contact.message, 120)}
                </p>
              </button>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-[960px] w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => setSelected(contact)}
                    className="cursor-pointer hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">
                      {contact.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{contact.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{contact.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {contact.site?.businessName ?? '—'}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-400">
                      {messagePreview(contact.message)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                      {formatDate(contact.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name ?? 'Contact submission'}</DialogTitle>
            <DialogDescription>
              {selected?.site?.businessName ?? 'Generated site'} ·{' '}
              {selected ? formatDate(selected.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-slate-200">{selected.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm text-slate-200">{selected.phone ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Site</p>
                  <p className="text-sm text-slate-200">
                    {selected.site?.businessName ?? '—'}
                    {selected.site?.slug ? (
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        {selected.site.slug}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">Message</p>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm whitespace-pre-wrap text-slate-300">
                  {selected.message}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
