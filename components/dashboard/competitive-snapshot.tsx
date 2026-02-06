'use client';

import { CompetitorSummary, CompetitorType } from '@/lib/types';

interface CompetitiveSnapshotProps {
  competitors: CompetitorSummary[];
}

const COMPETITOR_TYPE_CONFIG: Record<CompetitorType, { label: string; color: string; bgColor: string }> = {
  direct: { label: 'Direct', color: 'var(--error)', bgColor: 'var(--error-bg)' },
  adjacent: { label: 'Adjacent', color: 'var(--warning)', bgColor: 'var(--warning-bg)' },
  replacement: { label: 'Replace', color: 'var(--info)', bgColor: 'var(--info-bg)' },
};

export function CompetitiveSnapshot({ competitors }: CompetitiveSnapshotProps) {
  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3 className="metric-label">Competitive Snapshot</h3>
      </div>

      {competitors.length > 0 ? (
        <div className="space-y-3 flex-1">
          {competitors.slice(0, 3).map((competitor, i) => {
            const config = COMPETITOR_TYPE_CONFIG[competitor.type];
            return (
              <div
                key={i}
                className="py-3 px-4 rounded-lg"
                style={{ backgroundColor: 'var(--gray-100)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
                    {competitor.name}
                  </span>
                  <span
                    className="badge"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
                  {competitor.wedge}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
            No competitor data available
          </span>
        </div>
      )}
    </div>
  );
}
