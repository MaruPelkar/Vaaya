'use client';

interface CustomerVoiceCardProps {
  positive_themes: string[];
  negative_themes: string[];
  sources: string[];
}

export function CustomerVoiceCard({
  positive_themes,
  negative_themes,
  sources,
}: CustomerVoiceCardProps) {
  const hasData = positive_themes.length > 0 || negative_themes.length > 0;

  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3 className="metric-label">Customer Voice</h3>
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Positive Themes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span className="metric-label">What they love</span>
            </div>
            <ul className="space-y-2">
              {positive_themes.slice(0, 3).map((theme, i) => (
                <li
                  key={i}
                  className="text-sm py-2 px-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--gray-700)',
                  }}
                >
                  {theme}
                </li>
              ))}
              {positive_themes.length === 0 && (
                <li className="text-sm" style={{ color: 'var(--gray-500)' }}>
                  No positive themes found
                </li>
              )}
            </ul>
          </div>

          {/* Negative Themes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span className="metric-label">Pain points</span>
            </div>
            <ul className="space-y-2">
              {negative_themes.slice(0, 3).map((theme, i) => (
                <li
                  key={i}
                  className="text-sm py-2 px-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--error-bg)',
                    color: 'var(--gray-700)',
                  }}
                >
                  {theme}
                </li>
              ))}
              {negative_themes.length === 0 && (
                <li className="text-sm" style={{ color: 'var(--gray-500)' }}>
                  No pain points found
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
            No customer feedback available
          </span>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--gray-200)' }}>
          <div className="text-xs" style={{ color: 'var(--gray-500)' }}>
            <span className="font-semibold">Sources:</span> {sources.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
