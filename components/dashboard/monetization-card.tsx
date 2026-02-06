'use client';

import { PlanSummary, EnterpriseGate, PricingModel } from '@/lib/types';
import { ChecklistItem } from '../ui/checklist-item';

interface MonetizationCardProps {
  pricing_model: PricingModel;
  plans: PlanSummary[];
  enterprise_gates: EnterpriseGate[];
  hard_limits: string[];
}

const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  seat: 'Per Seat',
  usage: 'Usage Based',
  subscription: 'Subscription',
  transaction: 'Per Transaction',
  hybrid: 'Hybrid',
  unknown: 'Unknown',
};

export function MonetizationCard({
  pricing_model,
  plans,
  enterprise_gates,
  hard_limits,
}: MonetizationCardProps) {
  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="metric-label">Monetization + Gating</h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>

      {/* Pricing Model Badge */}
      <div className="mb-4">
        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(26, 107, 107, 0.1)',
            color: 'var(--primary)',
          }}
        >
          {PRICING_MODEL_LABELS[pricing_model]}
        </span>
      </div>

      {/* Plan Lineup */}
      {plans.length > 0 && (
        <div className="mb-4">
          <div className="metric-label mb-3">Plans</div>
          <div className="space-y-2">
            {plans.slice(0, 4).map((plan, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm p-2 rounded-lg"
                style={{ backgroundColor: 'var(--gray-100)' }}
              >
                <span className="font-medium" style={{ color: 'var(--gray-800)' }}>
                  {plan.name}
                </span>
                <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                  {plan.price_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enterprise Gates */}
      {enterprise_gates.length > 0 && (
        <div className="mb-4">
          <div className="metric-label mb-3">Enterprise Features</div>
          <div className="space-y-2">
            {enterprise_gates.map((gate, i) => (
              <ChecklistItem
                key={i}
                label={gate.name}
                checked={gate.available}
                subtext={gate.plan}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hard Limits */}
      {hard_limits.length > 0 && (
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--gray-200)' }}>
          <div className="metric-label mb-2">Notable Limits</div>
          <ul className="space-y-2">
            {hard_limits.slice(0, 3).map((limit, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--gray-700)' }}>
                <span style={{ color: 'var(--warning)' }}>!</span>
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
