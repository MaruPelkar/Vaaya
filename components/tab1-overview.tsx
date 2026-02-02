'use client';

import { Tab1Data } from '@/lib/types';

interface Tab1OverviewProps {
  data: Tab1Data;
}

export function Tab1Overview({ data }: Tab1OverviewProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
        <p className="text-gray-600">{data.description || 'No description available'}</p>
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
        {data.employee_range && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Employees</div>
            <div className="text-lg font-semibold">{data.employee_range}</div>
          </div>
        )}
        {data.industry && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Industry</div>
            <div className="text-lg font-semibold">{data.industry}</div>
          </div>
        )}
      </div>

      {/* Funding */}
      {data.funding?.total && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding</h3>
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
                Investors: {data.funding.investors.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Leadership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.leadership.map((person, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{person.name}</div>
                  <div className="text-sm text-gray-500">{person.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website & Socials */}
      <div className="flex flex-wrap gap-4">
        {data.website && (
          <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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
