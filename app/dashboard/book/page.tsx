"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { sendEmailNotification } from "@/lib/email";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function BookClassPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<any[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch products, availability, blocked times, and bookings
      const [productsRes, availRes, blockedRes, bookingsRes] = await Promise.all([
        supabase.from('products').select('*').order('duration_min', { ascending: true }),
        supabase.from('weekly_availability').select('*'),
        supabase.from('blocked_times').select('*').gte('ends_at', new Date().toISOString()),
        supabase.from('bookings').select('*').in('status', ['scheduled', 'pending']).gte('ends_at', new Date().toISOString())
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (availRes.data) setWeeklyAvailability(availRes.data);
      if (blockedRes.data) setBlockedTimes(blockedRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);

      setLoading(false);
    };

    init();
  }, [router]);

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
    if (!selectedClass) return [];
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

    dayBlocks.forEach(block => {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      
      let current = new Date(year, month, dateNum, startH, startM);
      const endOfDay = new Date(year, month, dateNum, endH, endM);

      while (current < endOfDay) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + selectedClass.duration_min * 60000);

        if (slotEnd <= endOfDay && slotStart > now) {
          // Check overlaps
          const isOverlapping = bookings.some(b => {
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

  const handleBookFreeClass = async () => {
    if (!selectedClass || selectedDateIndex === null || !selectedTime || !user) return;
    setIsBooking(true);

    const date = getNextDays()[selectedDateIndex].fullDate;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    const endsAt = new Date(date.getTime() + selectedClass.duration_min * 60000);

    const { error } = await supabase.from('bookings').insert({
      student_id: user.id,
      student_email: user.email,
      product_id: selectedClass.id,
      starts_at: date.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'pending',
      type: `${selectedClass.duration_min}min`
    });

    setIsBooking(false);
    if (!error) {
      setBookingSuccess(true);
      
      // Send email notifications
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // To Student
      sendEmailNotification(
        user.email,
        "Class Booked Successfully",
        `<h1>Booking Confirmed</h1><p>You have successfully booked a ${selectedClass.name} class on ${dateStr} at ${timeStr}.</p>`
      );
      
      // To Admin
      sendEmailNotification(
        "admin@example.com", // Replace with real admin email or fetch from DB
        "New Class Booked",
        `<h1>New Booking</h1><p>A student (${user.email}) has booked a ${selectedClass.name} class on ${dateStr} at ${timeStr}.</p>`
      );
      
    } else {
      alert("Failed to book class. Please try again.");
    }
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    return actions.order.capture().then(async (details: any) => {
      if (!selectedClass || selectedDateIndex === null || !selectedTime || !user) return;
      setIsBooking(true);

      const date = getNextDays()[selectedDateIndex].fullDate;
      const [hours, minutes] = selectedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);

      const endsAt = new Date(date.getTime() + selectedClass.duration_min * 60000);

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase.from('bookings').insert({
        student_id: user.id,
        student_email: user.email,
        product_id: selectedClass.id,
        starts_at: date.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'pending',
        type: `${selectedClass.duration_min}min`
      }).select().single();

      if (!bookingError && bookingData) {
        // Record payment
        await supabase.from('payments').insert({
          booking_id: bookingData.id,
          student_id: user.id,
          amount: selectedClass.price,
          currency: 'EUR',
          status: 'completed',
          provider_transaction_id: details.id
        });
        setBookingSuccess(true);
        
        // Send email notifications
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // To Student
        sendEmailNotification(
          user.email,
          "Class Booked Successfully",
          `<h1>Booking Confirmed</h1><p>You have successfully booked a ${selectedClass.name} class on ${dateStr} at ${timeStr}.</p>`
        );
        
        // To Admin
        sendEmailNotification(
          "admin@example.com", // Replace with real admin email or fetch from DB
          "New Class Booked",
          `<h1>New Booking</h1><p>A student (${user.email}) has booked a ${selectedClass.name} class on ${dateStr} at ${timeStr}.</p>`
        );
      } else {
        alert("Payment successful but booking failed. Please contact support.");
      }
      setIsBooking(false);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Class Booked!</h1>
        <p className="mb-8 max-w-md font-medium text-slate-500">
          Your {selectedClass?.duration_min}-minute class has been successfully scheduled. You can view or manage it from your dashboard.
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
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <span className={step >= 1 ? "text-purple-600" : ""}>1. Class</span>
            <span>/</span>
            <span className={step >= 2 ? "text-purple-600" : ""}>2. Time</span>
            <span>/</span>
            <span className={step >= 3 ? "text-purple-600" : ""}>3. Pay</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Select a Class</h1>
            <p className="mb-8 font-medium text-slate-500">Choose the duration that fits your needs.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {products.length === 0 ? (
                <div className="col-span-full rounded-3xl border-2 border-slate-200 bg-white p-8 text-center">
                  <p className="text-lg font-bold text-slate-500">No classes available at the moment.</p>
                  <p className="text-sm text-slate-400">Please check back later or contact the teacher.</p>
                </div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedClass(product);
                      setStep(2);
                    }}
                    className="flex flex-col items-start rounded-3xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:border-purple-600 hover:shadow-md focus:border-purple-600 focus:outline-none"
                  >
                    <div className="mb-4 flex w-full items-center justify-between">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                        {product.duration_min} Min
                      </span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {product.price === 0 ? "Free" : `€${product.price}`}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-slate-900">{product.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{product.description}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Select Date & Time</h1>
            <p className="mb-8 font-medium text-slate-500">When would you like to have your {selectedClass?.duration_min}-min class?</p>
            
            <div className="mb-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Calendar className="h-5 w-5 text-purple-600" /> Choose a Day
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
                  <Clock className="h-5 w-5 text-purple-600" /> Choose a Time
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
                onClick={() => setStep(1)}
                className="rounded-xl border-2 border-slate-200 bg-white px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedDateIndex === null || !selectedTime}
                className="flex-1 rounded-xl bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Review & Confirm</h1>
            <p className="mb-8 font-medium text-slate-500">Double check your class details before confirming.</p>
            
            <div className="mb-8 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
              <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-900">{selectedClass?.name}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedClass?.duration_min} Minutes</p>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium text-slate-500">Date</span>
                  <span className="font-bold text-slate-900">
                    {selectedDateIndex !== null && getNextDays()[selectedDateIndex].fullDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium text-slate-500">Time</span>
                  <span className="font-bold text-slate-900">{selectedTime}</span>
                </div>
                <div className="mt-6 flex items-center justify-between border-t-2 border-slate-100 pt-4">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-purple-600">
                    {selectedClass?.price === 0 ? "Free" : `€${selectedClass?.price}`}
                  </span>
                </div>
              </div>
            </div>

            {selectedClass?.price === 0 ? (
              <button
                onClick={handleBookFreeClass}
                disabled={isBooking}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-70"
              >
                {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Free Booking"}
              </button>
            ) : (
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                  <CreditCard className="h-5 w-5 text-purple-600" /> Payment
                </h3>
                <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", currency: "EUR" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", shape: "rect", color: "black" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              currency_code: "EUR",
                              value: selectedClass.price.toString(),
                            },
                            description: `${selectedClass.name} - ${selectedClass.duration_min} Min`,
                          },
                        ],
                      });
                    }}
                    onApprove={handlePayPalApprove}
                  />
                </PayPalScriptProvider>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full text-center font-bold text-slate-500 hover:text-slate-700"
            >
              Go Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
