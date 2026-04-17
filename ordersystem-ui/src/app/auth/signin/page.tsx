"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4 text-white text-xl font-black">
            OS
          </div>
          <h2 className="text-2xl font-black text-slate-800">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to your OrderSystem account.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">Or</span>
        </div>

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email Address</label>
            <input
              required
              type="email"
              placeholder="enterprise@ordersystem.com"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-2"
          >
            {loading ? "Signing in..." : "Sign In securely"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8 font-medium">
          Don't have an account? <Link href="/auth/signup" className="text-indigo-600 font-bold hover:underline">Sign up now</Link>
        </p>
      </div>
    </div>
  );
}
