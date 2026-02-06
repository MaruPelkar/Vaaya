'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div
        className="w-10 h-10 rounded-full animate-pulse"
        style={{ backgroundColor: 'var(--vaaya-neutral)' }}
      />
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name || user.email;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer"
        style={{
          backgroundColor: isOpen ? 'var(--vaaya-neutral)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--vaaya-neutral)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || 'User'}
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ backgroundColor: 'var(--vaaya-brand)', color: 'white' }}
          >
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--vaaya-white)',
            border: '1px solid var(--vaaya-border)',
          }}
        >
          <div className="p-4" style={{ borderBottom: '1px solid var(--vaaya-border)' }}>
            <p className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
              {displayName}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--vaaya-text-muted)' }}>
              {user.email}
            </p>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer"
            style={{ color: 'var(--vaaya-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vaaya-neutral)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
