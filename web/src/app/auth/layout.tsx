import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 to-indigo-100">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-10 px-4 sm:px-6 bg-white rounded-xl shadow-lg border border-neutral-200">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="24" height="24" rx="6" fill="#6366f1" fillOpacity="0.12" />
            <rect x="10" y="10" width="12" height="12" rx="3" fill="#6366f1" fillOpacity="0.24" />
          </svg>
          <span className="mt-3 text-2xl font-extrabold" style={{ color: '#333333' }}>Vssyl</span>
        </div>
        <div className="w-full flex flex-col items-center justify-center">{children}</div>
      </div>
    </div>
  );
} 