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
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--vaaya-text)' }}>
            {label}
          </span>
          {showValue && (
            <span className="text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
              {clampedValue}%
            </span>
          )}
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--vaaya-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clampedValue}%`,
              backgroundColor: 'var(--vaaya-brand)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
