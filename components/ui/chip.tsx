'use client';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'category' | 'platform' | 'icp' | 'persona' | 'small' | 'change_type';
  changeType?: string;
}

const VARIANT_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  category: {
    bg: 'rgba(26, 107, 107, 0.1)',
    text: 'var(--primary)',
  },
  platform: {
    bg: 'var(--info-bg)',
    text: 'var(--info)',
  },
  icp: {
    bg: 'var(--success-bg)',
    text: 'var(--success)',
  },
  persona: {
    bg: 'var(--warning-bg)',
    text: 'var(--warning)',
  },
  small: {
    bg: 'var(--gray-100)',
    text: 'var(--gray-600)',
  },
  change_type: {
    bg: 'var(--gray-100)',
    text: 'var(--gray-600)',
  },
};

const CHANGE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  product_launch: { bg: 'var(--success-bg)', text: 'var(--success)' },
  pricing_change: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  funding: { bg: 'var(--info-bg)', text: 'var(--info)' },
  acquisition: { bg: 'rgba(147, 51, 234, 0.1)', text: '#7C3AED' },
  leadership: { bg: 'var(--info-bg)', text: 'var(--info)' },
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
      className="badge"
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
    free: { bg: 'var(--success-bg)', text: 'var(--success)' },
    starter: { bg: 'var(--info-bg)', text: 'var(--info)' },
    pro: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5' },
    enterprise: { bg: 'rgba(147, 51, 234, 0.1)', text: '#7C3AED' },
    all: { bg: 'var(--gray-100)', text: 'var(--gray-600)' },
  };

  const styles = gateStyles[gate] || gateStyles.all;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        padding: '0.2rem 0.5rem',
        fontSize: '0.625rem',
      }}
    >
      {gate.charAt(0).toUpperCase() + gate.slice(1)}
    </span>
  );
}

// Confidence chip for People tab
export function ConfidenceChip({ score }: { score: number }) {
  let bgColor: string;
  let textColor: string;
  let label: string;

  if (score >= 70) {
    bgColor = 'var(--success-bg)';
    textColor = 'var(--success)';
    label = 'High';
  } else if (score >= 40) {
    bgColor = 'var(--warning-bg)';
    textColor = 'var(--warning)';
    label = 'Medium';
  } else {
    bgColor = 'var(--gray-100)';
    textColor = 'var(--gray-600)';
    label = 'Low';
  }

  return (
    <span
      className="badge"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <span className="font-bold">{score}</span>
      <span style={{ opacity: 0.7 }}>{label}</span>
    </span>
  );
}
