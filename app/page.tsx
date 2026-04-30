import { Header } from '@/components/coming-soon/header';
import { HeroSection } from '@/components/coming-soon/hero-section';
import { FeatureCards } from '@/components/coming-soon/feature-cards';
import { SocialLinks } from '@/components/coming-soon/social-links';
import { Footer } from '@/components/coming-soon/footer';

export default function ComingSoonPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Header />
      <HeroSection />
      <FeatureCards />
      <SocialLinks />
      <Footer />
    </main>
  );
}
