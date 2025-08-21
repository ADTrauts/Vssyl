"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "shared/styles/theme";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to send reset email");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="w-full space-y-6"
      style={{ '--focus-ring-color': COLORS.infoBlue } as React.CSSProperties}
    >
      <div>
        <h2 className="text-center text-2xl font-extrabold mb-1" style={{ color: COLORS.neutralDark }}>
          Reset your password
        </h2>
        <p className="text-center text-base text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-md block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[${COLORS.infoBlue}] focus:border-[${COLORS.infoBlue}] text-base"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center font-semibold mt-1">{error}</div>
        )}

        {success && (
          <div style={{color: COLORS.primaryGreen}} className="text-sm text-center">
            If an account exists with that email, you will receive a password reset link.
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.infoBlue}] disabled:opacity-50 transition-all"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </div>

        <div className="text-sm text-center">
          <Link href="/auth/login" className="font-medium hover:underline" style={{color: COLORS.infoBlue}}>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
} 