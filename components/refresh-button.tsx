'use client';

interface RefreshButtonProps {
  loading: boolean;
  onClick: () => void;
}

export function RefreshButton({ loading, onClick }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-all duration-200"
      style={{
        backgroundColor: 'var(--gray-100)',
        color: 'var(--gray-700)',
        border: '1px solid var(--gray-200)',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--white)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--gray-100)';
        e.currentTarget.style.color = 'var(--gray-700)';
        e.currentTarget.style.borderColor = 'var(--gray-200)';
      }}
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
