'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export function HeroSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSuccess(true);
    setName('');
    setEmail('');
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-yellow rounded-full opacity-60 animate-float" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-mint rounded-full opacity-50 animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-10 h-10 bg-lavender rounded-full opacity-60 animate-float" />
        <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-blush rounded-full opacity-50 animate-float-delayed" />
        <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-sky rounded-full opacity-40 animate-float" />
      </div>

      {/* Hero card with vignette/freeform edge aesthetic */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative bg-card/80 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 shadow-[0_8px_40px_rgba(200,230,213,0.3)] border-2 border-lavender/50">
          {/* Decorative corner accents */}
          <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-mint rounded-tl-xl" />
          <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-blush rounded-tr-xl" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-yellow rounded-bl-xl" />
          <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-lavender rounded-br-xl" />

          {/* Coming soon badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow/60 text-foreground rounded-full text-sm font-medium border border-yellow">
              <Sparkles className="w-4 h-4" />
              Coming Soon
            </span>
          </div>

          {/* Brand name */}
          <h1 className="font-display text-4xl md:text-6xl font-semibold text-center mb-4 leading-tight">
            <span className="text-foreground">Jasno</span>
            <span className="text-primary"> i </span>
            <span className="text-foreground">Jasno</span>
          </h1>

          {/* Tagline */}
          <p className="font-display text-xl md:text-2xl text-center text-muted-foreground mb-4">
            Learn Serbian through stories
          </p>

          {/* Subtext */}
          <p className="text-center text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8">
            A new way to fall in love with the Serbian language — through illustrated stories, warm
            lessons, and a sprinkle of magic.
          </p>

          {/* Subscription form */}
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-mint rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-foreground" />
              </div>
              <p className="font-display text-xl text-foreground mb-2">
                You&apos;re on the list!
              </p>
              <p className="text-muted-foreground">
                We&apos;ll notify you when we launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex-1 px-5 py-3 bg-background/80 border-2 border-lavender/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-5 py-3 bg-background/80 border-2 border-lavender/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/80 text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Notify Me When It&apos;s Ready
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}
