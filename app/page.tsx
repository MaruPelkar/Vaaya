'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';

export default function HomePage() {
  const router = useRouter();

  const handleSelect = (domain: string) => {
    router.push(`/company/${domain}`);
  };

  return (
    <main className="hero gradient-primary">
      <div className="hero-content animate-fade-in-up">
        <span className="eyebrow text-white" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          COMPANY INTELLIGENCE
        </span>
        <h1 className="headline-display hero-title">
          Stop Guessing.<br />
          Start Knowing Your<br />
          Competitors.
        </h1>
        <p className="hero-subtitle">
          Research any B2B company in seconds. Get deep insights on product, pricing, positioning, and more.
        </p>

        <div className="w-full max-w-2xl mx-auto">
          <SearchBar onSelect={handleSelect} />
        </div>

        <p className="mt-lg text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Enter a company name or domain to get started
        </p>
      </div>
    </main>
  );
}
