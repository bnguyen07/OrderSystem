"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type Order = {
  id: number;
  userId: number;
  productIds: number[];
  status: string;
  createdAt: string;
};

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const STATUS_COLORS: Record<string, string> = {
  Pending:    "bg-amber-100 text-amber-700 border-amber-300",
  Processing: "bg-blue-100 text-blue-700 border-blue-300",
  Shipped:    "bg-indigo-100 text-indigo-700 border-indigo-300",
  Delivered:  "bg-emerald-100 text-emerald-700 border-emerald-300",
};

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`flex flex-col items-center`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
              idx <= currentIdx
                ? 'bg-indigo-600 border-indigo-600 text-white scale-110'
                : 'bg-white border-slate-300 text-slate-400'
            }`}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span className={`text-[9px] font-bold mt-0.5 whitespace-nowrap ${idx <= currentIdx ? 'text-indigo-600' : 'text-slate-400'}`}>
              {step}
            </span>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mb-4 rounded-full transition-all ${idx < currentIdx ? 'bg-indigo-600' : 'bg-slate-200'}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const token = (session as any)?.idToken;
    fetch("/api/Order/user/1", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 font-medium">Please sign in to view your orders.</p>
        <button onClick={() => signIn()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow active:scale-95 transition">Sign In</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight">
            OrderSystem
          </h1>
          <p className="text-slate-400 text-xs">My Order History</p>
        </div>
        <Link href="/" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
          ← Back to Catalog
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-800">
            Your Orders
            <span className="ml-2 text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{orders.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3"/>
                <div className="h-3 bg-slate-100 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📦</p>
            <p className="text-slate-500 font-medium">No orders yet.</p>
            <Link href="/" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">Browse the catalog →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice().reverse().map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-mono">ORDER #{String(order.id).padStart(6, '0')}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {order.status}
                  </span>
                </div>
                <StatusTimeline status={order.status}/>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                  <p className="text-xs text-slate-400 font-medium">Products:</p>
                  {order.productIds.map((pid, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">ID #{pid}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
