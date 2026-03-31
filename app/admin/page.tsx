"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sendEmailNotification } from "@/lib/email";
import { Loader2, Calendar, DollarSign, LogOut, Save, Clock, CalendarDays, Lock, Unlock, Plus, Trash2, Users } from "lucide-react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [savingStudent, setSavingStudent] = useState<string | null>(null);
  const [processingBlock, setProcessingBlock] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const localDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setSelectedDate(localDateStr);

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push("/dashboard");
        return;
      }

      await Promise.all([
        fetchBookings(),
        fetchProducts(),
        fetchAvailability(),
        fetchBlockedTimes(),
        fetchStudents()
      ]);

      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name', { ascending: true });
    if (error) console.error("Error fetching students:", error);
    if (data) setStudents(data);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, student_profiles(full_name)')
      .order('starts_at', { ascending: false });
    if (error) console.error("Error fetching bookings:", error);
    if (data) setBookings(data);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('duration_min', { ascending: true });
    if (error) console.error("Error fetching products:", error);
    if (data) setProducts(data);
  };

  const fetchAvailability = async () => {
    const { data, error } = await supabase.from('weekly_availability').select('*').order('day_of_week').order('start_time');
    if (error) console.error("Error fetching availability:", error);
    if (data) setWeeklyAvailability(data);
  };

  const fetchBlockedTimes = async () => {
    // Fetch from yesterday to avoid timezone cutoff issues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data, error } = await supabase.from('blocked_times').select('*').gte('ends_at', yesterday.toISOString());
    if (error) console.error("Error fetching blocked times:", error);
    if (data) setBlockedTimes(data);
  };

  const handleUpdatePrice = async (productId: string, newPrice: number) => {
    setSavingProduct(productId);
    const { error } = await supabase.from('products').update({ price: newPrice }).eq('id', productId);
    if (error) alert("Greška pri čuvanju cene: " + error.message);
    await fetchProducts();
    setSavingProduct(null);
  };

  const handleAddProduct = async () => {
    const name = prompt("Enter class name (e.g., '60 Min Conversational'):");
    if (!name) return;
    const durationStr = prompt("Enter duration in minutes (e.g., 60):");
    if (!durationStr) return;
    const priceStr = prompt("Enter price in EUR (e.g., 20):");
    if (!priceStr) return;
    
    const duration_min = parseInt(durationStr);
    const price = parseFloat(priceStr);
    
    if (isNaN(duration_min) || isNaN(price)) {
      alert("Invalid duration or price.");
      return;
    }
    
    const { error } = await supabase.from('products').insert({
      name,
      description: `A ${duration_min}-minute English class.`,
      duration_min,
      price
    });
    
    if (error) alert("Greška pri dodavanju klase: " + error.message);
    await fetchProducts();
  };

  const handleUpdateStudent = async (studentId: string, updates: any) => {
    setSavingStudent(studentId);
    const { error } = await supabase.from('student_profiles').update(updates).eq('id', studentId);
    if (error) alert("Greška pri ažuriranju studenta: " + error.message);
    await fetchStudents();
    setSavingStudent(null);
  };

  const handleConfirmBooking = async (bookingId: string, studentEmail: string, studentName: string, dateStr: string, timeStr: string, isEdit: boolean = false) => {
    const videoLink = window.prompt("Unesite link za video poziv (npr. Google Meet, Zoom):");
    if (videoLink === null) return; // User canceled

    const { error } = await supabase.from('bookings').update({ 
      status: 'scheduled',
      video_link: videoLink
    }).eq('id', bookingId);

    if (error) {
      alert("Greška pri čuvanju linka: " + error.message);
    } else {
      // Send email to student
      if (studentEmail) {
        const subject = isEdit ? "Ažuriran link za video poziv" : "Vaš čas je potvrđen!";
        const title = isEdit ? "Ažuriran link za čas" : "Čas je potvrđen";
        const message = isEdit 
          ? `<p>Zdravo ${studentName},</p><p>Link za vaš čas zakazan za ${dateStr} u ${timeStr} je ažuriran.</p>`
          : `<p>Zdravo ${studentName},</p><p>Vaš čas zakazan za ${dateStr} u ${timeStr} je potvrđen.</p>`;

        sendEmailNotification(
          studentEmail,
          subject,
          `<h1>${title}</h1>
           ${message}
           <p>Link za video poziv: <a href="${videoLink}">${videoLink}</a></p>`
        );
      }
      fetchBookings();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      const { data: bookingToCancel } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      const { error } = await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
      if (error) {
        alert("Greška pri otkazivanju: " + error.message);
      } else {
        if (bookingToCancel) {
          const dateStr = new Date(bookingToCancel.starts_at).toLocaleDateString();
          const timeStr = new Date(bookingToCancel.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          // To Admin
          sendEmailNotification(
            "admin@example.com", // Replace with real admin email
            "Class Canceled by Admin",
            `<h1>Class Canceled</h1><p>You have canceled the class scheduled for ${dateStr} at ${timeStr}.</p>`
          );
          
          // Note: To send to the student, we would need their email stored in the bookings or student_profiles table.
        }
        fetchBookings();
      }
    }
  };

  const handleUpdateWeekly = async (id: string, updates: any) => {
    const { error } = await supabase.from('weekly_availability').update(updates).eq('id', id);
    if (error) alert("Greška pri ažuriranju bloka: " + error.message);
    fetchAvailability();
  };

  const handleAddWeeklyBlock = async (dayOfWeek: number) => {
    const { error } = await supabase.from('weekly_availability').insert({
      day_of_week: dayOfWeek,
      start_time: '09:00:00',
      end_time: '17:00:00',
      is_active: true
    });
    
    if (error) {
      console.error("Add block error:", error);
      alert(`Greška pri dodavanju bloka: ${error.message}\n\nAko piše "duplicate key value violates unique constraint", to znači da baza ne dozvoljava više od jednog bloka po danu. Moraš obrisati UNIQUE constraint u Supabase SQL editoru.`);
    }
    fetchAvailability();
  };

  const handleDeleteWeeklyBlock = async (id: string) => {
    const { error } = await supabase.from('weekly_availability').delete().eq('id', id);
    if (error) alert("Greška pri brisanju bloka: " + error.message);
    fetchAvailability();
  };

  const handleToggleBlock = async (start: Date, end: Date, currentStatus: any) => {
    if (currentStatus.status === 'booked') return;
    
    const slotKey = start.toISOString();
    setProcessingBlock(slotKey);

    if (currentStatus.status === 'blocked') {
      const { error } = await supabase.from('blocked_times').delete().eq('id', currentStatus.blocked.id);
      if (error) {
        console.error("Delete block error:", error);
        alert("Greška pri odblokiranju: " + error.message);
      }
    } else {
      const { error } = await supabase.from('blocked_times').insert({
        starts_at: start.toISOString(),
        ends_at: end.toISOString()
      });
      if (error) {
        console.error("Insert block error:", error);
        alert("Greška pri blokiranju: " + error.message + "\n\nProveri da li tabela 'blocked_times' postoji i da li ima RLS polise koje blokiraju unos.");
      }
    }
    
    await fetchBlockedTimes();
    setProcessingBlock(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // --- Schedule Logic ---
  const getSlotsForDate = (dateStr: string) => {
    if (!dateStr || weeklyAvailability.length === 0) return [];
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Get all active blocks for this day
    const dayBlocks = weeklyAvailability.filter(d => d.day_of_week === dayOfWeek && d.is_active);
    
    if (dayBlocks.length === 0) return [];

    const slots: {start: Date, end: Date}[] = [];
    
    // Generate 15-min slots for each block
    dayBlocks.forEach(block => {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      
      let current = new Date(year, month - 1, day, startH, startM);
      const end = new Date(year, month - 1, day, endH, endM);

      while (current < end) {
        const slotEnd = new Date(current.getTime() + 15 * 60000); // 15 min slots
        if (slotEnd <= end) {
          slots.push({ start: new Date(current), end: slotEnd });
        }
        current = slotEnd;
      }
    });

    // Sort slots by time just in case blocks overlap or are out of order
    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const getSlotStatus = (start: Date, end: Date) => {
    const booking = bookings.find(b => {
      if (b.status !== 'scheduled') return false;
      const bStart = new Date(b.starts_at);
      const bEnd = new Date(b.ends_at);
      return (start >= bStart && start < bEnd) || (end > bStart && end <= bEnd) || (start <= bStart && end >= bEnd);
    });
    if (booking) return { status: 'booked', booking };

    const blocked = blockedTimes.find(b => {
       const bStart = new Date(b.starts_at);
       const bEnd = new Date(b.ends_at);
       return (start >= bStart && start < bEnd) || (end > bStart && end <= bEnd) || (start <= bStart && end >= bEnd);
    });
    if (blocked) return { status: 'blocked', blocked };

    return { status: 'free' };
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
      <nav className="flex items-center justify-between border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="text-xl font-bold tracking-tight text-slate-800">
          Admin <span className="text-purple-600">Panel</span>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row">
        <aside className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-2 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
            <button onClick={() => setActiveTab("schedule")} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "schedule" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Clock className="h-5 w-5" /> My Schedule
            </button>
            <button onClick={() => setActiveTab("bookings")} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "bookings" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Calendar className="h-5 w-5" /> All Bookings
            </button>
            <button onClick={() => setActiveTab("pricing")} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "pricing" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <DollarSign className="h-5 w-5" /> Pricing & Plans
            </button>
            <button onClick={() => setActiveTab("students")} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${activeTab === "students" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Users className="h-5 w-5" /> Students
            </button>
          </div>
        </aside>

        <main className="flex-1">
          {/* SCHEDULE TAB */}
          {activeTab === "schedule" && (
            <div className="flex flex-col gap-6">
              {/* Manual Override Section */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b-2 border-slate-100 bg-slate-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Manual Override</h2>
                    <p className="text-sm font-medium text-slate-500">Block specific 15-min times so students cannot book them.</p>
                  </div>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-xl border-2 border-slate-200 px-4 py-2 font-bold text-slate-700 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="p-6">
                  {getSlotsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-medium">
                      You are not working on this day according to your weekly schedule.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {getSlotsForDate(selectedDate).map((slot, i) => {
                        const statusInfo = getSlotStatus(slot.start, slot.end);
                        const timeStr = slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        const isProcessing = processingBlock === slot.start.toISOString();
                        
                        if (statusInfo.status === 'booked') {
                          return (
                            <div key={i} className="flex flex-col items-center justify-center rounded-xl border-2 border-purple-200 bg-purple-50 p-2 opacity-70 cursor-not-allowed">
                              <span className="text-sm font-bold text-purple-900">{timeStr}</span>
                              <span className="text-[10px] font-bold text-purple-600 truncate w-full text-center">{statusInfo.booking.student_profiles?.full_name}</span>
                            </div>
                          );
                        }
                        if (statusInfo.status === 'blocked') {
                          return (
                            <button key={i} disabled={isProcessing} onClick={() => handleToggleBlock(slot.start, slot.end, statusInfo)} className="flex flex-col items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-2 hover:bg-red-100 transition-colors disabled:opacity-50">
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-red-600 mb-1" /> : <span className="text-sm font-bold text-red-900">{timeStr}</span>}
                              <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><Lock className="h-3 w-3"/> Blocked</span>
                            </button>
                          );
                        }
                        return (
                          <button key={i} disabled={isProcessing} onClick={() => handleToggleBlock(slot.start, slot.end, statusInfo)} className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600 mb-1" /> : <span className="text-sm font-bold text-slate-700">{timeStr}</span>}
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Unlock className="h-3 w-3"/> Free</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Default Weekly Hours */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                  <h2 className="text-xl font-extrabold text-slate-900">Default Weekly Hours</h2>
                  <p className="text-sm font-medium text-slate-500">Set multiple availability blocks for each day.</p>
                </div>
                <div className="flex flex-col p-6 gap-6">
                  {DAYS.map((dayName, index) => {
                    const dayBlocks = weeklyAvailability.filter(w => w.day_of_week === index);
                    
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-100 pb-6 gap-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 pt-2">
                          <span className="font-bold text-slate-700 w-24">{dayName}</span>
                        </div>
                        
                        <div className="flex flex-col gap-3 flex-1">
                          {dayBlocks.length > 0 ? (
                            dayBlocks.map((block) => (
                              <div key={block.id} className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={block.start_time.slice(0,5)} 
                                  onChange={(e) => handleUpdateWeekly(block.id, { start_time: e.target.value + ':00' })} 
                                  className="rounded-lg border-2 border-slate-200 px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-purple-600" 
                                />
                                <span className="text-slate-400 font-medium">to</span>
                                <input 
                                  type="time" 
                                  value={block.end_time.slice(0,5)} 
                                  onChange={(e) => handleUpdateWeekly(block.id, { end_time: e.target.value + ':00' })} 
                                  className="rounded-lg border-2 border-slate-200 px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-purple-600" 
                                />
                                <div className="flex items-center ml-2 gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={block.is_active} 
                                      onChange={(e) => handleUpdateWeekly(block.id, { is_active: e.target.checked })}
                                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                                    />
                                    <span className="text-sm font-medium text-slate-600">Active</span>
                                  </label>
                                  <button 
                                    onClick={() => handleDeleteWeeklyBlock(block.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 font-medium italic py-2">Not working</span>
                          )}
                          
                          <button 
                            onClick={() => handleAddWeeklyBlock(index)}
                            className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 w-fit mt-1"
                          >
                            <Plus className="h-4 w-4" /> Add Block
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
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
                              booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {booking.status}
                            </span>
                            {booking.status === 'pending' && (
                              <button 
                                onClick={() => handleConfirmBooking(
                                  booking.id, 
                                  booking.student_email, 
                                  booking.student_profiles?.full_name || "Student", 
                                  new Date(booking.starts_at).toLocaleDateString(), 
                                  new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                )} 
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                Confirm & Add Link
                              </button>
                            )}
                            {booking.status === 'scheduled' && (
                              <>
                                <button 
                                  onClick={() => handleConfirmBooking(
                                    booking.id, 
                                    booking.student_email, 
                                    booking.student_profiles?.full_name || "Student", 
                                    new Date(booking.starts_at).toLocaleDateString(), 
                                    new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    true
                                  )} 
                                  className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline"
                                >
                                  {booking.video_link ? 'Edit Link' : 'Add Link'}
                                </button>
                                <button onClick={() => handleCancelBooking(booking.id)} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline">
                                  Cancel
                                </button>
                              </>
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

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Student Management</h2>
                <p className="text-sm font-medium text-slate-500">View and update your students' profiles.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Level</th>
                      <th className="px-6 py-4">Timezone</th>
                      <th className="px-6 py-4">Notes & Progress</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <input
                            type="text"
                            defaultValue={student.full_name || ""}
                            id={`name-${student.id}`}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 outline-none transition-all focus:border-purple-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            defaultValue={student.level || "A0"}
                            id={`level-${student.id}`}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 outline-none transition-all focus:border-purple-600"
                          >
                            <option value="A0">A0 - Absolute Beginner</option>
                            <option value="A1">A1 - Beginner</option>
                            <option value="A2">A2 - Elementary</option>
                            <option value="B1">B1 - Intermediate</option>
                            <option value="B2">B2 - Upper Intermediate</option>
                            <option value="C1">C1 - Advanced</option>
                            <option value="C2">C2 - Proficient</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            defaultValue={student.timezone || ""}
                            id={`tz-${student.id}`}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 outline-none transition-all focus:border-purple-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <textarea
                            defaultValue={student.notes || ""}
                            id={`notes-${student.id}`}
                            placeholder="Add progress notes..."
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 min-h-[60px] resize-y"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById(`name-${student.id}`) as HTMLInputElement;
                              const levelSelect = document.getElementById(`level-${student.id}`) as HTMLSelectElement;
                              const tzInput = document.getElementById(`tz-${student.id}`) as HTMLInputElement;
                              const notesInput = document.getElementById(`notes-${student.id}`) as HTMLTextAreaElement;
                              if (nameInput && levelSelect && tzInput && notesInput) {
                                handleUpdateStudent(student.id, {
                                  full_name: nameInput.value,
                                  level: levelSelect.value,
                                  timezone: tzInput.value,
                                  notes: notesInput.value
                                });
                              }
                            }}
                            disabled={savingStudent === student.id}
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                          >
                            {savingStudent === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center font-medium text-slate-500">
                          No students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === "pricing" && (
            <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b-2 border-slate-100 bg-slate-50 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Pricing & Plans</h2>
                  <p className="text-sm font-medium text-slate-500">Update the prices for your classes. Changes apply immediately.</p>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 font-bold text-white transition-all hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" /> Add Class
                </button>
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
