'use client';

import { PersonData, DiscoveredPerson, CompanyUsing } from '@/lib/types';

interface PersonTabProps {
  data: PersonData | null;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
};

const PERSONA_TYPE_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  buyer: 'bg-purple-100 text-purple-700',
  evaluator: 'bg-orange-100 text-orange-700',
};

export function PersonTab({ data }: PersonTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--gray-500)' }}>
        No person data available
      </div>
    );
  }

  const hasCompanies = data.companies_using.length > 0;
  const hasUsers = data.users.length > 0;
  const hasBuyers = data.buyers.length > 0;
  const hasPeople = hasUsers || hasBuyers;

  // Empty state when no data
  if (!hasCompanies && !hasPeople) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--gray-500)' }}>
        <div className="text-4xl mb-4">👥</div>
        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--gray-900)' }}>No People Discovered Yet</h3>
        <p>Click refresh to discover customers and relevant personas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Customer Companies */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--gray-900)' }}>
            Customer Companies
          </h3>
          {hasCompanies && (
            <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
              {data.companies_using.length} discovered
            </span>
          )}
        </div>

        {hasCompanies ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.companies_using.map((company, i) => (
              <CompanyCard key={i} company={company} />
            ))}
          </div>
        ) : (
          <div className="dashboard-card rounded-lg p-8 text-center" style={{ color: 'var(--gray-500)' }}>
            No customer companies discovered yet
          </div>
        )}
      </section>

      {/* Users - Daily product users */}
      {hasUsers && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--gray-900)' }}>
              Users
            </h3>
            <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
              {data.users.length} people
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.users.map((person, i) => (
              <PersonCard key={i} person={person} />
            ))}
          </div>
        </section>
      )}

      {/* Buyers - Decision makers */}
      {hasBuyers && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--gray-900)' }}>
              Buyers & Evaluators
            </h3>
            <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
              {data.buyers.length} people
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.buyers.map((person, i) => (
              <PersonCard key={i} person={person} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyUsing }) {
  return (
    <div className="dashboard-card rounded-lg p-4 shadow-sm" style={{ border: '1px solid var(--gray-200)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-bold" style={{ color: 'var(--gray-900)' }}>
          {company.name}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${CONFIDENCE_COLORS[company.confidence]}`}>
          {company.confidence}
        </span>
      </div>

      <div className="space-y-1 text-sm" style={{ color: 'var(--gray-500)' }}>
        {company.domain && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase">Domain:</span>
            <a
              href={`https://${company.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {company.domain}
            </a>
          </div>
        )}
        {company.industry && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase">Industry:</span>
            <span>{company.industry}</span>
          </div>
        )}
        {company.size && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase">Size:</span>
            <span>{company.size}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({ person }: { person: DiscoveredPerson }) {
  return (
    <div className="dashboard-card rounded-lg p-4 shadow-sm" style={{ border: '1px solid var(--gray-200)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold" style={{ color: 'var(--gray-900)' }}>
            {person.name}
          </div>
          {person.role && (
            <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
              {person.role}
            </div>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${PERSONA_TYPE_COLORS[person.type]}`}>
          {person.type}
        </span>
      </div>

      {person.company && (
        <div className="text-sm mb-3" style={{ color: 'var(--gray-500)' }}>
          at <span style={{ color: 'var(--gray-900)' }}>{person.company}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {person.linkedin_url && (
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm flex items-center gap-1 hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            <LinkedInIcon />
            View Profile
          </a>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
            Confidence:
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i <= Math.round(person.confidence_score * 5)
                    ? 'var(--primary)'
                    : 'var(--gray-200)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {person.signals.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--gray-200)' }}>
          <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--gray-500)' }}>
            Discovery Signal
          </div>
          <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
            {person.signals[0].text}
          </p>
        </div>
      )}
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
