'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { GeneratedSite } from '@/src/lib/types';
import { getTextColor, resolveTheme } from '@/src/lib/theme';

type ContactFormProps = {
  site: GeneratedSite;
  heading?: string;
};

export function ContactForm({ site, heading = 'Send us a message' }: ContactFormProps) {
  const theme = resolveTheme(site);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      message: form.get('message'),
      siteSlug: site.slug,
    };

    try {
      console.info('Contact form submission', payload);
      await new Promise((r) => setTimeout(r, 900));
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.accentColor, color: getTextColor(theme.accentColor) }}
        >
          <Check className="h-7 w-7" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Message sent!</p>
        <p className="mt-2 text-sm text-gray-600">We&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">{heading}</h2>
      {[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
      ].map((field) => (
        <div key={field.name} className="relative">
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            required={field.name !== 'phone'}
            placeholder=" "
            className="peer w-full rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-6 text-gray-900 outline-none transition focus:border-transparent focus:ring-2"
            style={{ ['--tw-ring-color' as string]: theme.accentColor }}
          />
          <label
            htmlFor={field.name}
            className="pointer-events-none absolute left-4 top-4 text-sm text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
          >
            {field.label}
          </label>
        </div>
      ))}
      <div className="relative">
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder=" "
          className="peer w-full rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-6 text-gray-900 outline-none transition focus:ring-2"
        />
        <label
          htmlFor="message"
          className="pointer-events-none absolute left-4 top-4 text-sm text-gray-500 transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
        >
          Message
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
        style={{
          backgroundColor: theme.accentColor,
          color: getTextColor(theme.accentColor),
        }}
      >
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send Message
      </button>
    </form>
  );
}
