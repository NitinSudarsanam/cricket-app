import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-6">
          This page could not be found.
        </p>
        <p className="text-slate-500 mb-8">
          The link may be broken or the page may have been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Admin
          </Link>
          <Link
            href="/draft"
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Join Draft
          </Link>
        </div>
      </div>
    </div>
  );
}
