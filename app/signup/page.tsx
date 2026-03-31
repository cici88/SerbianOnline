"use client";

import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { Globe, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Registracija korisnika u Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) throw authError;

      // 2. Preusmeravanje na Dashboard
      if (plan) {
        router.push(`/dashboard?plan=${plan}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm transition-transform hover:scale-105">
          <Globe className="h-8 w-8" />
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Profile</h1>
        <p className="mt-2 font-medium text-slate-500">
          {plan ? `Sign up to book your ${plan} class.` : "Join us and start learning Serbian today."}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-11 font-medium text-slate-900 outline-none transition-all focus:border-purple-600 focus:bg-white"
              placeholder="John Doe"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <div className="h-5 w-5 rounded-full border-2 border-current" />
            </div>
          </div>
        </div>

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
              minLength={6}
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
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Create Account"}
          {!loading && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      <div className="mt-8 text-center font-medium text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-purple-600 hover:underline">
          Log in
        </Link>
      </div>
    </>
  );
}

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 selection:bg-purple-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl"
      >
        <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>}>
          <SignUpForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
