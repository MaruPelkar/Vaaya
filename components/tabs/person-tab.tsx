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

// Table styles
const tableStyles = {
  container: {
    backgroundColor: 'var(--white)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--gray-200)',
  },
  wrapper: {
    overflowX: 'auto' as const,
    overflowY: 'auto' as const,
    maxHeight: '500px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.8125rem',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '0.6875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--gray-600)',
    borderBottom: '1px solid var(--gray-300)',
    whiteSpace: 'nowrap' as const,
    backgroundColor: 'var(--gray-100)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--gray-200)',
    color: 'var(--gray-800)',
    verticalAlign: 'middle' as const,
  },
  tdFirst: {
    paddingLeft: '1.5rem',
  },
  tdLast: {
    paddingRight: '1.5rem',
  },
};

const badgeStyles: Record<string, React.CSSProperties> = {
  high: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
  },
  medium: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#d97706',
  },
  low: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--gray-100)',
    color: 'var(--gray-600)',
  },
  user: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#2563eb',
  },
  buyer: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#7c3aed',
  },
  evaluator: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    color: '#ea580c',
  },
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
        <CompaniesTable companies={data.companies_using} />
      )}
      {activeSubTab === 'people' && (
        <PeopleTable users={data.users} buyers={data.buyers} />
      )}
    </div>
  );
}

function CompaniesTable({ companies }: { companies: CompanyUsing[] }) {
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
      <p className="text-sm mb-4" style={{ color: 'var(--gray-500)' }}>
        Companies discovered as customers based on website content, press releases, and web search.
      </p>
      <div style={tableStyles.container}>
        <div style={tableStyles.wrapper}>
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, ...tableStyles.tdFirst }}>Company</th>
                <th style={tableStyles.th}>Domain</th>
                <th style={tableStyles.th}>Industry</th>
                <th style={tableStyles.th}>Size</th>
                <th style={{ ...tableStyles.th, ...tableStyles.tdLast }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, i) => (
                <tr
                  key={i}
                  style={{ transition: 'background 150ms ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ ...tableStyles.td, ...tableStyles.tdFirst, fontWeight: 600 }}>
                    {company.name}
                  </td>
                  <td style={tableStyles.td}>
                    {company.domain ? (
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)' }}
                        className="hover:underline"
                      >
                        {company.domain}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                    )}
                  </td>
                  <td style={tableStyles.td}>
                    {company.industry || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td style={tableStyles.td}>
                    {company.size || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td style={{ ...tableStyles.td, ...tableStyles.tdLast }}>
                    <span style={badgeStyles[company.confidence]}>
                      {company.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PeopleTable({ users, buyers }: { users: DiscoveredPerson[]; buyers: DiscoveredPerson[] }) {
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
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--gray-500)' }}>
        People at customer companies who likely use or buy this product, discovered via LinkedIn search.
      </p>
      <div style={tableStyles.container}>
        <div style={tableStyles.wrapper}>
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, ...tableStyles.tdFirst }}>Name</th>
                <th style={tableStyles.th}>Role</th>
                <th style={tableStyles.th}>Company</th>
                <th style={tableStyles.th}>Type</th>
                <th style={tableStyles.th}>Confidence</th>
                <th style={{ ...tableStyles.th, ...tableStyles.tdLast, textAlign: 'center' }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {allPeople.map((person, i) => (
                <tr
                  key={i}
                  style={{ transition: 'background 150ms ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ ...tableStyles.td, ...tableStyles.tdFirst, fontWeight: 600 }}>
                    {person.name}
                  </td>
                  <td style={tableStyles.td}>
                    {person.role || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td style={tableStyles.td}>
                    {person.company || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td style={tableStyles.td}>
                    <span style={badgeStyles[person.type]}>
                      {person.type}
                    </span>
                  </td>
                  <td style={tableStyles.td}>
                    <ConfidenceBar score={person.confidence_score} />
                  </td>
                  <td style={{ ...tableStyles.td, ...tableStyles.tdLast, textAlign: 'center' }}>
                    {person.linkedin_url ? (
                      <a
                        href={person.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8125rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--white)',
                          color: 'var(--gray-700)',
                          textDecoration: 'none',
                          transition: 'all 150ms ease',
                        }}
                        className="hover:bg-gray-100 hover:border-gray-400"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                          e.currentTarget.style.borderColor = 'var(--gray-400)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--white)';
                          e.currentTarget.style.borderColor = 'var(--gray-300)';
                        }}
                      >
                        <LinkedInIcon />
                        View
                      </a>
                    ) : (
                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          height: '6px',
          width: '60px',
          backgroundColor: 'var(--gray-200)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            borderRadius: '3px',
            transition: 'width 250ms ease',
          }}
        />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', minWidth: '32px' }}>
        {percentage}%
      </span>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
