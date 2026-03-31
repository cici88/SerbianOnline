"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar as CalendarIcon, Clock, ArrowLeft, CheckCircle2, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const availableTimes = ["09:00", "10:30", "13:00", "15:45", "18:00", "19:30"];

export default function RescheduleClass() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch booking
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', session.user.id)
        .single();

      if (error || !data) {
        router.push("/dashboard");
        return;
      }

      // Check 24h rule
      const hoursDifference = (new Date(data.starts_at).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      if (hoursDifference < 24) {
        alert("Classes can only be rescheduled at least 24 hours in advance.");
        router.push("/dashboard");
        return;
      }

      setBooking(data);
    };

    init();
  }, [router, bookingId]);

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
    if (step < 2) setStep(step + 1);
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

    // Calculate duration based on type
    let duration = 30;
    if (booking.type === 'trial') duration = 15;
    if (booking.type === '45min') duration = 45;
    if (booking.type === '60min') duration = 60;

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + duration);

    return { startsAt, endsAt };
  };

  const handleConfirmReschedule = async () => {
    if (!user || !booking) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { startsAt, endsAt } = calculateDates();

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reschedule class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-10 border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {step < 3 && (
            <button onClick={handleBack} className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          )}
          {step === 3 && (
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
              <ArrowLeft className="h-5 w-5" /> Back to Dashboard
            </Link>
          )}
          {step < 3 && (
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-8 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`h-2.5 w-8 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Date & Time */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Reschedule your class</h1>
                <p className="mt-2 font-medium text-slate-500">Pick a new time for your {booking.type.replace('min', ' Min')} Class.</p>
              </div>

              <div>
                <h3 className="mb-4 font-bold text-slate-700 flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-purple-500"/> Select New Date</h3>
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

              <div className={`transition-opacity ${selectedDate !== null ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="mb-4 font-bold text-slate-700 flex items-center gap-2"><Clock className="h-5 w-5 text-purple-500"/> Select New Time</h3>
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
                Review Changes <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">Confirm Reschedule</h1>
                <p className="mt-2 font-medium text-slate-500">Please confirm your new class time.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-4 border-b-2 border-slate-100 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">New Date & Time</h3>
                    <div className="font-bold text-slate-900">
                      {selectedDate !== null && getNextDays()[selectedDate].fullDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmReschedule}
                disabled={isSubmitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-700 bg-emerald-600 px-6 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-b-4"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Confirm New Time <CheckCircle2 className="h-5 w-5" /></>}
              </button>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-6 text-center py-12"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900">Successfully Rescheduled!</h1>
                <p className="mt-4 text-lg font-medium text-slate-500">
                  Your class has been moved to the new time.
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
