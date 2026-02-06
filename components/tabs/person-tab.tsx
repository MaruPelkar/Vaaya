'use client';

import { useState } from 'react';
import { PersonData, DiscoveredPerson, CompanyUsing } from '@/lib/types';

interface PersonTabProps {
  data: PersonData | null;
}

type SubTabId = 'companies' | 'people';

const SUB_TAB_CONFIG = [
  {
    id: 'companies' as const,
    label: 'Customer Companies',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: 'people' as const,
    label: 'People',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
];

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
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('companies');

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
  const totalPeople = data.users.length + data.buyers.length;

  // Empty state when no data at all
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
    <div>
      {/* Sub-Tab Navigation */}
      <div
        className="flex gap-2 mb-6 p-1 rounded-lg"
        style={{
          backgroundColor: 'var(--gray-100)',
          border: '1px solid var(--gray-200)',
        }}
      >
        {SUB_TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className="flex-1 px-4 py-2.5 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: activeSubTab === tab.id ? 'var(--white)' : 'transparent',
              boxShadow: activeSubTab === tab.id ? 'var(--shadow-sm)' : 'none',
              color: activeSubTab === tab.id ? 'var(--primary)' : 'var(--gray-500)',
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'var(--gray-200)';
                e.currentTarget.style.color = 'var(--gray-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gray-500)';
              }
            }}
          >
            {tab.icon}
            <span className="font-medium text-sm">{tab.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: activeSubTab === tab.id ? 'var(--primary-light)' : 'var(--gray-200)',
                color: activeSubTab === tab.id ? 'var(--primary)' : 'var(--gray-500)',
              }}
            >
              {tab.id === 'companies' ? data.companies_using.length : totalPeople}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'companies' && (
        <CompaniesSubTab companies={data.companies_using} />
      )}
      {activeSubTab === 'people' && (
        <PeopleSubTab users={data.users} buyers={data.buyers} />
      )}
    </div>
  );
}

function CompaniesSubTab({ companies }: { companies: CompanyUsing[] }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--gray-500)' }}>
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--gray-100)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--gray-900)' }}>
          No Customer Companies Found
        </h3>
        <p>Click refresh to search for customer companies.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
          Companies discovered as customers based on website content, press releases, and web search.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company, i) => (
          <CompanyCard key={i} company={company} />
        ))}
      </div>
    </div>
  );
}

function PeopleSubTab({ users, buyers }: { users: DiscoveredPerson[]; buyers: DiscoveredPerson[] }) {
  const allPeople = [...users, ...buyers];

  if (allPeople.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--gray-500)' }}>
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--gray-100)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--gray-900)' }}>
          No People Found Yet
        </h3>
        <p>People at customer companies will appear here after discovery.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
        People at customer companies who likely use or buy this product, discovered via LinkedIn search.
      </p>

      {/* Users Section */}
      {users.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-semibold text-lg" style={{ color: 'var(--gray-900)' }}>
              Users
            </h4>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: 'var(--blue-100)', color: 'var(--blue-700)' }}
            >
              {users.length} people
            </span>
            <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
              Daily product users
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((person, i) => (
              <PersonCard key={i} person={person} />
            ))}
          </div>
        </section>
      )}

      {/* Buyers Section */}
      {buyers.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-semibold text-lg" style={{ color: 'var(--gray-900)' }}>
              Buyers & Evaluators
            </h4>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: 'var(--purple-100)', color: 'var(--purple-700)' }}
            >
              {buyers.length} people
            </span>
            <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
              Decision makers
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyers.map((person, i) => (
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
