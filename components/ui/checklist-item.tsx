'use client';

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  subtext?: string;
}

export function ChecklistItem({ label, checked, subtext }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center w-4 h-4 rounded-full text-xs"
        style={{
          backgroundColor: checked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
          color: checked ? '#059669' : '#DC2626',
        }}
      >
        {checked ? '✓' : '✕'}
      </span>
      <span className="text-xs flex-1" style={{ color: 'var(--vaaya-text)' }}>
        {label}
      </span>
      {subtext && (
        <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
          {subtext}
        </span>
      )}
    </div>
  );
}
