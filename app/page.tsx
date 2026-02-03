'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';

export default function HomePage() {
  const router = useRouter();

  const handleSelect = (domain: string) => {
    router.push(`/company/${domain}`);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto pt-32 px-4">
        <h1 className="text-6xl font-extrabold text-center text-gray-900 mb-6 tracking-tight leading-tight">
          Company Intelligence
        </h1>
        <p className="text-xl font-medium text-gray-600 text-center mb-12 leading-relaxed max-w-2xl mx-auto">
          Research any B2B company in seconds
        </p>

        <SearchBar onSelect={handleSelect} />

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Enter a company name or domain to get started</p>
        </div>
      </div>
    </main>
  );
}
