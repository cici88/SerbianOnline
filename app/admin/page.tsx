"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, Calendar, DollarSign, Settings, LogOut, Save } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push("/dashboard");
        return;
      }

      // Fetch data
      await Promise.all([
        fetchBookings(),
        fetchProducts()
      ]);

      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, student_profiles(full_name)')
      .order('starts_at', { ascending: false });
    
    if (data) setBookings(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('duration_min', { ascending: true });
    
    if (data) setProducts(data);
  };

  const handleUpdatePrice = async (productId: string, newPrice: number) => {
    setSavingProduct(productId);
    await supabase.from('products').update({ price: newPrice }).eq('id', productId);
    await fetchProducts();
    setSavingProduct(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
      fetchBookings();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Nav */}
      <nav className="flex items-center justify-between border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="text-xl font-bold tracking-tight text-slate-800">
          Admin <span className="text-purple-600">Panel</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-2 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "bookings" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Calendar className="h-5 w-5" />
              All Bookings
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "pricing" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <DollarSign className="h-5 w-5" />
              Pricing & Plans
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === "bookings" && (
            <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                <h2 className="text-xl font-extrabold text-slate-900">All Bookings</h2>
                <p className="text-sm font-medium text-slate-500">View and manage all student classes.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {booking.student_profiles?.full_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {new Date(booking.starts_at).toLocaleDateString()} at {new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 capitalize">
                          {booking.type.replace('min', ' Min')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                              booking.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' :
                              booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {booking.status}
                            </span>
                            {booking.status === 'scheduled' && (
                              <button 
                                onClick={() => handleCancelBooking(booking.id)} 
                                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center font-medium text-slate-500">
                          No bookings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Pricing & Plans</h2>
                <p className="text-sm font-medium text-slate-500">Update the prices for your classes. Changes apply immediately.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{product.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{product.duration_min} minutes</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={product.price}
                          id={`price-${product.id}`}
                          className="w-24 rounded-xl border-2 border-slate-200 bg-white py-2 pl-8 pr-3 font-bold text-slate-900 outline-none transition-all focus:border-purple-600"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const input = document.getElementById(`price-${product.id}`) as HTMLInputElement;
                          if (input) handleUpdatePrice(product.id, parseFloat(input.value));
                        }}
                        disabled={savingProduct === product.id}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                      >
                        {savingProduct === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
