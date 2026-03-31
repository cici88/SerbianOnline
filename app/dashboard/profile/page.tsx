"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2, CheckCircle2, User } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("A0");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setLevel(data.level || "A0");
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('student_profiles')
      .update({
        full_name: fullName,
        level: level,
        timezone: timezone,
      })
      .eq('id', user.id);

    setSaving(false);
    
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
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
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-500 hover:text-purple-600">
            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Edit Profile</h1>
            <p className="font-medium text-slate-500">Update your personal information and preferences.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6 rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm">
          
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border-2 border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              Profile updated successfully!
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="font-bold text-slate-700">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="level" className="font-bold text-slate-700">Serbian Language Level</label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
            >
              <option value="A0">A0 - Absolute Beginner</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Proficient</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="timezone" className="font-bold text-slate-700">Timezone</label>
            <input
              id="timezone"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
              placeholder="e.g. Europe/Belgrade"
              required
            />
            <p className="text-xs font-medium text-slate-500">This helps us schedule classes in your local time.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 border-purple-700 bg-purple-600 px-4 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-b-4"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save Changes</>}
          </button>
        </form>
      </main>
    </div>
  );
}
