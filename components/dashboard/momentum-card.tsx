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
  up: 'var(--success)',
  down: 'var(--error)',
  stable: 'var(--gray-500)',
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
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="metric-label">Momentum</h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </div>

      {/* Sparkline Chart */}
      {chartData.length > 0 && (
        <div className="h-20 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'var(--gray-500)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Sentence */}
      {summary_sentence && (
        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--gray-700)' }}>
          {summary_sentence}
        </p>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="mt-auto pt-4 space-y-3" style={{ borderTop: '1px solid var(--gray-200)' }}>
          {signals.slice(0, 3).map((signal, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: 'var(--gray-600)' }}>
                {signal.type}
              </span>
              <span className="font-semibold flex items-center gap-2">
                <span style={{ color: 'var(--gray-900)' }}>{signal.value}</span>
                {signal.trend && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: TREND_COLORS[signal.trend] || TREND_COLORS.stable,
                      backgroundColor: signal.trend === 'up' ? 'var(--success-bg)' : signal.trend === 'down' ? 'var(--error-bg)' : 'var(--gray-100)',
                    }}
                  >
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
          <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
            No momentum data available
          </span>
        </div>
      )}
    </div>
  );
}
