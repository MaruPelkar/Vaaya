'use client';

import { CompetitorSummary, CompetitorType } from '@/lib/types';

interface CompetitiveSnapshotProps {
  competitors: CompetitorSummary[];
}

const COMPETITOR_TYPE_CONFIG: Record<CompetitorType, { label: string; color: string; bgColor: string }> = {
  direct: { label: 'Direct', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
  adjacent: { label: 'Adjacent', color: '#D97706', bgColor: 'rgba(245, 158, 11, 0.1)' },
  replacement: { label: 'Replace', color: '#4F46E5', bgColor: 'rgba(99, 102, 241, 0.1)' },
};

export function CompetitiveSnapshot({ competitors }: CompetitiveSnapshotProps) {
  return (
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
        Competitive Snapshot
      </h3>

      {competitors.length > 0 ? (
        <div className="space-y-3 flex-1">
          {competitors.slice(0, 3).map((competitor, i) => {
            const config = COMPETITOR_TYPE_CONFIG[competitor.type];
            return (
              <div
                key={i}
                className="py-3 px-4 rounded-lg"
                style={{ backgroundColor: 'var(--vaaya-neutral)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--vaaya-text)' }}>
                    {competitor.name}
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                  {competitor.wedge}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
            No competitor data available
          </span>
        </div>
      )}
    </div>
  );
}
