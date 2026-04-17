"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Direct call to our C# Microservice backend
      const res = await fetch("/api/Identity/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Registration failed. Email might already exist.");
        setLoading(false);
        return;
      }

      // Automatically sign in the user precisely via our NextAuth integration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but automatic login failed.");
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (e) {
      setError("Network or server error.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 text-white text-xl font-black">
            +
          </div>
          <h2 className="text-2xl font-black text-slate-800">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Join the scalable OrderSystem ecosystem.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email Address</label>
            <input
              required
              type="email"
              placeholder="enterprise@ordersystem.com"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-emerald-400 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Choose Password</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-emerald-400 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-2"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8 font-medium">
          Already have an account? <Link href="/auth/signin" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
