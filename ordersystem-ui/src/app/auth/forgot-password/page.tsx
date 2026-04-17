"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/Identity/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message || "Password reset link sent.");
      } else {
        setError("An error occurred processing your request.");
      }
    } catch (e) {
      setError("Network or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 text-white text-xl font-black">
            ?
          </div>
          <h2 className="text-2xl font-black text-slate-800">Reset Password</h2>
          <p className="text-slate-400 text-sm mt-1">We'll send you a secure link to reset your password.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-100">
            {message}
          </div>
        )}

        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Registered Email</label>
            <input
              required
              type="email"
              placeholder="enterprise@ordersystem.com"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-amber-400 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!message}
            />
          </div>
          {!message && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
            </button>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 mt-8 font-medium">
          Remember your password? <Link href="/auth/signin" className="text-amber-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
