'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UserMenuProps {
  variant?: 'light' | 'dark';
}

export function UserMenu({ variant = 'light' }: UserMenuProps) {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';

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
        style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'var(--gray-200)' }}
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
        className="flex items-center gap-2 p-1.5 rounded-xl transition-all duration-200"
        style={{
          backgroundColor: isOpen
            ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'var(--gray-100)')
            : 'transparent',
          border: isDark ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'var(--gray-100)';
          if (isDark) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            if (isDark) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || 'User'}
            className="w-8 h-8 rounded-lg object-cover"
            style={{ border: isDark ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid var(--gray-200)' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'var(--primary)',
              color: 'white',
            }}
          >
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-72 rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* User Info */}
          <div className="p-4" style={{ borderBottom: '1px solid var(--gray-200)' }}>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || 'User'}
                  className="w-12 h-12 rounded-xl object-cover"
                  style={{ border: '2px solid var(--gray-200)' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
                    color: 'white',
                  }}
                >
                  {displayName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: 'var(--gray-900)' }}>
                  {displayName}
                </p>
                <p className="text-sm truncate" style={{ color: 'var(--gray-500)' }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150"
              style={{ color: 'var(--gray-700)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                e.currentTarget.style.color = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gray-700)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
