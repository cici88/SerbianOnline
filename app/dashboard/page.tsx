"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { sendEmailNotification } from "@/lib/email";
import { LogOut, User, Loader2, Calendar, Clock } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchUpcomingClasses(session.user.id);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchUpcomingClasses = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', userId)
      .in('status', ['scheduled', 'pending'])
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3);

    if (!error && data) {
      setUpcomingClasses(data);
    }
  };

  const handleCancel = async (bookingId: string, startsAt: string) => {
    const hoursDifference = (new Date(startsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursDifference < 24) {
      alert("Classes can only be canceled at least 24 hours in advance.");
      return;
    }
    
    if (confirm("Are you sure you want to cancel this class?")) {
      await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
      
      // Send email notifications
      const dateStr = new Date(startsAt).toLocaleDateString();
      const timeStr = new Date(startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // To Student
      sendEmailNotification(
        user.email,
        "Class Canceled",
        `<h1>Class Canceled</h1><p>You have canceled your class scheduled for ${dateStr} at ${timeStr}.</p>`
      );
      
      // To Admin
      sendEmailNotification(
        "admin@example.com", // Replace with real admin email or fetch from DB
        "Class Canceled by Student",
        `<h1>Class Canceled</h1><p>A student (${user.email}) has canceled their class scheduled for ${dateStr} at ${timeStr}.</p>`
      );
      
      fetchUpcomingClasses(user.id);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Nav */}
      <nav className="flex items-center justify-between border-b-2 border-slate-200 bg-white px-6 py-4">
        <div className="text-xl font-bold tracking-tight text-slate-800">
          Student <span className="text-purple-600">Portal</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome back, {user.user_metadata?.full_name || "Student"}! 👋
          </h1>
          <p className="mt-2 font-medium text-slate-500">
            Here is your learning overview.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Quick Stats / Actions */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <User className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900">Profile</h3>
              <p className="mb-4 text-sm font-medium text-slate-500">{user.email}</p>
              <Link href="/dashboard/profile" className="flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                Edit Profile
              </Link>
            </div>
            
            <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-slate-900">Ready to learn?</h3>
              <p className="mb-4 text-sm font-medium text-slate-600">Book your next class and continue your progress.</p>
              <Link href="/dashboard/book" className="flex w-full items-center justify-center gap-2 rounded-xl border-b-4 border-emerald-700 bg-emerald-600 px-4 py-3 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0">
                <Calendar className="h-5 w-5" />
                Book a Class
              </Link>
            </div>
          </div>

          {/* Upcoming Classes Placeholder */}
          <div className="col-span-1 sm:col-span-2">
            <div className="h-full rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-xl font-bold text-slate-900">Upcoming Classes</h3>
              
              {upcomingClasses.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                  <Calendar className="mb-3 h-8 w-8 text-slate-400" />
                  <p className="font-bold text-slate-600">No upcoming classes</p>
                  <p className="text-sm font-medium text-slate-500">You haven't booked any classes yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcomingClasses.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 transition-all hover:border-purple-200 hover:bg-white">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 capitalize">{booking.type.replace('min', ' Min')} Class</h4>
                        <p className="text-sm font-medium text-slate-500">
                          {new Date(booking.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(booking.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {booking.video_link && (
                          <a href={booking.video_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                            Join Video Call
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          {booking.status}
                        </div>
                        <div className="flex gap-3">
                          <Link href={`/dashboard/reschedule/${booking.id}`} className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline">
                            Reschedule
                          </Link>
                          <button onClick={() => handleCancel(booking.id, booking.starts_at)} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
