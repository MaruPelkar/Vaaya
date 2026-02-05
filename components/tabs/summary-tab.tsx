'use client';

import { SummaryData } from '@/lib/types';
import { Chip } from '../ui/chip';

interface SummaryTabProps {
  data: SummaryData | null;
}

export function SummaryTab({ data }: SummaryTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        No summary data available
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* One-liner + Category Tags + Platforms */}
      <section>
        <p className="text-xl leading-relaxed mb-4" style={{ color: 'var(--vaaya-text)' }}>
          {data.one_liner || 'Company description not available'}
        </p>
        <div className="flex flex-wrap gap-2">
          {data.category_tags.map((tag, i) => (
            <Chip key={`cat-${i}`} variant="category">{tag}</Chip>
          ))}
          {data.platforms.map((platform, i) => (
            <Chip key={`plat-${i}`} variant="platform">{platform}</Chip>
          ))}
        </div>
      </section>

      {/* ICP + Personas Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ICP Chips */}
        <div className="bento-box rounded-lg p-6 shadow-sm">
          <h3 className="text-xs uppercase tracking-wide font-medium mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
            Ideal Customer Profile
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.icp_chips.length > 0 ? (
              data.icp_chips.map((icp, i) => (
                <Chip key={i} variant="icp">{icp}</Chip>
              ))
            ) : (
              <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>Not identified</span>
            )}
          </div>
        </div>

        {/* Personas */}
        <div className="bento-box rounded-lg p-6 shadow-sm">
          <h3 className="text-xs uppercase tracking-wide font-medium mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
            Key Personas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--vaaya-brand)' }}>Users</h4>
              {data.personas.users.length > 0 ? (
                <ul className="space-y-1">
                  {data.personas.users.map((p, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--vaaya-text)' }}>{p.title}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>Not identified</span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--vaaya-brand)' }}>Buyers</h4>
              {data.personas.buyers.length > 0 ? (
                <ul className="space-y-1">
                  {data.personas.buyers.map((p, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--vaaya-text)' }}>{p.title}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>Not identified</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top Use Cases */}
      {data.top_use_cases.length > 0 && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--vaaya-text)' }}>
            Top Use Cases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.top_use_cases.slice(0, 5).map((uc, i) => (
              <div key={i} className="bento-box rounded-lg p-5 shadow-sm">
                <div className="font-bold mb-2" style={{ color: 'var(--vaaya-text)' }}>{uc.title}</div>
                <p className="text-sm mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>{uc.description}</p>
                {uc.persona_fit.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {uc.persona_fit.map((persona, j) => (
                      <Chip key={j} variant="small">{persona}</Chip>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why They Win / Where They Lose */}
      {(data.why_they_win.length > 0 || data.where_they_lose.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why They Win */}
          <div
            className="bento-box rounded-lg p-6 shadow-sm"
            style={{ borderLeft: '4px solid var(--vaaya-brand)' }}
          >
            <h3 className="font-bold mb-4" style={{ color: 'var(--vaaya-brand)' }}>Why They Win</h3>
            <ul className="space-y-3">
              {data.why_they_win.length > 0 ? (
                data.why_they_win.slice(0, 3).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                    <span className="font-bold" style={{ color: 'var(--vaaya-brand)' }}>+</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>No strengths identified</li>
              )}
            </ul>
          </div>

          {/* Where They Lose */}
          <div
            className="bento-box rounded-lg p-6 shadow-sm"
            style={{ borderLeft: '4px solid #EF4444' }}
          >
            <h3 className="font-bold mb-4 text-red-600">Where They Lose</h3>
            <ul className="space-y-3">
              {data.where_they_lose.length > 0 ? (
                data.where_they_lose.slice(0, 3).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                    <span className="font-bold text-red-600">-</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>No weaknesses identified</li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Product Map */}
      {data.product_map.length > 0 && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--vaaya-text)' }}>
            Product Map
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.product_map.map((module, i) => (
              <div key={i} className="bento-box rounded-lg p-4 shadow-sm">
                <div className="font-bold text-sm mb-1" style={{ color: 'var(--vaaya-text)' }}>{module.name}</div>
                <p className="text-xs mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>{module.description}</p>
                {module.key_features.length > 0 && (
                  <div className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {module.key_features.slice(0, 3).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing at a Glance */}
      <section className="bento-box rounded-lg p-6 shadow-sm">
        <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
          Pricing at a Glance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--vaaya-text-muted)' }}>
              Free Tier
            </div>
            <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>
              {data.pricing_at_glance.has_free_tier ? 'Yes' : 'No'}
            </div>
            {data.pricing_at_glance.free_tier_description && (
              <div className="text-xs mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                {data.pricing_at_glance.free_tier_description}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--vaaya-text-muted)' }}>
              Starting At
            </div>
            <div className="font-bold" style={{ color: 'var(--vaaya-brand)' }}>
              {data.pricing_at_glance.starting_price || 'Contact Sales'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--vaaya-text-muted)' }}>
              Pricing Model
            </div>
            <div className="font-bold capitalize" style={{ color: 'var(--vaaya-text)' }}>
              {data.pricing_at_glance.pricing_model.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--vaaya-text-muted)' }}>
              Enterprise Gates
            </div>
            <div className="flex flex-wrap gap-1">
              {data.pricing_at_glance.enterprise_gates.length > 0 ? (
                data.pricing_at_glance.enterprise_gates.map((gate, i) => (
                  <Chip key={i} variant="small">{gate}</Chip>
                ))
              ) : (
                <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>None</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Key Signals */}
      <section>
        <h3 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--vaaya-text)' }}>
          Key Signals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.signals.funding_stage && (
            <div className="bento-box rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-brand)' }}>
                {data.signals.funding_stage}
              </div>
              <div className="text-xs uppercase tracking-wide font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                Funding Stage
              </div>
            </div>
          )}
          {data.signals.total_funding && (
            <div className="bento-box rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-brand)' }}>
                {data.signals.total_funding}
              </div>
              <div className="text-xs uppercase tracking-wide font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                Total Funding
              </div>
            </div>
          )}
          {data.signals.headcount && (
            <div className="bento-box rounded-lg p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>
                  {data.signals.headcount.toLocaleString()}
                </div>
                {data.signals.headcount_trend && (
                  <span className={`text-xs font-medium ${
                    data.signals.headcount_trend === 'growing' ? 'text-green-600' :
                    data.signals.headcount_trend === 'shrinking' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {data.signals.headcount_trend === 'growing' ? '↑' :
                     data.signals.headcount_trend === 'shrinking' ? '↓' : '→'}
                  </span>
                )}
              </div>
              <div className="text-xs uppercase tracking-wide font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                Employees
              </div>
            </div>
          )}
          {data.signals.hiring_mix && (
            <div className="bento-box rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                Hiring Mix
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Engineering</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>{data.signals.hiring_mix.engineering_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Sales</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>{data.signals.hiring_mix.sales_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>Product</span>
                  <span className="font-medium" style={{ color: 'var(--vaaya-text)' }}>{data.signals.hiring_mix.product_pct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Changes */}
      {(data.recent_changes.thirty_days.length > 0 || data.recent_changes.ninety_days.length > 0) && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--vaaya-text)' }}>
            What Changed Recently
          </h3>
          <div className="space-y-6">
            {/* Last 30 Days */}
            {data.recent_changes.thirty_days.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Last 30 Days
                </h4>
                <div className="space-y-2">
                  {data.recent_changes.thirty_days.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-3 px-4 bento-box rounded-lg"
                    >
                      <Chip variant="change_type" changeType={change.type}>{change.type}</Chip>
                      <span className="flex-1 text-sm" style={{ color: 'var(--vaaya-text)' }}>{change.title}</span>
                      <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>{change.date}</span>
                      {change.source_url && (
                        <a
                          href={change.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline"
                          style={{ color: 'var(--vaaya-brand)' }}
                        >
                          Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last 90 Days (if different from 30) */}
            {data.recent_changes.ninety_days.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Last 90 Days
                </h4>
                <div className="space-y-2">
                  {data.recent_changes.ninety_days.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-3 px-4 bento-box rounded-lg"
                    >
                      <Chip variant="change_type" changeType={change.type}>{change.type}</Chip>
                      <span className="flex-1 text-sm" style={{ color: 'var(--vaaya-text)' }}>{change.title}</span>
                      <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>{change.date}</span>
                      {change.source_url && (
                        <a
                          href={change.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline"
                          style={{ color: 'var(--vaaya-brand)' }}
                        >
                          Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
