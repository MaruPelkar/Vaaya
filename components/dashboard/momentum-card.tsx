'use client';

import { MomentumPoint, MomentumSignal } from '@/lib/types';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface MomentumCardProps {
  sparkline_data: MomentumPoint[];
  summary_sentence: string;
  signals: MomentumSignal[];
}

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

const TREND_COLORS: Record<string, string> = {
  up: '#059669',
  down: '#DC2626',
  stable: '#6B7280',
};

export function MomentumCard({
  sparkline_data,
  summary_sentence,
  signals,
}: MomentumCardProps) {
  // Prepare chart data
  const chartData = sparkline_data.map((point) => ({
    date: point.date,
    value: point.value,
    type: point.type,
  }));

  return (
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
        Momentum
      </h3>

      {/* Sparkline Chart */}
      {chartData.length > 0 && (
        <div className="h-16 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--vaaya-white)',
                  border: '1px solid var(--vaaya-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--vaaya-text-muted)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--vaaya-brand)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Sentence */}
      {summary_sentence && (
        <p className="text-xs mb-4" style={{ color: 'var(--vaaya-text)' }}>
          {summary_sentence}
        </p>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="mt-auto pt-3 space-y-2" style={{ borderTop: '1px solid var(--vaaya-border)' }}>
          {signals.slice(0, 3).map((signal, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--vaaya-text-muted)' }}>
                {signal.type}
              </span>
              <span className="font-medium flex items-center gap-1">
                <span style={{ color: 'var(--vaaya-text)' }}>{signal.value}</span>
                {signal.trend && (
                  <span style={{ color: TREND_COLORS[signal.trend] || TREND_COLORS.stable }}>
                    {TREND_ICONS[signal.trend] || ''}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {chartData.length === 0 && signals.length === 0 && !summary_sentence && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
            No momentum data available
          </span>
        </div>
      )}
    </div>
  );
}
