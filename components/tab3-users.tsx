'use client';

import { useState } from 'react';
import { Tab3Data, DiscoveredUser, SignalSource } from '@/lib/types';

interface Tab3UsersProps {
  data: Tab3Data;
}

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

export function Tab3Users({ data }: Tab3UsersProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConfidenceFilter>('all');
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);

  // Handle old data format
  if (!data || !data.summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Data is in an older format. Please refresh to load new data.</p>
        <p className="text-sm text-gray-400">Click the refresh button above to fetch updated user discovery.</p>
      </div>
    );
  }

  const filteredUsers = data.users.filter(u => {
    if (hasLinkedIn && !u.linkedin_url) return false;
    if (filter === 'high' && u.confidence_score < 70) return false;
    if (filter === 'medium' && (u.confidence_score < 40 || u.confidence_score >= 70)) return false;
    if (filter === 'low' && u.confidence_score >= 40) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-purple-900">User Discovery</h2>
          <span className="text-xs text-purple-500">
            {data.summary.signals_collected} signals collected
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-purple-700">{data.summary.total_users_found}</div>
            <div className="text-sm text-purple-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">{data.summary.high_confidence_count}</div>
            <div className="text-sm text-emerald-500">High Confidence</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-amber-600">{data.summary.medium_confidence_count}</div>
            <div className="text-sm text-amber-500">Medium</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-400">{data.summary.low_confidence_count}</div>
            <div className="text-sm text-gray-400">Low</div>
          </div>
        </div>

        {data.summary.sources_searched.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-purple-600">Sources:</span>
            {data.summary.sources_searched.map((source, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                {source}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-2">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as ConfidenceFilter)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All confidence levels</option>
          <option value="high">High (70+)</option>
          <option value="medium">Medium (40-69)</option>
          <option value="low">Low (&lt;40)</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={hasLinkedIn}
            onChange={e => setHasLinkedIn(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Has LinkedIn
        </label>

        <div className="flex-1" />

        <span className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {data.users.length} users
        </span>
      </div>

      {/* User List */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users match the current filters
          </div>
        ) : (
          filteredUsers.slice(0, 50).map(user => (
            <UserRow
              key={user.id}
              user={user}
              expanded={expandedId === user.id}
              onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
            />
          ))
        )}
      </div>

      {filteredUsers.length > 50 && (
        <div className="text-center py-4">
          <button className="text-purple-600 text-sm hover:underline">
            Load more ({filteredUsers.length - 50} remaining)
          </button>
        </div>
      )}

      {/* Companies Identified */}
      {data.companies_identified.length > 0 && (
        <div className="border border-gray-200 rounded-xl bg-white">
          <button
            onClick={() => setShowCompanies(!showCompanies)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">
              Companies Identified ({data.companies_identified.length})
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showCompanies ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCompanies && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {data.companies_identified.slice(0, 30).map((company, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                    title={`${company.signals} signal(s) from ${company.source}`}
                  >
                    {company.name}
                    <span className="ml-1 text-gray-400 text-xs">({company.signals})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// User Row Component
interface UserRowProps {
  user: DiscoveredUser;
  expanded: boolean;
  onToggle: () => void;
}

function UserRow({ user, expanded, onToggle }: UserRowProps) {
  const scoreColor =
    user.confidence_score >= 70 ? 'text-emerald-600' :
    user.confidence_score >= 40 ? 'text-amber-600' :
    'text-gray-400';

  return (
    <div
      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
    >
      {/* Main row */}
      <div
        className="py-3 px-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Score */}
          <div className={`font-mono text-sm font-bold w-10 ${scoreColor}`}>
            {user.confidence_score}
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-gray-900 truncate">
                {user.name}
              </span>
              {user.role && user.company && (
                <span className="text-sm text-gray-500 truncate">
                  {user.role} @ {user.company}
                </span>
              )}
              {!user.role && user.company && (
                <span className="text-sm text-gray-500 truncate">
                  @ {user.company}
                </span>
              )}
            </div>
          </div>

          {/* Signal badges */}
          <div className="flex items-center gap-1">
            {getUniqueSourceIcons(user.signals).map((icon, i) => (
              <span key={i} className="text-xs text-gray-400" title={icon.title}>
                {icon.icon}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex items-center gap-1.5">
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={e => e.stopPropagation()}
                title="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            )}
            {user.twitter_handle && (
              <a
                href={`https://twitter.com/${user.twitter_handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={e => e.stopPropagation()}
                title="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {user.github_username && (
              <a
                href={`https://github.com/${user.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={e => e.stopPropagation()}
                title="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            )}
            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={e => e.stopPropagation()}
                title="Email"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            )}
          </div>

          {/* Expand indicator */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Top signal preview */}
        <div className="ml-[76px] mt-1 flex items-start text-sm">
          <span className="text-gray-300 mr-1.5">└</span>
          <span className="text-gray-400 mr-1">{formatSource(user.strongest_signal)}:</span>
          <span className="text-gray-600 truncate">{user.signals[0]?.text}</span>
        </div>
      </div>

      {/* Expanded signals */}
      {expanded && user.signals.length > 1 && (
        <div className="ml-[76px] px-4 pb-3 space-y-1">
          {user.signals.slice(1).map((signal, i) => (
            <div key={i} className="flex items-start text-sm">
              <span className="text-gray-300 mr-1.5">{i === user.signals.length - 2 ? '└' : '├'}</span>
              <span className="text-gray-400 mr-1">{formatSource(signal.source)}:</span>
              <span className="text-gray-500 truncate flex-1">{signal.text}</span>
              {signal.url && (
                <a
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-purple-500 hover:underline text-xs"
                >
                  view
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getUniqueSourceIcons(signals: DiscoveredUser['signals']): Array<{ icon: string; title: string }> {
  const sourceIcons: Record<string, { icon: string; title: string }> = {
    g2_review: { icon: '⭐', title: 'G2 Review' },
    capterra_review: { icon: '⭐', title: 'Capterra Review' },
    trustradius_review: { icon: '⭐', title: 'TrustRadius Review' },
    linkedin_post: { icon: 'in', title: 'LinkedIn' },
    twitter_post: { icon: '𝕏', title: 'Twitter' },
    github_issue: { icon: '🐙', title: 'GitHub' },
    github_contributor: { icon: '🐙', title: 'GitHub Contributor' },
    reddit_post: { icon: '🔴', title: 'Reddit' },
    hn_comment: { icon: 'Y', title: 'Hacker News' },
    testimonial: { icon: '💬', title: 'Testimonial' },
    case_study: { icon: '📋', title: 'Case Study' },
    job_posting: { icon: '💼', title: 'Job Posting' },
    logo_wall: { icon: '🏢', title: 'Customer' },
  };

  const seen = new Set<string>();
  const icons: Array<{ icon: string; title: string }> = [];

  for (const s of signals) {
    const entry = sourceIcons[s.source];
    if (entry && !seen.has(entry.icon)) {
      seen.add(entry.icon);
      icons.push(entry);
    }
  }

  return icons.slice(0, 4);
}

function formatSource(source: SignalSource): string {
  const labels: Record<string, string> = {
    g2_review: 'G2',
    capterra_review: 'Capterra',
    trustradius_review: 'TrustRadius',
    linkedin_post: 'LinkedIn',
    twitter_post: 'Twitter',
    github_issue: 'GitHub Issue',
    github_contributor: 'GitHub Contrib',
    reddit_post: 'Reddit',
    reddit_comment: 'Reddit',
    hn_comment: 'HN',
    stackoverflow: 'Stack Overflow',
    testimonial: 'Testimonial',
    case_study: 'Case Study',
    job_posting: 'Job',
    logo_wall: 'Customer',
    press_mention: 'Press',
    product_hunt: 'Product Hunt',
    youtube_review: 'YouTube',
    forum_post: 'Forum',
    discord: 'Discord',
    github_discussion: 'GitHub Discussion',
    github_star: 'GitHub Star',
    integration_user: 'Integration',
    config_file: 'Config',
  };
  return labels[source] || source;
}
