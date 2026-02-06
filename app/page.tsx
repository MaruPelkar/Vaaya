'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';
import { UserMenu } from '@/components/user-menu';

export default function HomePage() {
  const router = useRouter();

  const handleSelect = (domain: string) => {
    router.push(`/company/${domain}`);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--vaaya-white)' }}>
      {/* Header with user menu */}
      <header className="flex justify-end p-4">
        <UserMenu />
      </header>

      <div className="max-w-4xl mx-auto pt-16 px-4">
        <h1 className="headline-display text-center mb-6" style={{ color: 'var(--vaaya-text)' }}>
          Company Intelligence
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
