"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COLORS } from "shared/styles/theme";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://vssyl.com/api";
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-center text-2xl font-extrabold mb-1" style={{ color: COLORS.neutralDark }}>
            Invalid Reset Link
          </h2>
          <p className="text-center text-base text-gray-600">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="text-center">
          <Link href="/auth/forgot-password" className="font-medium hover:underline" style={{color: COLORS.infoBlue}}>
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full space-y-6"
      style={{ '--focus-ring-color': COLORS.infoBlue } as React.CSSProperties}
    >
      <div>
        <h2 className="text-center text-2xl font-extrabold mb-1" style={{ color: COLORS.neutralDark }}>
          Set new password
        </h2>
        <p className="text-center text-base text-gray-600">
          Please enter your new password below.
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-lg shadow-sm space-y-4">
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-md block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[${COLORS.infoBlue}] focus:border-[${COLORS.infoBlue}] text-base"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-base font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-md block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[${COLORS.infoBlue}] focus:border-[${COLORS.infoBlue}] text-base"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center font-semibold mt-1">{error}</div>
        )}

        {success && (
          <div style={{color: COLORS.primaryGreen}} className="text-sm text-center">
            Password has been reset successfully. Redirecting to login...
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.infoBlue}] disabled:opacity-50 transition-all"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </form>
    </div>
  );
} 