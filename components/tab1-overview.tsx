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
    <div className="space-y-8">
      {/* Header with Status Badge */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
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
        <p className="text-gray-600">{data.description || 'No description available'}</p>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.founded && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Founded</div>
            <div className="text-lg font-semibold">{data.founded}</div>
          </div>
        )}
        {data.headquarters && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Headquarters</div>
            <div className="text-lg font-semibold">{data.headquarters}</div>
          </div>
        )}
        {(data.employee_count || data.employee_range) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Employees</div>
            <div className="text-lg font-semibold">
              {data.employee_count?.toLocaleString() || data.employee_range}
            </div>
            {data.employee_growth_rate && (
              <div className={`text-xs ${data.employee_growth_rate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {data.employee_growth_rate}
              </div>
            )}
          </div>
        )}
        {data.industry && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Industry</div>
            <div className="text-lg font-semibold">{data.industry}</div>
          </div>
        )}
      </div>

      {/* Funding Summary */}
      {data.funding?.total && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Total Funding</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{data.funding.total}</div>
            {data.funding.last_round && (
              <div className="text-sm text-green-600 mt-1">
                Last round: {data.funding.last_round}
                {data.funding.last_round_date && ` (${data.funding.last_round_date})`}
              </div>
            )}
            {data.funding.investors?.length > 0 && (
              <div className="text-sm text-gray-600 mt-2">
                Key investors: {data.funding.investors.slice(0, 5).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Funding Timeline */}
      {data.funding_rounds?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Funding Timeline</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {data.funding_rounds.map((round, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />

                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{round.round_type}</span>
                      {round.date && <span className="text-sm text-gray-500">{round.date}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm">
                      {round.amount && (
                        <span className="text-green-700 font-medium">{round.amount}</span>
                      )}
                      {round.valuation && (
                        <span className="text-gray-600">Valuation: {round.valuation}</span>
                      )}
                    </div>
                    {round.lead_investors?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Growth</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-end gap-2 h-24">
              {data.employee_trend.map((point, i) => {
                const maxCount = Math.max(...data.employee_trend!.map(p => p.count));
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                      title={`${point.count.toLocaleString()} employees`}
                    />
                    <span className="text-xs text-gray-500">{point.date.slice(0, 7)}</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Acquisitions Made</h3>
          <div className="space-y-3">
            {data.acquisitions.map((acq, i) => (
              <div key={i} className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-900">{acq.company_name}</span>
                  <div className="flex gap-3 text-sm">
                    {acq.amount && <span className="text-purple-700">{acq.amount}</span>}
                    {acq.date && <span className="text-gray-500">{acq.date}</span>}
                  </div>
                </div>
                {acq.description && (
                  <p className="text-sm text-gray-600 mt-1">{acq.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {data.competitors?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Landscape</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.competitors.map((comp, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{comp.name}</span>
                  {comp.domain && (
                    <a
                      href={`https://${comp.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {comp.domain}
                    </a>
                  )}
                </div>
                {comp.description && (
                  <p className="text-sm text-gray-500 mt-1">{comp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Leadership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.leadership.map((person, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{person.name}</div>
                  <div className="text-sm text-gray-500">{person.title}</div>
                </div>
                {person.linkedin_url && (
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
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
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
        {data.website && (
          <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Website
          </a>
        )}
        {data.socials?.twitter && (
          <a href={data.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Twitter
          </a>
        )}
        {data.socials?.linkedin && (
          <a href={data.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            LinkedIn
          </a>
        )}
        {data.socials?.github && (
          <a href={data.socials.github} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
