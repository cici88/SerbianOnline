"use client";

import { motion } from "motion/react";
import { ArrowRight, Calendar, CheckCircle2, Globe, MessageCircle, Star, Zap, Info } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
            <Globe className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            learn-serbian<span className="text-purple-600">.online</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden font-semibold text-slate-600 hover:text-purple-600 sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border-b-4 border-purple-700 bg-purple-600 px-6 py-2 font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32 text-center sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-amber-200 bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>Structured, practical, with homework & materials</span>
          </div>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Master Serbian with <span className="text-purple-600">Confidence</span>
          </h1>
          <p className="mb-10 text-lg font-medium text-slate-600 sm:text-xl">
            Personalized 1-on-1 lessons designed for your goals. From absolute beginners to conversational fluency.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup?trial=true"
              className="flex w-full items-center justify-center gap-2 rounded-full border-b-4 border-emerald-600 bg-emerald-500 px-8 py-4 text-lg font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 sm:w-auto"
            >
              <Zap className="h-5 w-5 fill-current" />
              Book 15-Min Free Trial
            </Link>
            <Link
              href="#pricing"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:border-purple-600 hover:text-purple-600 sm:w-auto"
            >
              <Calendar className="h-5 w-5" />
              View Schedule & Prices
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg font-medium text-slate-500">Three simple steps to start speaking Serbian.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create a Free Profile",
                desc: "Sign up in seconds. Tell us your goals and current level.",
                icon: <CheckCircle2 className="h-8 w-8 text-purple-600" />,
                color: "bg-purple-100 border-purple-200",
              },
              {
                step: "2",
                title: "Book Your Class",
                desc: "Choose a 15-min free trial or a standard lesson that fits your schedule.",
                icon: <Calendar className="h-8 w-8 text-emerald-600" />,
                color: "bg-emerald-100 border-emerald-200",
              },
              {
                step: "3",
                title: "Start Learning",
                desc: "Join the class, get personalized materials, and track your progress.",
                icon: <MessageCircle className="h-8 w-8 text-amber-600" />,
                color: "bg-amber-100 border-amber-200",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative rounded-3xl border-2 border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="font-medium text-slate-500">{item.desc}</p>
                <div className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-black text-white">
                  {item.step}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Packages */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg font-medium text-slate-500">Pay per class or get a subscription. No hidden fees.</p>
          </div>

          {/* Trial Options Banner */}
          <div className="mb-12 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">New Student Trials</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-white bg-white/60 p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">15-Min Meet & Greet</h4>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Free</span>
                </div>
                <p className="mb-4 text-sm font-medium text-slate-600">Quick chat to discuss your goals and assess your level.</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Info className="h-4 w-4" /> Limit: 1 per user every 6 months
                </div>
              </div>
              <div className="rounded-2xl border-2 border-white bg-white/60 p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">30-Min Intro Class</h4>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">200 RSD</span>
                </div>
                <p className="mb-4 text-sm font-medium text-slate-600">A full introductory lesson to experience the teaching style.</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Info className="h-4 w-4" /> Limit: 1 per user
                </div>
              </div>
            </div>
          </div>
          
          {/* Regular Classes Grid */}
          <div className="grid gap-8 sm:grid-cols-3">
            {/* 30 Min Regular */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700 w-max">
                Quick Practice
              </div>
              <h3 className="text-2xl font-bold text-slate-900">30-Min Class</h3>
              <div className="my-6 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">5</span>
                <span className="font-bold text-slate-500">EUR</span>
              </div>
              <ul className="mb-8 flex flex-1 flex-col gap-4 font-medium text-slate-600">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Focused conversation</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Specific topic review</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Homework feedback</li>
              </ul>
              <Link
                href="/signup?plan=30min"
                className="w-full rounded-2xl border-b-4 border-slate-300 bg-slate-100 px-6 py-4 text-center font-bold text-slate-700 transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0"
              >
                Book 30 Min
              </Link>
            </motion.div>

            {/* 45 Min Regular */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700 w-max">
                Balanced
              </div>
              <h3 className="text-2xl font-bold text-slate-900">45-Min Class</h3>
              <div className="my-6 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">8</span>
                <span className="font-bold text-slate-500">EUR</span>
              </div>
              <ul className="mb-8 flex flex-1 flex-col gap-4 font-medium text-slate-600">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Grammar & Speaking</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Vocabulary building</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Reading exercises</li>
              </ul>
              <Link
                href="/signup?plan=45min"
                className="w-full rounded-2xl border-b-4 border-purple-300 bg-purple-100 px-6 py-4 text-center font-bold text-purple-700 transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0"
              >
                Book 45 Min
              </Link>
            </motion.div>

            {/* 60 Min Standard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative flex flex-col rounded-3xl border-4 border-purple-600 bg-white p-8 shadow-xl"
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-sm font-bold text-white shadow-sm whitespace-nowrap">
                Most Popular
              </div>
              <div className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 w-max">
                Full Immersion
              </div>
              <h3 className="text-2xl font-bold text-slate-900">60-Min Class</h3>
              <div className="my-6 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">10</span>
                <span className="font-bold text-slate-500">EUR</span>
              </div>
              <ul className="mb-8 flex flex-1 flex-col gap-4 font-medium text-slate-600">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-600" /> Deep dive into grammar</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-600" /> Extensive speaking practice</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-600" /> Custom learning materials</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-600" /> Student portal access</li>
              </ul>
              <Link
                href="/signup?plan=60min"
                className="w-full rounded-2xl border-b-4 border-purple-700 bg-purple-600 px-6 py-4 text-center font-bold text-white transition-all hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0"
              >
                Book 60 Min
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ / Rules */}
      <section className="bg-slate-100 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-12 text-3xl font-extrabold text-slate-900">Good to know</h2>
          <div className="grid gap-6 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 font-bold text-slate-900 flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-500"/> Cancellation Policy</h4>
              <p className="text-sm font-medium text-slate-600">You can cancel or reschedule up to 24h before the class. Cancellations under 24h or no-shows are charged 100%.</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 font-bold text-slate-900 flex items-center gap-2"><Globe className="h-5 w-5 text-purple-500"/> Timezones</h4>
              <p className="text-sm font-medium text-slate-600">All available times in the calendar will automatically be shown in your local timezone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-slate-200 bg-white px-6 py-12 text-center font-medium text-slate-500">
        <p>&copy; {new Date().getFullYear()} learn-serbian.online. All rights reserved.</p>
      </footer>
    </div>
  );
}
