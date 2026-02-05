'use client';

import { Risk, RiskType, RiskSeverity } from '@/lib/types';

interface RiskFlagsProps {
  risks: Risk[];
}

const RISK_TYPE_CONFIG: Record<RiskType, { icon: string; label: string }> = {
  security: { icon: '🔒', label: 'Security' },
  reliability: { icon: '⚡', label: 'Reliability' },
  platform: { icon: '🔗', label: 'Platform' },
  regulatory: { icon: '📋', label: 'Regulatory' },
  pricing: { icon: '💰', label: 'Pricing' },
};

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bgColor: string; label: string }> = {
  medium: { color: '#D97706', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Medium' },
  high: { color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)', label: 'High' },
};

export function RiskFlags({ risks }: RiskFlagsProps) {
  // Only show medium and high severity risks
  const relevantRisks = risks.filter((r) => r.severity === 'medium' || r.severity === 'high');

  // Don't render if no relevant risks
  if (relevantRisks.length === 0) {
    return null;
  }

  return (
    <div className="bento-box rounded-lg p-5" style={{ borderLeft: '4px solid #DC2626' }}>
      <h3 className="text-xs uppercase tracking-wide font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--vaaya-text-muted)' }}>
        <span>⚠️</span>
        Risk Flags
      </h3>

      <div className="space-y-3">
        {relevantRisks.map((risk, i) => {
          const typeConfig = RISK_TYPE_CONFIG[risk.type];
          const severityConfig = SEVERITY_CONFIG[risk.severity];
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-2 px-3 rounded-lg"
              style={{ backgroundColor: severityConfig.bgColor }}
            >
              <span className="text-lg shrink-0">{typeConfig.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--vaaya-text)' }}>
                    {typeConfig.label}
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ color: severityConfig.color }}
                  >
                    {severityConfig.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--vaaya-text)' }}>
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
