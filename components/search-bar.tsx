'use client';

import { useState, useEffect, useRef } from 'react';
import { AutocompleteResult } from '@/lib/types';

interface SearchBarProps {
  onSelect: (domain: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (result: AutocompleteResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onSelect(result.domain);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.length >= 2) {
      // Allow direct domain entry
      setIsOpen(false);
      onSelect(query.includes('.') ? query : `${query}.com`);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a company..."
          className="w-full px-6 py-4 text-lg font-medium border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white placeholder-gray-600"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute w-full mt-3 bg-white border border-gray-300 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.domain}
              onClick={() => handleSelect(result)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-100 text-left transition-colors border-b border-gray-100 last:border-b-0"
            >
              {result.logo && (
                <img
                  src={result.logo}
                  alt={result.name}
                  className="w-10 h-10 rounded-lg bg-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <div className="font-bold text-gray-900">{result.name}</div>
                <div className="text-sm text-gray-600 font-mono">{result.domain}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
