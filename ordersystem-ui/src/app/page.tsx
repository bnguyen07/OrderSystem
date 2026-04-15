"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

// The shape of our actual backend data!
type Product = {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
};

// Extremely Premium Glassmorphic Tailwind Dashboard
export default function OrderDashboard() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // 1. Fetch exactly from the Catalog Microservice via K8s Ingress!
  useEffect(() => {
    fetch("/api/Product")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Catalog API offline", err));
  }, []);

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
  };

  // 2. Submit the Order directly to the OrderSystem Microservice via K8s Ingress!
  const submitOrder = async () => {
    setIsProcessing(true);
    setOrderStatus("Transmitting Securely to RabbitMQ...");
    
    try {
      // Extract the raw Google Identity Token from our NextAuth session!
      const token = (session as any)?.idToken;

      const response = await fetch("/api/Order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: 1, // You could eventually pull this from session too!
          productIds: cart
        }),
      });

      if (response.status === 202) {
        setOrderStatus("🎉 Order Accepted! Background Worker is securing it.");
        setCart([]); // Clear Cart safely
      } else if (response.status === 401) {
        setOrderStatus("🔒 Unauthorized! Please login to secure a Token.");
      } else {
        setOrderStatus("❌ Order Failed.");
      }
    } catch {
      setOrderStatus("⚠️ Network Error. Is OrderSystem API running?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Area */}
      <header className="mb-12 border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight drop-shadow-sm">
            Enterprise Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Global Microservice Logistics</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Auth Section */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 flex items-center gap-4">
            {session ? (
              <>
                {session.user?.image && (
                  <img src={session.user.image} alt="User Profile" className="w-10 h-10 rounded-full border-2 border-indigo-400 shadow-md" />
                )}
                <div className="flex flex-col text-sm text-left">
                  <span className="font-bold text-slate-800 leading-tight">{session.user?.name}</span>
                  <span className="text-slate-500 text-xs font-medium">{session.user?.email}</span>
                </div>
                <div className="flex gap-2 ml-4">
                  {session.user?.email === "brian.nguyen2447@gmail.com" && (
                    <Link href="/admin" className="text-xs font-bold uppercase tracking-wider bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-3 py-2 rounded-xl transition-all shadow-sm">
                      Admin Grid
                    </Link>
                  )}
                  <Link href="/orders" className="text-xs font-bold uppercase tracking-wider bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 px-3 py-2 rounded-xl transition-all shadow-sm">
                    Orders
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="text-xs font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => signIn()}
                className="text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Sign In
              </button>
            )}
          </div>

          {/* Cart Counter */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="font-bold text-lg text-slate-800">{cart.length} Items</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Catalog Service Segment */}
        <section className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <h2 className="text-xl font-bold tracking-wide text-slate-800">Catalog Service (K8s Ingress)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="group relative bg-white/70 backdrop-blur-md border border-slate-200 hover:border-indigo-400 p-6 rounded-3xl transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/20"
              >
                <h3 className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                <p className="text-indigo-600 font-mono text-xl mb-6 font-bold">${product.price.toFixed(2)}</p>
                
                <div className="flex justify-between items-end">
                  <p className="text-sm text-slate-400 font-medium">{product.stockQuantity} in stock</p>
                  <button 
                    onClick={() => addToCart(product.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* OrderSystem API Segment */}
        <section className="bg-white/60 border border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-indigo-100 relative overflow-hidden">
           {/* Decorative Background Blur */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
           
           <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
            <h2 className="text-xl font-bold tracking-wide text-slate-800">Order Gateway (K8s Ingress)</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner">
              <p className="text-sm text-slate-400 font-semibold mb-2 tracking-wide text-left">RABBITMQ PAYLOAD PREVIEW</p>
              <pre className="text-indigo-700 font-mono text-sm overflow-x-auto text-left bg-slate-100 p-4 rounded-xl border border-slate-200">
{JSON.stringify({ 
  userId: 1, 
  productIds: cart 
}, null, 2)}
              </pre>
            </div>

            <button 
              onClick={submitOrder}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all ${
                cart.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white hover:shadow-indigo-500/30 active:scale-95'
              }`}
            >
              {isProcessing ? 'Processing Transaction...' : 'Submit to Enterprise Queue'}
            </button>

            {/* Status Notifier */}
            {orderStatus && (
              <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-center animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                <p className="text-indigo-600 font-bold">{orderStatus}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
