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
        <p className="text-body text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--vaaya-text-muted)' }}>
          Research any B2B company in seconds
        </p>

        <SearchBar onSelect={handleSelect} />

        <div className="mt-16 text-center text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
          <p>Enter a company name or domain to get started</p>
        </div>
      </div>
    </main>
  );
}
