"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar as CalendarIcon, Clock, ArrowLeft, CheckCircle2, Zap, CreditCard, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Privremeni podaci za UI
const classTypes = [
  { id: "trial", name: "15-Min Meet & Greet", duration: 15, price: 0, currency: "EUR", icon: <Zap className="h-6 w-6 text-emerald-500" />, color: "border-emerald-200 bg-emerald-50 hover:border-emerald-500" },
  { id: "intro", name: "30-Min Intro Class", duration: 30, price: 1.7, currency: "EUR", icon: <Clock className="h-6 w-6 text-purple-500" />, color: "border-purple-200 bg-purple-50 hover:border-purple-500", note: "~200 RSD" },
  { id: "30min", name: "30-Min Practice", duration: 30, price: 5, currency: "EUR", icon: <Clock className="h-6 w-6 text-slate-500" />, color: "border-slate-200 bg-white hover:border-purple-500" },
  { id: "45min", name: "45-Min Balanced", duration: 45, price: 8, currency: "EUR", icon: <Clock className="h-6 w-6 text-slate-500" />, color: "border-slate-200 bg-white hover:border-purple-500" },
  { id: "60min", name: "60-Min Immersion", duration: 60, price: 10, currency: "EUR", icon: <Clock className="h-6 w-6 text-slate-500" />, color: "border-purple-600 bg-white hover:border-purple-700 shadow-md", popular: true },
];

const availableTimes = ["09:00", "10:30", "13:00", "15:45", "18:00", "19:30"];

export default function BookClass() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  // Generisanje sledećih 7 dana za kalendar
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate(),
        fullDate: d,
      });
    }
    return days;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/dashboard");
  };

  const calculateDates = () => {
    const day = getNextDays()[selectedDate!];
    const [hours, minutes] = selectedTime!.split(':');
    const startsAt = new Date(day.fullDate);
    startsAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + selectedClass.duration);

    return { startsAt, endsAt };
  };

  const handleConfirmFreeBooking = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { startsAt, endsAt } = calculateDates();

      const { error: bookingError } = await supabase.from('bookings').insert({
        user_id: user.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        type: selectedClass.id,
        status: 'scheduled',
        price_paid: 0,
        currency: 'EUR'
      });

      if (bookingError) throw bookingError;

      setStep(4);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to book class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const order = await actions.order.capture();
      const { startsAt, endsAt } = calculateDates();

      // Save Booking
      const { error: bookingError } = await supabase.from('bookings').insert({
        user_id: user.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        type: selectedClass.id,
        status: 'scheduled',
        price_paid: selectedClass.price,
        currency: selectedClass.currency
      });

      if (bookingError) throw bookingError;

      // Save Payment Record
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user.id,
        paypal_order_id: order.id,
        amount: selectedClass.price,
        currency: selectedClass.currency,
        status: 'completed'
      });

      if (paymentError) throw paymentError;

      setStep(4);
    } catch (err: any) {
      console.error(err);
      setError("Payment was successful, but there was an error saving your booking. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {step < 4 && (
            <button onClick={handleBack} className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          )}
          {step === 4 && (
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
              <ArrowLeft className="h-5 w-5" /> Back to Dashboard
            </Link>
          )}
          {step < 4 && (
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-8 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`h-2.5 w-8 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`h-2.5 w-8 rounded-full ${step >= 3 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Class */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Choose a class</h1>
                <p className="mt-2 font-medium text-slate-500">Select the duration and type of your next lesson.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {classTypes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${cls.color} ${selectedClass?.id === cls.id ? 'ring-4 ring-purple-600/20 border-purple-600 bg-purple-50' : ''}`}
                  >
                    {cls.popular && (
                      <span className="absolute -top-3 right-4 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-bold text-white">
                        Popular
                      </span>
                    )}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-xl bg-white p-2 shadow-sm">{cls.icon}</div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">
                          {cls.price === 0 ? "Free" : `${cls.price} ${cls.currency}`}
                        </div>
                        {cls.note && <div className="text-xs font-bold text-slate-500">{cls.note}</div>}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900">{cls.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{cls.duration} minutes</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedClass}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-purple-700 bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-b-4"
              >
                Continue <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Select Date & Time */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Pick a time</h1>
                <p className="mt-2 font-medium text-slate-500">When would you like to have your {selectedClass?.duration}-min class?</p>
              </div>

              {/* Date Selector */}
              <div>
                <h3 className="mb-4 font-bold text-slate-700 flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-purple-500"/> Select Date</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {getNextDays().map((day, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(i)}
                      className={`flex min-w-[80px] flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${selectedDate === i ? 'border-purple-600 bg-purple-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}
                    >
                      <span className="text-sm font-bold uppercase opacity-80">{day.dayName}</span>
                      <span className="text-2xl font-black">{day.dateNum}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selector */}
              <div className={`transition-opacity ${selectedDate !== null ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="mb-4 font-bold text-slate-700 flex items-center gap-2"><Clock className="h-5 w-5 text-purple-500"/> Select Time (Your Local Timezone)</h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border-2 py-3 font-bold transition-all ${selectedTime === time ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={selectedDate === null || selectedTime === null}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-purple-700 bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-b-4"
              >
                Review Booking <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">Almost there!</h1>
                <p className="mt-2 font-medium text-slate-500">Review your booking details below.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
                <div className="border-b-2 border-slate-100 bg-slate-50 p-6">
                  <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">Class Type</h3>
                  <div className="text-xl font-black text-slate-900">{selectedClass?.name}</div>
                </div>
                <div className="flex items-center gap-4 border-b-2 border-slate-100 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">Date & Time</h3>
                    <div className="font-bold text-slate-900">
                      {selectedDate !== null && getNextDays()[selectedDate].fullDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-6">
                  <span className="font-bold text-slate-600">Total Due</span>
                  <span className="text-2xl font-black text-slate-900">
                    {selectedClass?.price === 0 ? "Free" : `${selectedClass?.price} ${selectedClass?.currency}`}
                  </span>
                </div>
              </div>

              {selectedClass?.price === 0 ? (
                <button
                  onClick={handleConfirmFreeBooking}
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-700 bg-emerald-600 px-6 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-b-4"
                >
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Confirm Booking <CheckCircle2 className="h-5 w-5" /></>}
                </button>
              ) : (
                <div className="mt-4">
                  {isSubmitting ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", currency: selectedClass.currency }}>
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "gold" }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
                                description: selectedClass.name,
                                amount: {
                                  currency_code: selectedClass.currency,
                                  value: selectedClass.price.toString(),
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={handlePayPalApprove}
                        onError={(err) => {
                          console.error(err);
                          setError("PayPal encountered an error. Please try again.");
                        }}
                      />
                    </PayPalScriptProvider>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-6 text-center py-12"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900">Booking Confirmed!</h1>
                <p className="mt-4 text-lg font-medium text-slate-500">
                  Your class has been successfully scheduled. You'll receive an email confirmation shortly.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-8 flex items-center justify-center gap-2 rounded-2xl border-b-4 border-purple-700 bg-purple-600 px-8 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
