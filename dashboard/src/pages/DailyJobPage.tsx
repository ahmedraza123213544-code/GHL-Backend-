import { useState } from 'react';
import { fetchPost, runDailyJob } from '../api/endpoints';
import { useLocations } from '../contexts/LocationsContext';
import {
  ErrorBanner,
  JsonLog,
  PageHeader,
  SuccessBanner,
} from '../components/ui';
import type { DailyJobResult } from '../types';
import { truncate } from '../utils/format';

interface EnrichedResult {
  locationId: string;
  businessName: string;
  success: boolean;
  postId?: string;
  error?: string;
  content?: string;
}

export function DailyJobPage() {
  const { locations, getLocationName } = useLocations();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<DailyJobResult | null>(null);
  const [enrichedResults, setEnrichedResults] = useState<EnrichedResult[]>([]);

  async function handleRunJob() {
    setRunning(true);
    setError(null);
    setRawResponse(null);
    setEnrichedResults([]);

    try {
      const result = await runDailyJob();
      setRawResponse(result);

      const enriched: EnrichedResult[] = await Promise.all(
        result.results.map(async (item) => {
          const businessName = getLocationName(item.locationId);
          let content: string | undefined;

          if (item.success && item.postId) {
            try {
              const post = await fetchPost(item.locationId, item.postId);
              content = post.content;
            } catch {
              content = '(Could not load post content)';
            }
          }

          return {
            ...item,
            businessName,
            content,
          };
        }),
      );

      setEnrichedResults(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daily job failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Run Daily Job"
        description="Manually trigger the daily post publisher for all active locations."
      />

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center sm:mb-8 sm:p-8">
        <p className="mb-6 text-sm text-slate-400">
          This runs the same job scheduled daily at 9:00 AM ET for{' '}
          {locations.length || 'all'} locations.
        </p>
        <button
          type="button"
          onClick={handleRunJob}
          disabled={running}
          className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:opacity-50 sm:w-auto sm:px-8 sm:text-lg"
        >
          {running ? 'Running Daily Job… (may take 1–3 min)' : 'Run Daily Job Now'}
        </button>
      </div>

      {rawResponse ? (
        rawResponse.failed > 0 && rawResponse.ok === 0 ? (
          <ErrorBanner
            message={`All ${rawResponse.failed} locations failed. ${
              rawResponse.results.find((r) => !r.success)?.error ?? 'See details below.'
            }`}
            onDismiss={() => setRawResponse(null)}
          />
        ) : (
          <SuccessBanner
            message={`Complete: ${rawResponse.ok} succeeded, ${rawResponse.failed} failed out of ${rawResponse.locationCount} locations.`}
          />
        )
      ) : null}

      {enrichedResults.length > 0 ? (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-medium text-white">Results by Location</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrichedResults.map((item) => (
              <div
                key={item.locationId}
                className={`rounded-xl border p-5 ${
                  item.success
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{item.businessName}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.success
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {item.success ? 'Success' : 'Failed'}
                  </span>
                </div>

                {item.postId ? (
                  <p className="mb-2 font-mono text-xs text-slate-500">
                    Post ID: {item.postId}
                  </p>
                ) : null}

                {item.error ? (
                  <p className="text-sm text-red-300">{item.error}</p>
                ) : null}

                {item.content ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {truncate(item.content, 200)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {rawResponse ? <JsonLog data={rawResponse} /> : null}
    </div>
  );
}
