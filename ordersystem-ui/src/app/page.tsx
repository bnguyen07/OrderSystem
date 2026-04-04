"use client";

import { useEffect, useState } from "react";

// The shape of our actual backend data!
type Product = {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
};

// Extremely Premium Glassmorphic Tailwind Dashboard
export default function OrderDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // 1. Fetch exactly from the Catalog Microservice (Port 5056)
  useEffect(() => {
    fetch("http://localhost:5056/api/Product")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Catalog API offline", err));
  }, []);

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
  };

  // 2. Submit the Order directly to the OrderSystem Microservice (Port 5055)
  const submitOrder = async () => {
    setIsProcessing(true);
    setOrderStatus("Transmitting Securely to RabbitMQ...");
    
    try {
      const response = await fetch("http://localhost:5055/api/Order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Normally we'd pass the actual JWT Token here instead of hardcoding UserId!
        },
        body: JSON.stringify({
          userId: 1, 
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Area */}
      <header className="mb-12 border-b border-white/10 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">
            Enterprise Dashboard
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Global Microservice Logistics</p>
        </div>
        
        {/* Cart Counter */}
        <div className="bg-slate-800/80 backdrop-blur border border-white/10 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span className="font-bold text-lg">{cart.length} Items</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Catalog Service Segment */}
        <section className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            <h2 className="text-xl font-bold tracking-wide">Catalog Service (Port 5056)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="group relative bg-slate-800/40 hover:bg-slate-800/80 backdrop-blur-md border border-white/5 hover:border-indigo-500/50 p-6 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
              >
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{product.name}</h3>
                <p className="text-cyan-400 font-mono text-xl mb-6">${product.price.toFixed(2)}</p>
                
                <div className="flex justify-between items-end">
                  <p className="text-sm text-slate-500 font-medium">{product.stockQuantity} in stock</p>
                  <button 
                    onClick={() => addToCart(product.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* OrderSystem API Segment */}
        <section className="bg-slate-800/30 border border-white/10 rounded-3xl p-8 backdrop-blur shadow-2xl relative overflow-hidden">
           {/* Decorative Background Blur */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
           
           <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
            <h2 className="text-xl font-bold tracking-wide">Order Gateway (Port 5055)</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
              <p className="text-sm text-slate-400 font-medium mb-2 opacity-80">RABBITMQ PAYLOAD PREVIEW</p>
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{JSON.stringify({ 
  userId: 1, 
  productIds: cart 
}, null, 2)}
              </pre>
            </div>

            <button 
              onClick={submitOrder}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${
                cart.length === 0 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white hover:shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {isProcessing ? 'Processing Transaction...' : 'Submit to Enterprise Queue'}
            </button>

            {/* Status Notifier */}
            {orderStatus && (
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-white/10 text-center animate-in fade-in slide-in-from-bottom-2">
                <p className="text-emerald-400 font-medium">{orderStatus}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
