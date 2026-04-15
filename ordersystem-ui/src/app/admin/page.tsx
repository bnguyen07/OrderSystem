"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllOrders() {
      if (status !== "authenticated" || !(session as any)?.idToken) return;

      try {
        const response = await fetch("/api/Order/all", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${(session as any).idToken}`
          }
        });
        
        if (response.status === 403) {
            setError("403 Forbidden. Microsoft Identity securely blocked your authorization footprint!");
            setLoading(false);
            return;
        }

        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (e) {
        console.error("Failed to fetch all orders", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAllOrders();
  }, [session, status]);

  if (status === "loading" || loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8"><p className="text-slate-500 font-bold animate-pulse">Querying Enterprise Database...</p></div>;
  if (status === "unauthenticated") return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8"><p className="text-red-500 font-bold">Unauthorized.</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 animate-pulse drop-shadow-sm">
            Enterprise Admin Grid
          </h1>
          <Link href="/" className="px-4 py-2 bg-white text-slate-800 font-semibold border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm">
            Exit Admin Node
          </Link>
        </div>

        {error ? (
            <div className="bg-rose-50/80 border border-rose-200 shadow-xl shadow-rose-100 rounded-2xl p-8 text-center backdrop-blur">
                <span className="text-4xl">🛑</span>
                <h2 className="text-2xl font-bold text-rose-600 mt-4">Security Perimeter Breach</h2>
                <p className="mt-2 text-rose-500 font-medium">{error}</p>
            </div>
        ) : (
            <div className="bg-white/90 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="p-5 text-sm font-bold text-slate-500 uppercase tracking-wider">User Identity (System ID)</th>
                    <th className="p-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Raw Payload Array</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {orders.map((o: any, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-bold text-indigo-600 text-lg">#{o.id}</td>
                    <td className="p-5 text-slate-500 font-medium">{o.userId}</td>
                    <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                        {o.productIds.map((pid: number, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-600 font-bold text-xs rounded-full border border-orange-100 shadow-sm">
                            [ SKU: {pid} ]
                            </span>
                        ))}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {orders.length === 0 && <p className="p-8 text-center text-slate-400 font-medium tracking-wide">Global Registry is currently empty.</p>}
            </div>
        )}
      </div>
    </div>
  );
}
