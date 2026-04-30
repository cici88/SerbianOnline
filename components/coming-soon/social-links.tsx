import { Instagram, Youtube } from 'lucide-react';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const socials = [
  {
    name: 'Instagram',
    href: '#',
    icon: Instagram,
    color: 'hover:bg-blush hover:border-blush',
  },
  {
    name: 'YouTube',
    href: '#',
    icon: Youtube,
    color: 'hover:bg-primary hover:border-primary',
  },
  {
    name: 'TikTok',
    href: '#',
    icon: TikTokIcon,
    color: 'hover:bg-mint hover:border-mint',
  },
];

export function SocialLinks() {
  return (
    <section className="px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm font-medium">Follow our journey</p>
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                aria-label={social.name}
                className={`inline-flex items-center justify-center w-12 h-12 bg-card border-2 border-lavender/40 rounded-xl text-muted-foreground ${social.color} hover:text-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg`}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
