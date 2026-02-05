'use client';

import { BusinessData, TimelineEvent } from '@/lib/types';
import { Chip } from '../ui/chip';

interface BusinessTabProps {
  data: BusinessData | null;
}

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  pricing_change: 'bg-amber-100 text-amber-700',
  product_launch: 'bg-green-100 text-green-700',
  funding: 'bg-blue-100 text-blue-700',
  acquisition: 'bg-purple-100 text-purple-700',
  leadership: 'bg-pink-100 text-pink-700',
  partnership: 'bg-cyan-100 text-cyan-700',
  repositioning: 'bg-orange-100 text-orange-700',
};

export function BusinessTab({ data }: BusinessTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        No business data available
      </div>
    );
  }

  const hasPlans = data.pricing.plans.length > 0;
  const hasCompetitors = data.competitive.direct_competitors.length > 0 || data.competitive.alternatives.length > 0;
  const hasTimeline = data.timeline.length > 0;
  const hasFunding = data.traction.funding.total_raised || data.traction.funding.last_round;

  return (
    <div className="space-y-10">
      {/* Pricing & Packaging */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>
            Pricing & Packaging
          </h3>
          {data.pricing.pricing_page_url && (
            <a
              href={data.pricing.pricing_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--vaaya-brand)' }}
            >
              View Pricing Page →
            </a>
          )}
        </div>

        {hasPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {data.pricing.plans.map((plan, i) => (
              <div key={i} className="bento-box rounded-lg p-6 shadow-sm">
                <div className="font-bold text-lg mb-2" style={{ color: 'var(--vaaya-text)' }}>
                  {plan.name}
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--vaaya-brand)' }}>
                  {plan.price || 'Contact Sales'}
                </div>
                {plan.billing_cycle && (
                  <div className="text-xs mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {plan.billing_cycle}
                  </div>
                )}
                {plan.target_audience && (
                  <div className="text-sm mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                    For: {plan.target_audience}
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

                {plan.limits.length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--vaaya-border)' }}>
                    <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                      Limits
                    </div>
                    {plan.limits.slice(0, 3).map((limit, j) => (
                      <div key={j} className="text-xs flex justify-between" style={{ color: 'var(--vaaya-text-muted)' }}>
                        <span>{limit.name}</span>
                        <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>{limit.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-box rounded-lg p-8 text-center mb-6" style={{ color: 'var(--vaaya-text-muted)' }}>
            No pricing plans identified
          </div>
        )}

        {/* Trial & Enterprise Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bento-box rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-bold uppercase mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
              Trial Info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--vaaya-text-muted)' }}>Free Trial</span>
                <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                  {data.pricing.trial_info.has_free_trial ? 'Yes' : 'No'}
                </span>
              </div>
              {data.pricing.trial_info.trial_length_days && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Trial Length</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                    {data.pricing.trial_info.trial_length_days} days
                  </span>
                </div>
              )}
              {data.pricing.trial_info.requires_credit_card !== null && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Credit Card Required</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                    {data.pricing.trial_info.requires_credit_card ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bento-box rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-bold uppercase mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
              Enterprise
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--vaaya-text-muted)' }}>Enterprise Plan</span>
                <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                  {data.pricing.enterprise_info.has_enterprise ? 'Yes' : 'No'}
                </span>
              </div>
              {data.pricing.enterprise_info.contact_sales && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Contact Sales</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>Required</span>
                </div>
              )}
              {data.pricing.enterprise_info.known_features.length > 0 && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-1">
                    {data.pricing.enterprise_info.known_features.slice(0, 5).map((f, i) => (
                      <Chip key={i} variant="small">{f}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Landscape */}
      {hasCompetitors && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Competitive Landscape
          </h3>

          {data.competitive.competitive_positioning && (
            <div className="bento-box rounded-lg p-6 mb-6 shadow-sm" style={{ borderLeft: '4px solid var(--vaaya-brand)' }}>
              <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                Positioning
              </div>
              <p style={{ color: 'var(--vaaya-text)' }}>{data.competitive.competitive_positioning}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct Competitors */}
            {data.competitive.direct_competitors.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Direct Competitors
                </h4>
                <div className="space-y-3">
                  {data.competitive.direct_competitors.map((comp, i) => (
                    <div key={i} className="bento-box rounded-lg p-4 shadow-sm">
                      <div className="font-bold text-sm mb-1" style={{ color: 'var(--vaaya-text)' }}>
                        {comp.name}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                        {comp.description}
                      </p>
                      <div className="text-xs" style={{ color: 'var(--vaaya-brand)' }}>
                        {comp.positioning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {data.competitive.alternatives.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Alternatives
                </h4>
                <div className="space-y-3">
                  {data.competitive.alternatives.map((alt, i) => (
                    <div key={i} className="bento-box rounded-lg p-4 shadow-sm">
                      <div className="font-bold text-sm mb-1" style={{ color: 'var(--vaaya-text)' }}>
                        {alt.name}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                        {alt.description}
                      </p>
                      <div className="text-xs" style={{ color: 'var(--vaaya-brand)' }}>
                        {alt.positioning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Differentiators */}
          {data.competitive.differentiators.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                Key Differentiators
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.competitive.differentiators.map((diff, i) => (
                  <Chip key={i} variant="category">{diff}</Chip>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Traction Signals */}
      <section>
        <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
          Traction Signals
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Funding */}
          {hasFunding && (
            <div className="bento-box rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                Funding
              </div>
              {data.traction.funding.total_raised && (
                <div className="text-xl font-bold" style={{ color: 'var(--vaaya-brand)' }}>
                  {data.traction.funding.total_raised}
                </div>
              )}
              {data.traction.funding.last_round && (
                <div className="text-sm" style={{ color: 'var(--vaaya-text)' }}>
                  {data.traction.funding.last_round}
                  {data.traction.funding.last_round_amount && ` (${data.traction.funding.last_round_amount})`}
                </div>
              )}
              {data.traction.funding.investors.length > 0 && (
                <div className="text-xs mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  {data.traction.funding.investors.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Hiring */}
          <div className="bento-box rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
              Hiring
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
              {data.traction.hiring.total_open_roles} roles
            </div>
            <div className={`text-sm ${
              data.traction.hiring.velocity === 'accelerating' ? 'text-green-600' :
              data.traction.hiring.velocity === 'slowing' ? 'text-red-600' :
              ''
            }`} style={data.traction.hiring.velocity === 'stable' || data.traction.hiring.velocity === 'unknown' ? { color: 'var(--vaaya-text-muted)' } : {}}>
              {data.traction.hiring.velocity}
            </div>
            {data.traction.hiring.key_hires_focus.length > 0 && (
              <div className="text-xs mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                Focus: {data.traction.hiring.key_hires_focus.slice(0, 2).join(', ')}
              </div>
            )}
          </div>

          {/* Web Traffic */}
          <div className="bento-box rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
              Web Traffic
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
              {data.traction.web_proxies.estimated_traffic || 'Unknown'}
            </div>
            <div className={`text-sm ${
              data.traction.web_proxies.traffic_trend === 'up' ? 'text-green-600' :
              data.traction.web_proxies.traffic_trend === 'down' ? 'text-red-600' :
              ''
            }`} style={data.traction.web_proxies.traffic_trend === 'stable' || data.traction.web_proxies.traffic_trend === 'unknown' ? { color: 'var(--vaaya-text-muted)' } : {}}>
              {data.traction.web_proxies.traffic_trend === 'up' ? '↑ Growing' :
               data.traction.web_proxies.traffic_trend === 'down' ? '↓ Declining' :
               data.traction.web_proxies.traffic_trend === 'stable' ? '→ Stable' : 'Unknown'}
            </div>
          </div>

          {/* Customer Proof */}
          <div className="bento-box rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
              Customer Proof
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--vaaya-text-muted)' }}>Case Studies</span>
                <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                  {data.traction.customer_proof.case_studies_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--vaaya-text-muted)' }}>Testimonials</span>
                <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>
                  {data.traction.customer_proof.testimonials_count}
                </span>
              </div>
            </div>
            {data.traction.customer_proof.notable_customers.length > 0 && (
              <div className="text-xs mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                {data.traction.customer_proof.notable_customers.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      {hasTimeline && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Timeline
          </h3>
          <div className="space-y-3">
            {data.timeline.map((event, i) => (
              <div key={i} className="bento-box rounded-lg p-4 shadow-sm flex items-start gap-4">
                <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${EVENT_COLORS[event.type] || 'bg-gray-100 text-gray-700'}`}>
                  {event.type.replace('_', ' ')}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: 'var(--vaaya-text)' }}>
                    {event.title}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {event.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {event.date}
                  </div>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline"
                      style={{ color: 'var(--vaaya-brand)' }}
                    >
                      {event.source_name || 'Source'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sources */}
      {data.sources.length > 0 && (
        <section className="bento-box rounded-lg p-6 shadow-sm">
          <details>
            <summary className="text-sm font-bold uppercase cursor-pointer" style={{ color: 'var(--vaaya-text-muted)' }}>
              Sources ({data.sources.length})
            </summary>
            <div className="mt-4 space-y-2">
              {data.sources.map((source, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Chip variant="small">{source.type}</Chip>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                    style={{ color: 'var(--vaaya-brand)' }}
                  >
                    {source.name}
                  </a>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
