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
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
        Monetization + Gating
      </h3>

      {/* Pricing Model Badge */}
      <div className="mb-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'rgba(7, 59, 57, 0.1)',
            color: 'var(--vaaya-brand)',
          }}
        >
          {PRICING_MODEL_LABELS[pricing_model]}
        </span>
      </div>

      {/* Plan Lineup */}
      {plans.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Plans
          </div>
          <div className="space-y-2">
            {plans.slice(0, 4).map((plan, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                  {plan.name}
                </span>
                <span style={{ color: 'var(--vaaya-brand)' }}>
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
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Enterprise Features
          </div>
          <div className="space-y-1.5">
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
        <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--vaaya-border)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Notable Limits
          </div>
          <ul className="space-y-1">
            {hard_limits.slice(0, 3).map((limit, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--vaaya-text)' }}>
                • {limit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
