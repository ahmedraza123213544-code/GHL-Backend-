import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6 text-center">
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
        style={{ backgroundColor: '#6366F1' }}
      >
        P
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">404</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-600">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        style={{ backgroundColor: '#6366F1' }}
      >
        Go Home
      </Link>
      <p className="mt-10 text-sm text-gray-500">
        Powered by{' '}
        <a
          href="https://peakwa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 hover:underline"
        >
          Peakwa
        </a>
      </p>
    </main>
  );
}
