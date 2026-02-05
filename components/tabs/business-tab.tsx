'use client';

import { BusinessData } from '@/lib/types';
import { Chip } from '../ui/chip';

interface BusinessTabProps {
  data: BusinessData | null;
}

export function BusinessTab({ data }: BusinessTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        No business data available
      </div>
    );
  }

  const hasGTM = data.gtm.primary_buyer_roles.length > 0 || data.gtm.acquisition_channels.length > 0;
  const hasPlans = data.pricing.plans.length > 0;
  const hasCompetitors = data.competition.competitors.length > 0;
  const hasSignals = data.signals.funding || data.signals.hiring || data.signals.web_footprint;

  // Empty state when no data
  if (!hasGTM && !hasPlans && !hasCompetitors && !hasSignals) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--vaaya-text)' }}>Business Tab Coming Soon</h3>
        <p>Strategic and competitive intelligence will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* GTM Profile */}
      {hasGTM && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            GTM Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bento-box rounded-lg p-6 shadow-sm">
              <div className="text-xs uppercase font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                Motion
              </div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(7, 59, 57, 0.1)',
                  color: 'var(--vaaya-brand)',
                }}
              >
                {data.gtm.motion === 'plg' ? 'Product-Led Growth' :
                 data.gtm.motion === 'sales_led' ? 'Sales-Led' : 'Hybrid'}
              </span>
              <div className="mt-4 text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
                Implementation: <span style={{ color: 'var(--vaaya-text)' }}>
                  {data.gtm.implementation_model === 'self_serve' ? 'Self-Serve' :
                   data.gtm.implementation_model === 'assisted' ? 'Assisted' : 'Professional Services'}
                </span>
              </div>
            </div>

            <div className="bento-box rounded-lg p-6 shadow-sm">
              <div className="text-xs uppercase font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                Buyer Roles
              </div>
              <div className="flex flex-wrap gap-2">
                {data.gtm.primary_buyer_roles.map((role, i) => (
                  <Chip key={i} variant="persona">{role}</Chip>
                ))}
              </div>
            </div>

            {data.gtm.acquisition_channels.length > 0 && (
              <div className="bento-box rounded-lg p-6 shadow-sm">
                <div className="text-xs uppercase font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Acquisition Channels
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.gtm.acquisition_channels.map((channel, i) => (
                    <Chip key={i} variant="category">{channel}</Chip>
                  ))}
                </div>
              </div>
            )}

            {data.gtm.expansion_levers.length > 0 && (
              <div className="bento-box rounded-lg p-6 shadow-sm">
                <div className="text-xs uppercase font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Expansion Levers
                </div>
                <ul className="space-y-1">
                  {data.gtm.expansion_levers.map((lever, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                      <span style={{ color: 'var(--vaaya-brand)' }}>•</span>
                      {lever}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pricing & Packaging */}
      {hasPlans && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Pricing & Packaging
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.pricing.plans.map((plan, i) => (
              <div key={i} className="bento-box rounded-lg p-6 shadow-sm">
                <div className="font-bold text-lg mb-2" style={{ color: 'var(--vaaya-text)' }}>
                  {plan.name}
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--vaaya-brand)' }}>
                  {plan.price_display || 'Contact Sales'}
                </div>
                {plan.billing_terms.length > 0 && (
                  <div className="text-xs mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {plan.billing_terms.join(', ')}
                  </div>
                )}

                {plan.key_features.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {plan.key_features.slice(0, 5).map((feature, j) => (
                      <li key={j} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                        <span className="text-green-600">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {plan.enterprise_gates.length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--vaaya-border)' }}>
                    <div className="flex flex-wrap gap-1">
                      {plan.enterprise_gates.map((gate, j) => (
                        <Chip key={j} variant="small">{gate}</Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Competition */}
      {hasCompetitors && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Competition
          </h3>

          {data.competition.feature_parity_summary && (
            <div className="bento-box rounded-lg p-6 mb-6 shadow-sm" style={{ borderLeft: '4px solid var(--vaaya-brand)' }}>
              <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                Feature Parity
              </div>
              <p style={{ color: 'var(--vaaya-text)' }}>{data.competition.feature_parity_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.competition.competitors.map((comp, i) => (
              <div key={i} className="bento-box rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm" style={{ color: 'var(--vaaya-text)' }}>
                    {comp.name}
                  </div>
                  <Chip variant="small">{comp.type}</Chip>
                </div>

                {comp.overlap_jobs.length > 0 && (
                  <div className="text-xs mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                    Overlaps: {comp.overlap_jobs.slice(0, 2).join(', ')}
                  </div>
                )}

                {comp.win_reasons.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-green-600 mb-1">Win reasons:</div>
                    <ul className="text-xs space-y-1">
                      {comp.win_reasons.slice(0, 2).map((reason, j) => (
                        <li key={j} style={{ color: 'var(--vaaya-text-muted)' }}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signals */}
      {hasSignals && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Signals
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Funding */}
            {data.signals.funding && (
              <div className="bento-box rounded-lg p-4 shadow-sm">
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Funding
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--vaaya-brand)' }}>
                  {data.signals.funding.total_raised}
                </div>
                <div className="text-sm" style={{ color: 'var(--vaaya-text)' }}>
                  {data.signals.funding.stage}
                </div>
                {data.signals.funding.investors.length > 0 && (
                  <div className="text-xs mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {data.signals.funding.investors.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Hiring */}
            {data.signals.hiring && (
              <div className="bento-box rounded-lg p-4 shadow-sm">
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Hiring
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
                  {data.signals.hiring.total_open_roles} roles
                </div>
                <div className={`text-sm ${
                  data.signals.hiring.velocity === 'accelerating' ? 'text-green-600' :
                  data.signals.hiring.velocity === 'slowing' ? 'text-red-600' : ''
                }`} style={data.signals.hiring.velocity === 'stable' ? { color: 'var(--vaaya-text-muted)' } : {}}>
                  {data.signals.hiring.velocity}
                </div>
              </div>
            )}

            {/* Web Footprint */}
            {data.signals.web_footprint && (
              <div className="bento-box rounded-lg p-4 shadow-sm">
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Web Traffic
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
                  {data.signals.web_footprint.traffic_estimate}
                </div>
                <div className={`text-sm ${
                  data.signals.web_footprint.trend === 'up' ? 'text-green-600' :
                  data.signals.web_footprint.trend === 'down' ? 'text-red-600' : ''
                }`}>
                  {data.signals.web_footprint.trend === 'up' ? '↑ Growing' :
                   data.signals.web_footprint.trend === 'down' ? '↓ Declining' : '→ Stable'}
                </div>
              </div>
            )}

            {/* Reliability */}
            {data.signals.reliability && (
              <div className="bento-box rounded-lg p-4 shadow-sm">
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Reliability
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
                  {data.signals.reliability.incidents_30d} incidents
                </div>
                {data.signals.reliability.uptime_percent && (
                  <div className="text-sm text-green-600">
                    {data.signals.reliability.uptime_percent}% uptime
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
