"use client";

import { useEffect, useState, useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

type Product = {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  image: string;
  description: string;
  category: string;
  rating: number;
  ratingCount: number;
};

type CartItem = { productId: number; quantity: number };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const CATEGORIES = ["All", "electronics", "men's clothing", "women's clothing", "jewelery"];

export default function OrderDashboard() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/Product")
      .then(r => r.json())
      .then(data => { setProducts(data); setLoadingProducts(false); })
      .catch(() => { addToast("Catalog API offline", "error"); setLoadingProducts(false); });
  }, []);

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cart.reduce((sum, c) => {
    const p = products.find(p => p.id === c.productId);
    return sum + (p?.price ?? 0) * c.quantity;
  }, 0);

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [products, search, selectedCategory]);

  const addToCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === productId);
      if (existing) return prev.map(c => c.productId === productId ? {...c, quantity: c.quantity+1} : c);
      return [...prev, { productId, quantity: 1 }];
    });
    const product = products.find(p => p.id === productId);
    addToast(`Added "${product?.name}" to cart`, "success");
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === productId);
      if (existing && existing.quantity > 1) return prev.map(c => c.productId === productId ? {...c, quantity: c.quantity-1} : c);
      return prev.filter(c => c.productId !== productId);
    });
  };

  const submitOrder = async () => {
    if (!session) { addToast("Please sign in first", "error"); return; }
    setIsProcessing(true);
    try {
      const token = (session as any)?.idToken;
      const productIds = cart.flatMap(c => Array(c.quantity).fill(c.productId));
      const response = await fetch("/api/Order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: 1, productIds }),
      });
      if (response.status === 202) {
        addToast("🎉 Order submitted! Processing in background.", "success");
        setCart([]);
      } else if (response.status === 401) {
        addToast("Unauthorized — please sign in again", "error");
      } else {
        addToast("Order failed. Try again.", "error");
      }
    } catch {
      addToast("Network error. Is the API running?", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight">
            OrderSystem
          </h1>
          <p className="text-slate-400 text-xs font-medium">Azure Kubernetes Enterprise</p>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <img src={session.user?.image ?? ''} alt="avatar" className="w-9 h-9 rounded-full border-2 border-indigo-400" />
              <div className="hidden sm:flex flex-col text-xs">
                <span className="font-bold text-slate-800">{session.user?.name}</span>
                <span className="text-slate-400">{session.user?.email}</span>
              </div>
              <div className="flex gap-2 ml-2">
                {session.user?.email === "brian.nguyen2447@gmail.com" && (
                  <Link href="/admin" className="text-xs font-bold uppercase tracking-wider bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-sm">
                    Admin
                  </Link>
                )}
                <Link href="/orders" className="text-xs font-bold uppercase tracking-wider bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-xl transition-all shadow-sm">
                  My Orders
                </Link>
                <button onClick={() => signOut()} className="text-xs font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl transition-all shadow-sm">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => signIn()} className="text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Sign In
            </button>
          )}
          {/* Cart bubble */}
          <div className="relative flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span className="font-bold text-sm text-slate-800">${totalPrice.toFixed(2)}</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Product Catalog */}
        <section className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"/>
              <h2 className="text-lg font-bold text-slate-800">Product Catalog</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredProducts.length} items</span>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {cat === "All" ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                  <div className="h-40 bg-slate-100 rounded-xl mb-4"/>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"/>
                  <div className="h-3 bg-slate-100 rounded w-1/2"/>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredProducts.map(product => {
                const cartItem = cart.find(c => c.productId === product.id);
                return (
                  <div key={product.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 flex flex-col overflow-hidden">
                    <div className="h-44 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 relative">
                      <img src={product.image} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300"/>
                      <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                        {product.category}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
                        {product.name}
                      </h3>
                      <StarRating rating={product.rating}/>
                      <p className="text-slate-400 text-xs line-clamp-2">{product.description}</p>
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xl font-black text-indigo-700">${product.price.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">{product.stockQuantity} in stock</p>
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-full border border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition flex items-center justify-center">−</button>
                            <span className="w-6 text-center font-bold text-slate-800">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(product.id)} className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center justify-center">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(product.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all whitespace-nowrap">
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && !loadingProducts && (
                <div className="col-span-2 text-center py-16 text-slate-400">
                  <p className="text-4xl mb-2">🔍</p>
                  <p className="font-medium">No products match your search.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: Order Panel */}
        <section className="space-y-4">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
                  <h2 className="text-white font-bold">Order Gateway</h2>
                </div>
                <p className="text-indigo-200 text-xs">Submitted via RabbitMQ → SQL</p>
              </div>
              <div className="p-5 space-y-4">
                {/* Cart items */}
                {cart.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Your cart is empty.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cart.map(c => {
                      const p = products.find(prod => prod.id === c.productId);
                      return (
                        <div key={c.productId} className="flex items-center gap-3 text-sm">
                          <img src={p?.image} alt={p?.name} className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100"/>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-700 truncate text-xs">{p?.name}</p>
                            <p className="text-slate-400 text-xs">${((p?.price ?? 0) * c.quantity).toFixed(2)}</p>
                          </div>
                          <span className="text-xs text-indigo-600 font-bold">×{c.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Payload preview */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-widest">RabbitMQ Payload</p>
                  <pre className="text-indigo-700 font-mono text-[11px] overflow-x-auto">
{JSON.stringify({ userId: 1, productIds: cart.flatMap(c => Array(c.quantity).fill(c.productId)) }, null, 2)}
                  </pre>
                </div>

                {/* Total + Submit */}
                <div className="flex justify-between items-center text-sm font-bold border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Total</span>
                  <span className="text-xl text-indigo-700">${totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={submitOrder}
                  disabled={cart.length === 0 || isProcessing}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    cart.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:from-indigo-500 hover:to-indigo-700 shadow-lg shadow-indigo-600/25 active:scale-95'
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Submit Order (${totalItems} items)`}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
