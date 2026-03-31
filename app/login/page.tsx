"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Globe, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 selection:bg-purple-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm transition-transform hover:scale-105">
            <Globe className="h-8 w-8" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="mt-2 font-medium text-slate-500">Log in to your student portal.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-11 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-11 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-purple-700 bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-b-4"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Log In"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="mt-8 text-center font-medium text-slate-500">
          Don't have an account?{" "}
          <Link href="/signup" className="font-bold text-purple-600 hover:underline">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
