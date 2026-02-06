'use client';

import { useState, useEffect, useRef } from 'react';
import { AutocompleteResult } from '@/lib/types';

interface SearchBarProps {
  onSelect: (domain: string) => void;
  variant?: 'hero' | 'default';
}

export function SearchBar({ onSelect, variant = 'hero' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const isHero = variant === 'hero';

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a company..."
          className="w-full transition-all duration-300"
          style={{
            padding: '1.25rem 1.5rem',
            paddingRight: '3.5rem',
            fontSize: '1.125rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isHero ? 'rgba(255, 255, 255, 0.95)' : 'var(--white)',
            border: isHero
              ? (isFocused ? '2px solid rgba(255, 255, 255, 1)' : '2px solid rgba(255, 255, 255, 0.6)')
              : (isFocused ? '2px solid var(--primary)' : '2px solid var(--gray-300)'),
            color: 'var(--gray-800)',
            boxShadow: isFocused
              ? (isHero ? '0 20px 40px rgba(0, 0, 0, 0.2)' : '0 0 0 3px rgba(26, 107, 107, 0.1)')
              : 'var(--shadow-lg)',
            outline: 'none',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isLoading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        )}
        {!isLoading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gray-400)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute w-full mt-3 z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {results.map((result, index) => (
            <button
              key={result.domain}
              onClick={() => handleSelect(result)}
              className="w-full px-5 py-4 flex items-center gap-4 text-left transition-all duration-150"
              style={{
                borderBottom: index < results.length - 1 ? '1px solid var(--gray-200)' : 'none',
                backgroundColor: 'var(--white)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--white)';
              }}
            >
              {result.logo && (
                <img
                  src={result.logo}
                  alt={result.name}
                  className="w-10 h-10 object-contain"
                  style={{
                    backgroundColor: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate"
                  style={{ color: 'var(--gray-900)' }}
                >
                  {result.name}
                </div>
                <div
                  className="text-sm font-mono truncate"
                  style={{ color: 'var(--gray-500)' }}
                >
                  {result.domain}
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gray-400)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
