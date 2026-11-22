"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 12) {
      setErrorMessage("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-unitech-red selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-unitech-red/10 border border-unitech-red/20 mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-unitech-red" />
          </div>
          <h1 className="text-xl font-black font-heading tracking-tight text-white uppercase">
            UNITECH SECURITY SYSTEMS
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            OEM Super Admin Terminal · Credential Recovery
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black font-heading text-slate-900">
                  Password updated — please log in
                </h2>
                <p className="text-xs text-slate-600">
                  Your administrator password was reset successfully. All previous sessions have been logged out.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/admin"
                  className="w-full py-3 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold shadow-md shadow-unitech-red/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Proceed to Admin Login</span>
                </Link>
              </div>
            </div>
          ) : !token ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black font-heading text-slate-900">
                  Missing Reset Token
                </h2>
                <p className="text-xs text-slate-600">
                  This reset link is missing a valid security token. Please request a new link from the administrator login page.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/admin"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Admin Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 pb-1">
                <h2 className="text-lg font-black font-heading text-slate-900">
                  Set New Administrator Password
                </h2>
                <p className="text-xs text-slate-500">
                  Choose a strong password containing at least 12 characters.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <div>{errorMessage}</div>
                    <Link
                      href="/admin"
                      className="text-[11px] font-bold text-red-700 hover:text-red-900 underline block"
                    >
                      Request a new reset link →
                    </Link>
                  </div>
                </div>
              )}

              {/* Field 1: New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-slate-400 font-normal">(min 12 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new master password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className={`font-mono font-bold ${newPassword.length >= 12 ? "text-emerald-600" : "text-amber-600"}`}>
                      {newPassword.length}/12 characters
                    </span>
                    {newPassword.length >= 12 ? (
                      <span className="text-emerald-600 font-medium">✓ Strong length</span>
                    ) : (
                      <span className="text-amber-600 font-medium">(needs {12 - newPassword.length} more)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new master password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || newPassword.length < 12 || newPassword !== confirmPassword}
                className="w-full py-3 rounded-xl bg-unitech-red hover:bg-unitech-darkred active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-unitech-red/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Administrator Password...</span>
                  </>
                ) : (
                  <span>Update Password & Invalidate Old Sessions</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/admin"
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel and return to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
          Loading security terminal...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
