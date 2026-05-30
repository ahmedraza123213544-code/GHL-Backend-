import { useCallback, useEffect, useState } from 'react';
import { fetchLocationSummaries, setupGhlFields } from '../api/endpoints';
import {
  ErrorBanner,
  JsonLog,
  PageHeader,
  StatusBadge,
  SuccessBanner,
} from '../components/ui';
import { CardGridSkeleton } from '../components/ui/skeleton';
import { useLocations } from '../contexts/LocationsContext';
import type { GhlFieldSetupResult } from '../types';
import type { LocationSummary } from '../types/location';
import { formatDateShort } from '../utils/format';

export function GhlStatusPage() {
  const { refresh: refreshLocations } = useLocations();
  const [summaries, setSummaries] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupResults, setSetupResults] = useState<GhlFieldSetupResult[] | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummaries(await fetchLocationSummaries());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GHL status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRefreshFields() {
    setRefreshing(true);
    setError(null);
    setSetupResults(null);
    try {
      const results = await setupGhlFields();
      setSetupResults(results);
      await refreshLocations();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh GHL fields');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="GHL Status"
        description="GoHighLevel custom field configuration from the backend."
        action={
          <button
            type="button"
            onClick={handleRefreshFields}
            disabled={refreshing}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
          >
            {refreshing ? 'Refreshing…' : 'Refresh GHL Fields'}
          </button>
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
      {setupResults ? (
        <SuccessBanner message="GHL field setup completed. See results below." />
      ) : null}

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="space-y-6">
          {summaries.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{row.businessName}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    GHL Location ID: {row.ghlLocationId}
                  </p>
                </div>
                {row.lastPost ? (
                  <StatusBadge status={row.lastPost.status} />
                ) : null}
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last Post Date (from latest post)
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {formatDateShort(
                      row.lastPost?.postedAt ?? row.lastPost?.createdAt,
                    )}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Post Status (from latest post)
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {row.lastPost?.status ?? 'N/A'}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    ghlLastPostDateFieldId
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-emerald-400">
                    {row.ghlLastPostDateFieldId ?? 'Not set. Click Refresh GHL Fields.'}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    ghlPostStatusFieldId
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-emerald-400">
                    {row.ghlPostStatusFieldId ?? 'Not set. Click Refresh GHL Fields.'}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {setupResults ? (
        <div className="mt-8">
          <JsonLog data={{ results: setupResults }} title="GHL Setup Response" />
        </div>
      ) : null}
    </div>
  );
}
