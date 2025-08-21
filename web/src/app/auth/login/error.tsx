"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Login Error</h1>
        <p className="mb-6">{error.message || "Something went wrong. Please try again."}</p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 