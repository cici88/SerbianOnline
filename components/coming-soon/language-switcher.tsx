'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'EN', label: 'English' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'ES', label: 'Español' },
  { code: 'RU', label: 'Русский' },
];

export function LanguageSwitcher() {
  const [activeLang, setActiveLang] = useState('EN');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm border-2 border-lavender/40 rounded-xl text-sm font-medium text-foreground hover:border-mint transition-colors"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        {activeLang}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border-2 border-lavender/40 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setActiveLang(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  activeLang === lang.code
                    ? 'bg-mint/30 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-lavender/20'
                }`}
              >
                <span className="font-medium mr-2">{lang.code}</span>
                <span className="text-muted-foreground">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
