"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function UserOrders() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (status !== "authenticated" || !(session as any)?.idToken) return;

      try {
        const response = await fetch("/api/Order/user", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${(session as any).idToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (e) {
        console.error("Failed to fetch user orders", e);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [session, status]);

  if (status === "loading" || loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8"><p className="text-slate-500 font-bold animate-pulse">Loading Order Payload...</p></div>;
  if (status === "unauthenticated") return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8"><p className="text-red-500 font-bold">Unauthorized.</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 drop-shadow-sm">
            My Order Logistics
          </h1>
          <Link href="/" className="px-4 py-2 bg-white text-slate-800 font-semibold border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm">
            Main Dashboard
          </Link>
        </div>

        <div className="bg-white/80 rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 backdrop-blur">
          {orders.length === 0 ? (
            <p className="text-slate-500 font-medium text-center">You haven't executed any orders natively on the Hypervisor yet.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((o: any, idx) => (
                <li key={idx} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-indigo-300 transition-all duration-300">
                  <div>
                    <h3 className="font-bold text-xl text-indigo-700">Order #{o.id}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">User System ID: {o.userId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {o.productIds.map((pid: number, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100">
                        Product: {pid}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
