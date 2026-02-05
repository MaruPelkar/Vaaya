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
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
        Customer Voice
      </h3>

      {hasData ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Positive Themes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-green-600">👍</span>
              <span className="text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                What they love
              </span>
            </div>
            <ul className="space-y-2">
              {positive_themes.slice(0, 3).map((theme, i) => (
                <li
                  key={i}
                  className="text-sm py-2 px-3 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--vaaya-text)',
                  }}
                >
                  {theme}
                </li>
              ))}
              {positive_themes.length === 0 && (
                <li className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                  No positive themes found
                </li>
              )}
            </ul>
          </div>

          {/* Negative Themes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-red-600">👎</span>
              <span className="text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                Pain points
              </span>
            </div>
            <ul className="space-y-2">
              {negative_themes.slice(0, 3).map((theme, i) => (
                <li
                  key={i}
                  className="text-sm py-2 px-3 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    color: 'var(--vaaya-text)',
                  }}
                >
                  {theme}
                </li>
              ))}
              {negative_themes.length === 0 && (
                <li className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                  No pain points found
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
            No customer feedback available
          </span>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--vaaya-border)' }}>
          <div className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
            Sources: {sources.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
