import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="px-4 pb-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Made with <Heart className="w-4 h-4 text-primary fill-primary" /> for language learners
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          © {new Date().getFullYear()} Jasno i Jasno. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
