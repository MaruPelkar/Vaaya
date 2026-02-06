'use client';

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  subtext?: string;
}

export function ChecklistItem({ label, checked, subtext }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0"
        style={{
          backgroundColor: checked ? 'var(--success-bg)' : 'var(--error-bg)',
          color: checked ? 'var(--success)' : 'var(--error)',
        }}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </span>
      <span className="text-sm flex-1" style={{ color: 'var(--gray-700)' }}>
        {label}
      </span>
      {subtext && (
        <span
          className="badge"
          style={{
            backgroundColor: 'var(--gray-100)',
            color: 'var(--gray-600)',
            fontSize: '0.625rem',
            padding: '0.15rem 0.4rem',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}
