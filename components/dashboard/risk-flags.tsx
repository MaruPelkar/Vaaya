'use client';

import { Risk, RiskType, RiskSeverity } from '@/lib/types';

interface RiskFlagsProps {
  risks: Risk[];
}

const RISK_TYPE_CONFIG: Record<RiskType, { label: string }> = {
  security: { label: 'Security' },
  reliability: { label: 'Reliability' },
  platform: { label: 'Platform' },
  regulatory: { label: 'Regulatory' },
  pricing: { label: 'Pricing' },
};

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bgColor: string; label: string }> = {
  medium: { color: 'var(--warning)', bgColor: 'var(--warning-bg)', label: 'Medium' },
  high: { color: 'var(--error)', bgColor: 'var(--error-bg)', label: 'High' },
};

export function RiskFlags({ risks }: RiskFlagsProps) {
  // Only show medium and high severity risks
  const relevantRisks = risks.filter((r) => r.severity === 'medium' || r.severity === 'high');

  // Don't render if no relevant risks
  if (relevantRisks.length === 0) {
    return null;
  }

  return (
    <div
      className="dashboard-card"
      style={{ borderLeft: '4px solid var(--error)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3 className="metric-label">Risk Flags</h3>
      </div>

      <div className="space-y-3">
        {relevantRisks.map((risk, i) => {
          const typeConfig = RISK_TYPE_CONFIG[risk.type];
          const severityConfig = SEVERITY_CONFIG[risk.severity];
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-3 px-4 rounded-lg"
              style={{ backgroundColor: severityConfig.bgColor }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
                    {typeConfig.label}
                  </span>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'transparent',
                      color: severityConfig.color,
                      border: `1px solid ${severityConfig.color}`,
                    }}
                  >
                    {severityConfig.label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
                  {risk.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
