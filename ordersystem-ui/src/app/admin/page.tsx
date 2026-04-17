"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

type Order = {
  id: number;
  userId: number;
  productIds: number[];
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Pending:    "bg-amber-100 text-amber-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped:    "bg-indigo-100 text-indigo-700",
  Delivered:  "bg-emerald-100 text-emerald-700",
};

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden relative`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${color} opacity-10 -translate-y-6 translate-x-6`}/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const token = (session as any)?.idToken;
    fetch("/api/Order/all", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'electronics', image: '', description: '', stockQuantity: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsAdding(true);
    try {
      const token = (session as any)?.idToken;
      const res = await fetch("/api/Product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          image: newProduct.image || `https://picsum.photos/seed/${Math.random()}/400`,
          description: newProduct.description,
          stockQuantity: parseInt(newProduct.stockQuantity) || 0
        })
      });
      if (res.ok) {
        setNewProduct({ name: '', price: '', category: 'electronics', image: '', description: '', stockQuantity: '' });
        alert("Product successfully added to the catalog!");
      } else {
        alert("Failed to add product.");
      }
    } catch (e) {
      alert("Error adding product.");
    } finally {
      setIsAdding(false);
    }
  };

  // KPI Metrics
  const totalOrders = orders.length;
  const totalItems = orders.reduce((s, o) => s + o.productIds.length, 0);
  const uniqueUsers = new Set(orders.map(o => o.userId)).size;

  // Orders over the last 7 days
  const ordersOverTime = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (label in counts) counts[label]++;
    });
    return Object.entries(counts).map(([day, count]) => ({ day, count }));
  }, [orders]);

  // Items per status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 };
    orders.forEach(o => { if (o.status in counts) counts[o.status]++; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [orders]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 font-medium">Admin access required.</p>
        <button onClick={() => signIn()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow active:scale-95 transition">Sign In</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 tracking-tight">
            Admin Console
          </h1>
          <p className="text-slate-400 text-xs">Global Order Intelligence — AKS</p>
        </div>
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1">
          ← Dashboard
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-28 animate-pulse"/>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Orders"   value={String(totalOrders)} sub="All time" icon="📦" color="bg-indigo-500"/>
              <KpiCard label="Items Ordered"  value={String(totalItems)}  sub="Across all orders" icon="🛒" color="bg-cyan-500"/>
              <KpiCard label="Unique Users"   value={String(uniqueUsers)} sub="Active customers" icon="👥" color="bg-amber-500"/>
              <KpiCard label="Avg Items/Order" value={totalOrders > 0 ? (totalItems / totalOrders).toFixed(1) : "—"} sub="Per order" icon="📊" color="bg-emerald-500"/>
            </div>

            {/* Add Product Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-emerald-500">＋</span> Add New Product
              </h3>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Product Name" className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input required type="number" step="0.01" placeholder="Price ($)" className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <select className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                  <option value="electronics">Electronics</option>
                  <option value="jewelery">Jewelery</option>
                  <option value="men's clothing">Men's Clothing</option>
                  <option value="women's clothing">Women's Clothing</option>
                </select>
                <input type="number" placeholder="Stock Quantity" className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400" value={newProduct.stockQuantity} onChange={e => setNewProduct({...newProduct, stockQuantity: e.target.value})} />
                <input placeholder="Image URL (Leave empty for random AI image)" className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 md:col-span-2" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                <textarea required placeholder="Description..." className="border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 md:col-span-2 h-20" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                <div className="md:col-span-2 flex justify-end">
                  <button disabled={isAdding} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all text-sm shadow-md shadow-emerald-600/20">
                    {isAdding ? "Adding..." : "Publish Product to Catalog"}
                  </button>
                </div>
              </form>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-indigo-600">↗</span> Orders — Last 7 Days
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={ordersOverTime}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1"/>
                        <stop offset="100%" stopColor="#06b6d4"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                    <Line type="monotone" dataKey="count" stroke="url(#lineGrad)" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Orders"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-amber-500">■</span> Orders by Status
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#6366f1" name="Orders"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-800">All Orders</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{totalOrders} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Order ID</th>
                      <th className="px-6 py-3">User ID</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice().reverse().map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3 font-mono font-bold text-slate-600">#{String(order.id).padStart(6, '0')}</td>
                        <td className="px-6 py-3 text-slate-500">User {order.userId}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {order.productIds.slice(0, 3).map((pid, i) => (
                              <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono">#{pid}</span>
                            ))}
                            {order.productIds.length > 3 && <span className="text-[10px] text-slate-400">+{order.productIds.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-xs">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
