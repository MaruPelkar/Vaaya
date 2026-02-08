'use client';

import { useAuth } from '@/contexts/auth-context';

interface AppHeaderProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppHeader({ title, breadcrumbs }: AppHeaderProps) {
  const { user } = useAuth();

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
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </header>
  );
}
