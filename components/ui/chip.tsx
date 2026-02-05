'use client';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'category' | 'platform' | 'icp' | 'persona' | 'small' | 'change_type';
  changeType?: string;
}

const VARIANT_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  category: {
    bg: 'rgba(7, 59, 57, 0.1)',
    text: 'var(--vaaya-brand)',
  },
  platform: {
    bg: 'rgba(99, 102, 241, 0.1)',
    text: '#4F46E5',
  },
  icp: {
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#059669',
  },
  persona: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#D97706',
  },
  small: {
    bg: 'var(--vaaya-neutral)',
    text: 'var(--vaaya-text-muted)',
  },
  change_type: {
    bg: 'var(--vaaya-neutral)',
    text: 'var(--vaaya-text-muted)',
  },
};

const CHANGE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  product_launch: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' },
  pricing_change: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
  funding: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5' },
  acquisition: { bg: 'rgba(147, 51, 234, 0.1)', text: '#7C3AED' },
  leadership: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB' },
  partnership: { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891B2' },
  positioning: { bg: 'rgba(236, 72, 153, 0.1)', text: '#DB2777' },
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  product_launch: 'Product',
  pricing_change: 'Pricing',
  funding: 'Funding',
  acquisition: 'Acquisition',
  leadership: 'Leadership',
  partnership: 'Partnership',
  positioning: 'Positioning',
};

export function Chip({ children, variant = 'category', changeType }: ChipProps) {
  let styles = VARIANT_STYLES[variant];

  // Override for change_type variant
  if (variant === 'change_type' && changeType && CHANGE_TYPE_STYLES[changeType]) {
    styles = CHANGE_TYPE_STYLES[changeType];
  }

  const label = variant === 'change_type' && changeType && CHANGE_TYPE_LABELS[changeType]
    ? CHANGE_TYPE_LABELS[changeType]
    : children;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      }}
    >
      {label}
    </span>
  );
}

// Plan gate chip for Product tab
export function PlanGateChip({ gate }: { gate: string }) {
  const gateStyles: Record<string, { bg: string; text: string }> = {
    free: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' },
    starter: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB' },
    pro: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5' },
    enterprise: { bg: 'rgba(147, 51, 234, 0.1)', text: '#7C3AED' },
    all: { bg: 'var(--vaaya-neutral)', text: 'var(--vaaya-text-muted)' },
  };

  const styles = gateStyles[gate] || gateStyles.all;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      }}
    >
      {gate.charAt(0).toUpperCase() + gate.slice(1)}
    </span>
  );
}

// Confidence chip for People tab
export function ConfidenceChip({ score }: { score: number }) {
  let color: string;
  let label: string;

  if (score >= 70) {
    color = '#059669';
    label = 'High';
  } else if (score >= 40) {
    color = '#D97706';
    label = 'Medium';
  } else {
    color = '#6B7280';
    label = 'Low';
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <span className="font-bold">{score}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
