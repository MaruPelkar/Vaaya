'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';

export default function HomePage() {
  const router = useRouter();

  const handleSelect = (domain: string) => {
    router.push(`/company/${domain}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-32 px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Company Intelligence
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          Research any B2B company in seconds
        </p>

        <SearchBar onSelect={handleSelect} />

        <div className="mt-16 text-center text-sm text-gray-400">
          <p>Enter a company name or domain to get started</p>
        </div>
      </div>
    </main>
  );
}
