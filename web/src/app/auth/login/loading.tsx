export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-6 w-1/2 mx-auto" />
        <div className="h-4 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-6" />
        <div className="h-4 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-6" />
        <div className="h-10 bg-blue-200 rounded" />
      </div>
    </div>
  );
} 