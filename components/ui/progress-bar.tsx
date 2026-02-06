'use client';

interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  showValue?: boolean;
}

export function ProgressBar({ label, value, showValue = true }: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--gray-700)' }}>
            {label}
          </span>
          {showValue && (
            <span className="text-xs font-semibold" style={{ color: 'var(--gray-500)' }}>
              {clampedValue}%
            </span>
          )}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    </div>
  );
}
