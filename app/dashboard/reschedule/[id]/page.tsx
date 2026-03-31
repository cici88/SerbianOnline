"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { sendEmailNotification } from "@/lib/email";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ReschedulePage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);

  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch the specific booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*, products(*)')
        .eq('id', bookingId)
        .single();

      if (bookingError || !bookingData || bookingData.student_id !== session.user.id) {
        router.push("/dashboard");
        return;
      }

      // Check 24h rule
      const startsAt = new Date(bookingData.starts_at);
      const now = new Date();
      const hoursDifference = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDifference < 24) {
        setError("Classes can only be rescheduled at least 24 hours in advance.");
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      // Fetch availability, blocked times, and all other bookings
      const [availRes, blockedRes, bookingsRes] = await Promise.all([
        supabase.from('weekly_availability').select('*'),
        supabase.from('blocked_times').select('*').gte('ends_at', new Date().toISOString()),
        supabase.from('bookings').select('*').eq('status', 'scheduled').gte('ends_at', new Date().toISOString()).neq('id', bookingId)
      ]);

      if (availRes.data) setWeeklyAvailability(availRes.data);
      if (blockedRes.data) setBlockedTimes(blockedRes.data);
      if (bookingsRes.data) setAllBookings(bookingsRes.data);

      setLoading(false);
    };

    init();
  }, [router, bookingId]);

  // Generate next 14 days
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      days.push({
        date: nextDay.getDate(),
        day: nextDay.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: nextDay
      });
    }
    return days;
  };

  const getAvailableTimesForDate = (dateIndex: number) => {
    if (!booking?.products) return [];
    const day = getNextDays()[dateIndex];
    const dayOfWeek = day.fullDate.getDay();
    
    // Get all active blocks for this day
    const dayBlocks = weeklyAvailability.filter(d => d.day_of_week === dayOfWeek && d.is_active);
    
    if (dayBlocks.length === 0) return [];

    const year = day.fullDate.getFullYear();
    const month = day.fullDate.getMonth();
    const dateNum = day.fullDate.getDate();
    const now = new Date();

    const available: string[] = [];
    const durationMin = booking.products.duration_min;

    dayBlocks.forEach(block => {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      
      let current = new Date(year, month, dateNum, startH, startM);
      const endOfDay = new Date(year, month, dateNum, endH, endM);

      while (current < endOfDay) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + durationMin * 60000);

        if (slotEnd <= endOfDay && slotStart > now) {
          // Check overlaps
          const isOverlapping = allBookings.some(b => {
            const bStart = new Date(b.starts_at);
            const bEnd = new Date(b.ends_at);
            return (slotStart < bEnd && slotEnd > bStart);
          }) || blockedTimes.some(b => {
            const bStart = new Date(b.starts_at);
            const bEnd = new Date(b.ends_at);
            return (slotStart < bEnd && slotEnd > bStart);
          });

          if (!isOverlapping) {
            const timeStr = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            if (!available.includes(timeStr)) {
              available.push(timeStr);
            }
          }
        }
        // Increment by 15 mins for the next possible start time
        current = new Date(current.getTime() + 15 * 60000);
      }
    });

    // Sort times just in case blocks are out of order
    return available.sort();
  };

  const handleConfirmReschedule = async () => {
    if (selectedDateIndex === null || !selectedTime || !booking) return;
    setIsRescheduling(true);

    const date = getNextDays()[selectedDateIndex].fullDate;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    const endsAt = new Date(date.getTime() + booking.products.duration_min * 60000);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        starts_at: date.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq('id', booking.id);

    setIsRescheduling(false);
    
    if (!updateError) {
      setSuccess(true);
      
      // Send email notifications
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // To Student
      sendEmailNotification(
        user.email,
        "Class Rescheduled Successfully",
        `<h1>Rescheduling Confirmed</h1><p>You have successfully rescheduled your class to ${dateStr} at ${timeStr}.</p>`
      );
      
      // To Admin
      sendEmailNotification(
        "admin@example.com", // Replace with real admin email or fetch from DB
        "Class Rescheduled",
        `<h1>Class Rescheduled</h1><p>A student (${user.email}) has rescheduled their class to ${dateStr} at ${timeStr}.</p>`
      );
    } else {
      alert("Failed to reschedule. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Cannot Reschedule</h1>
        <p className="mb-8 max-w-md font-medium text-slate-500">{error}</p>
        <Link href="/dashboard" className="rounded-xl bg-slate-200 px-8 py-4 font-bold text-slate-700 transition-all hover:bg-slate-300">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Successfully Rescheduled!</h1>
        <p className="mb-8 max-w-md font-medium text-slate-500">
          Your class has been moved to the new time.
        </p>
        <Link href="/dashboard" className="rounded-xl bg-purple-600 px-8 py-4 font-bold text-white transition-all hover:bg-purple-700">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-10 border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
            <ArrowLeft className="h-5 w-5" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Reschedule Class</h1>
          <p className="mb-8 font-medium text-slate-500">
            Current time: <span className="font-bold text-slate-700">{new Date(booking.starts_at).toLocaleString()}</span>
          </p>
          
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
              <Calendar className="h-5 w-5 text-purple-600" /> Choose a New Day
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {getNextDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDateIndex(index);
                    setSelectedTime(null);
                  }}
                  className={`flex min-w-[80px] flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${
                    selectedDateIndex === index
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{day.day}</span>
                  <span className="text-2xl font-extrabold">{day.date}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedDateIndex !== null && (
            <div className="animate-in fade-in duration-300">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Clock className="h-5 w-5 text-purple-600" /> Choose a New Time
              </h3>
              {getAvailableTimesForDate(selectedDateIndex).length === 0 ? (
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center font-medium text-slate-500">
                  No available times for this date. Please select another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {getAvailableTimesForDate(selectedDateIndex).map((time, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border-2 py-3 text-center font-bold transition-all ${
                        selectedTime === time
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-12 flex gap-4">
            <button
              onClick={handleConfirmReschedule}
              disabled={selectedDateIndex === null || !selectedTime || isRescheduling}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
            >
              {isRescheduling ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm New Time"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
