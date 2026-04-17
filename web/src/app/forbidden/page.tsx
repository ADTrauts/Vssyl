import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl font-semibold text-gray-900">Access denied</h1>
      <p className="mt-2 text-center text-gray-700 max-w-md">
        You do not have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
