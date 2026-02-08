'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Campaign } from '@/lib/types/research';

interface DiscoveredPerson {
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  isDuplicate?: boolean;
  selected?: boolean;
}

const defaultTitles = [
  'Product Manager',
  'Senior Product Manager',
  'Head of Product',
  'VP Product',
  'Engineering Manager',
  'CTO',
  'CEO',
  'Founder',
  'Director of Engineering',
  'UX Designer',
  'Head of Design',
];

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchMode, setSearchMode] = useState<'company' | 'companies'>('company');
  const [companyInput, setCompanyInput] = useState('');
  const [companiesInput, setCompaniesInput] = useState('');
  const [selectedTitles, setSelectedTitles] = useState<string[]>(['Product Manager', 'Engineering Manager']);
  const [customTitle, setCustomTitle] = useState('');
  const [limit, setLimit] = useState(10);

  // Results state
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DiscoveredPerson[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(name)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCampaign(data);

      // Pre-populate search from campaign criteria if available
      if (data.target_criteria?.job_titles?.length) {
        setSelectedTitles(data.target_criteria.job_titles);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setImportResult(null);

    try {
      const body: Record<string, unknown> = {
        mode: searchMode,
        titles: selectedTitles,
        limit,
        campaignId: params.id,
      };

      if (searchMode === 'company') {
        body.company = companyInput.trim();
      } else {
        body.companies = companiesInput
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean);
      }

      const response = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(
        data.people.map((p: DiscoveredPerson) => ({
          ...p,
          selected: !p.isDuplicate,
        }))
      );
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleImport() {
    const selectedPeople = results.filter((p) => p.selected);
    if (selectedPeople.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/discovery/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: params.id,
          people: selectedPeople,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult({
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors,
      });

      // Clear imported from results
      if (data.imported > 0) {
        setResults((prev) =>
          prev.filter((p) => !selectedPeople.some((s) => s.email === p.email && s.name === p.name))
        );
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function toggleTitle(title: string) {
    setSelectedTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }

  function addCustomTitle() {
    if (customTitle.trim() && !selectedTitles.includes(customTitle.trim())) {
      setSelectedTitles((prev) => [...prev, customTitle.trim()]);
      setCustomTitle('');
    }
  }

  function togglePersonSelection(index: number) {
    setResults((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  function selectAll() {
    setResults((prev) => prev.map((p) => ({ ...p, selected: !p.isDuplicate })));
  }

  function deselectAll() {
    setResults((prev) => prev.map((p) => ({ ...p, selected: false })));
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Not Found' }]}>
        <div className="empty-state">
          <h3 className="empty-state-title">Campaign not found</h3>
          <Link href="/campaigns" className="btn btn-primary mt-4">
            Back to Campaigns
          </Link>
        </div>
      </AppLayout>
    );
  }

  const selectedCount = results.filter((p) => p.selected).length;

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign.name, href: `/campaigns/${campaign.id}` },
        { label: 'Discovery' },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Find Participants</h1>
          <p className="page-description">
            Search for people matching your criteria using Nyne API
          </p>
        </div>
        <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary">
          Back to Campaign
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="col-span-1">
          <div className="card sticky top-20">
            <div className="card-header">
              <h3 className="card-title">Search Criteria</h3>
            </div>

            {/* Mode Selection */}
            <div className="form-group">
              <label className="form-label">Search Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSearchMode('company')}
                  className={`btn btn-sm flex-1 ${searchMode === 'company' ? 'btn-primary' : 'btn-outline'}`}
                >
                  Single Company
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('companies')}
                  className={`btn btn-sm flex-1 ${searchMode === 'companies' ? 'btn-primary' : 'btn-outline'}`}
                >
                  Multiple
                </button>
              </div>
            </div>

            {/* Company Input */}
            {searchMode === 'company' ? (
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Stripe, Notion, Figma"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Companies (one per line)</label>
                <textarea
                  className="input textarea"
                  placeholder="Stripe&#10;Notion&#10;Figma"
                  value={companiesInput}
                  onChange={(e) => setCompaniesInput(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Job Titles */}
            <div className="form-group">
              <label className="form-label">Job Titles</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTitles.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => toggleTitle(title)}
                    className="badge badge-success cursor-pointer"
                  >
                    {title} &times;
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {defaultTitles
                  .filter((t) => !selectedTitles.includes(t))
                  .map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => toggleTitle(title)}
                      className="badge badge-neutral cursor-pointer hover:bg-gray-200"
                    >
                      + {title}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-sm flex-1"
                  placeholder="Custom title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTitle()}
                />
                <button
                  type="button"
                  onClick={addCustomTitle}
                  className="btn btn-ghost btn-sm"
                  disabled={!customTitle.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Limit */}
            <div className="form-group">
              <label className="form-label">Max Results</label>
              <select
                className="select w-full"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={5}>5 people</option>
                <option value={10}>10 people</option>
                <option value={20}>20 people</option>
                <option value={50}>50 people</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={
                searching ||
                selectedTitles.length === 0 ||
                (searchMode === 'company' && !companyInput.trim()) ||
                (searchMode === 'companies' && !companiesInput.trim())
              }
              className="btn btn-primary w-full"
            >
              {searching ? (
                <>
                  <span className="animate-spin">&#9696;</span>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>

            {searchError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {searchError}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-2">
          {results.length === 0 && !searching ? (
            <div className="card">
              <div className="empty-state py-12">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Search for Participants</h3>
                <p className="empty-state-text">
                  Enter a company name and select job titles to find potential research participants.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-medium text-gray-900">{results.length} people found</span>
                  {selectedCount > 0 && (
                    <span className="text-gray-500 ml-2">({selectedCount} selected)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="btn btn-ghost btn-sm"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="btn btn-ghost btn-sm"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || selectedCount === 0}
                    className="btn btn-primary btn-sm"
                  >
                    {importing ? 'Importing...' : `Import ${selectedCount} People`}
                  </button>
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="font-medium text-green-700">
                    Imported {importResult.imported} participants
                  </span>
                  {importResult.skipped > 0 && (
                    <span className="text-green-600 ml-2">
                      ({importResult.skipped} already in campaign)
                    </span>
                  )}
                </div>
              )}

              {/* Results Table */}
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th className="w-10">
                          <input
                            type="checkbox"
                            className="table-checkbox"
                            checked={selectedCount === results.length}
                            onChange={() =>
                              selectedCount === results.length ? deselectAll() : selectAll()
                            }
                          />
                        </th>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Company</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((person, index) => (
                        <tr
                          key={index}
                          className={person.isDuplicate ? 'opacity-50' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="table-checkbox"
                              checked={person.selected || false}
                              onChange={() => togglePersonSelection(index)}
                              disabled={person.isDuplicate}
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{person.name}</span>
                              {person.isDuplicate && (
                                <span className="badge badge-warning">Already added</span>
                              )}
                            </div>
                          </td>
                          <td className="text-gray-600 text-sm">{person.title || '-'}</td>
                          <td className="text-gray-600 text-sm">{person.company || '-'}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              {person.email && (
                                <a
                                  href={`mailto:${person.email}`}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                  title={person.email}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                  </svg>
                                </a>
                              )}
                              {person.linkedin_url && (
                                <a
                                  href={person.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                  </svg>
                                </a>
                              )}
                              {person.phone && (
                                <span className="text-xs text-gray-400" title={person.phone}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                </span>
                              )}
                              {!person.email && !person.linkedin_url && !person.phone && (
                                <span className="text-xs text-gray-400">No contact info</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
