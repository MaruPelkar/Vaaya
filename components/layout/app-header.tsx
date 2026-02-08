'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createBrowserClient } from '@/lib/db';

interface AppHeaderProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppHeader({ title, breadcrumbs }: AppHeaderProps) {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="app-header">
      {/* Left side - Breadcrumbs or Title */}
      <div className="flex items-center gap-2">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span className="text-gray-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-gray-500 hover:text-gray-700 no-underline">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-sm font-medium text-gray-900 m-0">{title}</h1>
        ) : null}
      </div>

      {/* Right side - Search & User */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="input input-sm w-48 pl-8"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* User Menu */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
            >
              <div className="avatar avatar-sm">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                ) : (
                  <span>{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm text-gray-700 hidden sm:inline">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50"
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--gray-100)' }}>
                  <p className="text-sm font-medium text-gray-900 m-0">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 m-0 truncate">
                    {user.email}
                  </p>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </a>
                <button
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  style={{ cursor: loggingOut ? 'not-allowed' : 'pointer', background: 'transparent', border: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
