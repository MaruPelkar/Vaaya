'use client';

import { Tab1Data } from '@/lib/types';

interface Tab1OverviewProps {
  data: Tab1Data;
}

// Status badge colors
const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  acquired: 'bg-purple-100 text-purple-800',
  ipo: 'bg-blue-100 text-blue-800',
  shut_down: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  active: 'Active',
  acquired: 'Acquired',
  ipo: 'Public (IPO)',
  shut_down: 'Shut Down',
};

export function Tab1Overview({ data }: Tab1OverviewProps) {
  return (
    <div className="space-y-12">
      {/* Header with Status Badge */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-display text-3xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>About</h3>
          {data.status && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[data.status]}`}>
              {STATUS_LABELS[data.status]}
            </span>
          )}
          {data.stock_symbol && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {data.stock_symbol}
            </span>
          )}
        </div>
        <p className="text-base leading-relaxed" style={{ color: 'var(--vaaya-text-muted)' }}>
          {data.description || 'No description available'}
        </p>

        {/* Acquired info */}
        {data.status === 'acquired' && data.acquired_by && (
          <p className="text-sm text-purple-600 mt-2">
            Acquired by {data.acquired_by}
            {data.acquisition_date && ` (${data.acquisition_date})`}
          </p>
        )}

        {/* IPO info */}
        {data.status === 'ipo' && data.ipo_date && (
          <p className="text-sm text-blue-600 mt-2">
            Went public: {data.ipo_date}
          </p>
        )}
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.founded && (
          <div className="bento-box rounded-lg p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>Founded</div>
            <div className="text-lg font-bold mt-2" style={{ color: 'var(--vaaya-text)' }}>{data.founded}</div>
          </div>
        )}
        {data.headquarters && (
          <div className="bento-box rounded-lg p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>Headquarters</div>
            <div className="text-lg font-bold mt-2" style={{ color: 'var(--vaaya-text)' }}>{data.headquarters}</div>
          </div>
        )}
        {(data.employee_count || data.employee_range) && (
          <div className="bento-box rounded-lg p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>Employees</div>
            <div className="text-lg font-bold mt-2" style={{ color: 'var(--vaaya-text)' }}>
              {data.employee_count?.toLocaleString() || data.employee_range}
            </div>
            {data.employee_growth_rate && (
              <div className={`text-xs mt-1 ${data.employee_growth_rate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {data.employee_growth_rate}
              </div>
            )}
          </div>
        )}
        {data.industry && (
          <div className="bento-box rounded-lg p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>Industry</div>
            <div className="text-lg font-bold mt-2" style={{ color: 'var(--vaaya-text)' }}>{data.industry}</div>
          </div>
        )}
      </div>

      {/* Funding Summary */}
      {data.funding?.total && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Total Funding</h3>
          <div className="rounded-lg p-8" style={{ backgroundColor: 'rgba(7, 59, 57, 0.05)', border: '1px solid rgba(7, 59, 57, 0.2)' }}>
            <div className="text-4xl font-bold" style={{ color: 'var(--vaaya-brand)' }}>{data.funding.total}</div>
            {data.funding.last_round && (
              <div className="text-base mt-2" style={{ color: 'var(--vaaya-brand-light)' }}>
                Last round: {data.funding.last_round}
                {data.funding.last_round_date && ` (${data.funding.last_round_date})`}
              </div>
            )}
            {data.funding.investors?.length > 0 && (
              <div className="text-base mt-3" style={{ color: 'var(--vaaya-text-muted)' }}>
                Key investors: {data.funding.investors.slice(0, 5).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Funding Timeline */}
      {data.funding_rounds?.length > 0 && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Funding Timeline</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--vaaya-border)' }} />

            <div className="space-y-6">
              {data.funding_rounds.map((round, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--vaaya-brand)' }} />

                  <div className="flex-1 bento-box rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{round.round_type}</span>
                      {round.date && <span className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>{round.date}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {round.amount && (
                        <span className="font-bold" style={{ color: 'var(--vaaya-brand)' }}>{round.amount}</span>
                      )}
                      {round.valuation && (
                        <span style={{ color: 'var(--vaaya-text-muted)' }}>Valuation: {round.valuation}</span>
                      )}
                    </div>
                    {round.lead_investors?.length > 0 && (
                      <div className="text-sm mt-2 font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                        Lead: {round.lead_investors.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee Trend */}
      {data.employee_trend?.length > 1 && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Employee Growth</h3>
          <div className="bento-box rounded-lg p-6 shadow-sm">
            <div className="flex items-end gap-2 h-24">
              {data.employee_trend.map((point, i) => {
                const maxCount = Math.max(...data.employee_trend!.map(p => p.count));
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{ height: `${height}%`, backgroundColor: 'var(--vaaya-brand)' }}
                      title={`${point.count.toLocaleString()} employees`}
                    />
                    <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>{point.date.slice(0, 7)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Acquisitions */}
      {data.acquisitions?.length > 0 && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Acquisitions Made</h3>
          <div className="space-y-4">
            {data.acquisitions.map((acq, i) => (
              <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'rgba(147, 51, 234, 0.05)', border: '1px solid rgba(147, 51, 234, 0.2)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">{acq.company_name}</span>
                  <div className="flex gap-4 text-sm font-medium">
                    {acq.amount && <span className="text-purple-700">{acq.amount}</span>}
                    {acq.date && <span style={{ color: 'var(--vaaya-text-muted)' }}>{acq.date}</span>}
                  </div>
                </div>
                {acq.description && (
                  <p className="text-base mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>{acq.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {data.competitors?.length > 0 && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Competitive Landscape</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.competitors.map((comp, i) => (
              <div key={i} className="bento-box rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{comp.name}</span>
                  {comp.domain && (
                    <a
                      href={`https://${comp.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--vaaya-brand)' }}
                    >
                      {comp.domain}
                    </a>
                  )}
                </div>
                {comp.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>{comp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership?.length > 0 && (
        <div>
          <h3 className="font-display text-3xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>Leadership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.leadership.map((person, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bento-box rounded-lg shadow-sm">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' }}
                >
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{person.name}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--vaaya-text-muted)' }}>{person.title}</div>
                </div>
                {person.linkedin_url && (
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80"
                    style={{ color: 'var(--vaaya-brand)' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website & Socials */}
      <div className="flex flex-wrap gap-6 pt-8" style={{ borderTop: '1px solid var(--vaaya-border)' }}>
        {data.website && (
          <a
            href={data.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium flex items-center gap-2 hover:opacity-80"
            style={{ color: 'var(--vaaya-brand)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Website
          </a>
        )}
        {data.socials?.twitter && (
          <a
            href={data.socials.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium hover:opacity-80"
            style={{ color: 'var(--vaaya-brand)' }}
          >
            Twitter
          </a>
        )}
        {data.socials?.linkedin && (
          <a
            href={data.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium hover:opacity-80"
            style={{ color: 'var(--vaaya-brand)' }}
          >
            LinkedIn
          </a>
        )}
        {data.socials?.github && (
          <a
            href={data.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium hover:opacity-80"
            style={{ color: 'var(--vaaya-brand)' }}
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
