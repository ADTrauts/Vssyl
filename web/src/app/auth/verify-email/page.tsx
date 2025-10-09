"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COLORS } from "shared/styles/theme";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  async function verifyEmail(token: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://vssyl-server-235369681725.us-central1.run.app";
      const res = await fetch(`${apiBase}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to verify email");
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

  async function handleResendVerification() {
    setResendLoading(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://vssyl-server-235369681725.us-central1.run.app";
      const res = await fetch(`${apiBase}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to resend verification email");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div 
      className="w-full space-y-6"
      style={{ '--focus-ring-color': COLORS.infoBlue } as React.CSSProperties}
    >
      <div>
        <h2 className="text-center text-2xl font-extrabold mb-1" style={{ color: COLORS.neutralDark }}>
          Email Verification
        </h2>
        <p className="text-center text-base text-gray-600">
          {token
            ? "Verifying your email address..."
            : "Please verify your email address to continue"}
        </p>
      </div>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{borderColor: COLORS.infoBlue}}></div>
          <p className="mt-4 text-sm text-gray-600">Verifying your email...</p>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm text-center font-semibold mt-1">{error}</div>
      )}

      {success && (
        <div style={{color: COLORS.primaryGreen}} className="text-sm text-center">
          Email verified successfully! Redirecting to login...
        </div>
      )}

      {!token && !success && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive a verification email?
          </p>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-bold rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.infoBlue}] disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}
    </div>
  );
} 