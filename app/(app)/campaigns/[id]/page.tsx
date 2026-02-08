'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Campaign, CampaignParticipant, CampaignStatus } from '@/lib/types/research';

const statusColors: Record<CampaignStatus, string> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
  archived: 'neutral',
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'reports', label: 'Reports' },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign & { client: { name: string } } | null>(null);
  const [participants, setParticipants] = useState<(CampaignParticipant & { participant: { full_name: string; email: string; company_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    try {
      const supabase = createBrowserClient();

      // Fetch campaign with client
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, client:clients(name)')
        .eq('id', params.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('campaign_participants')
        .select('*, participant:participants(full_name, email, company_name)')
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: CampaignStatus) {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) throw error;
      setCampaign((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-32" />
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

  const participantStats = {
    total: participants.length,
    discovered: participants.filter((p) => p.status === 'discovered').length,
    contacted: participants.filter((p) => ['contacted', 'responded', 'scheduled'].includes(p.status)).length,
    completed: participants.filter((p) => p.status === 'completed').length,
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign.name },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="page-title">{campaign.name}</h1>
            <span className={`badge badge-${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <p className="page-description">
            <Link href={`/customers/${campaign.client_id}`} className="text-gray-500 hover:underline">
              {campaign.client?.name}
            </Link>
            {campaign.description && <span className="mx-2">&middot;</span>}
            {campaign.description && <span>{campaign.description}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <button onClick={() => updateStatus('active')} className="btn btn-primary">
              Start Campaign
            </button>
          )}
          {campaign.status === 'active' && (
            <>
              <button onClick={() => updateStatus('paused')} className="btn btn-secondary">
                Pause
              </button>
              <button onClick={() => updateStatus('completed')} className="btn btn-primary">
                Complete
              </button>
            </>
          )}
          {campaign.status === 'paused' && (
            <button onClick={() => updateStatus('active')} className="btn btn-primary">
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Participants</div>
          <div className="metric-value">{participantStats.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Discovered</div>
          <div className="metric-value">{participantStats.discovered}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Contacted</div>
          <div className="metric-value">{participantStats.contacted}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completed</div>
          <div className="metric-value text-green-600">{participantStats.completed}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Budget</div>
          <div className="metric-value">
            <span className="text-base">${campaign.budget_spent.toFixed(0)}</span>
            <span className="text-sm text-gray-400"> / ${campaign.budget_estimated.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Research Goals */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Research Goals</h3>
              </div>
              {campaign.research_goals && campaign.research_goals.length > 0 ? (
                <ul className="space-y-2">
                  {campaign.research_goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </span>
                      {goal}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No research goals defined</p>
              )}
            </div>

            {/* Target Criteria */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Target Criteria</h3>
                <Link href={`/campaigns/${campaign.id}/criteria`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
              </div>
              {campaign.target_criteria ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {campaign.target_criteria.job_titles?.length > 0 && (
                    <div>
                      <span className="label">Job Titles</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.target_criteria.job_titles.map((title: string, i: number) => (
                          <span key={i} className="badge badge-neutral">{title}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaign.target_criteria.seniority_levels?.length > 0 && (
                    <div>
                      <span className="label">Seniority</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.target_criteria.seniority_levels.map((level: string, i: number) => (
                          <span key={i} className="badge badge-neutral">{level}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No criteria defined yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="label">Customer</span>
                  <p className="m-0 mt-1">
                    <Link href={`/customers/${campaign.client_id}`} className="text-gray-900 hover:underline">
                      {campaign.client?.name}
                    </Link>
                  </p>
                </div>
                {campaign.start_date && (
                  <div>
                    <span className="label">Start Date</span>
                    <p className="m-0 mt-1 text-gray-700">
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="label">Created</span>
                  <p className="m-0 mt-1 text-gray-700">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Link
                  href={`/campaigns/${campaign.id}/discovery`}
                  className="btn btn-outline w-full justify-start"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Find Participants
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/outreach`}
                  className="btn btn-outline w-full justify-start"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Send Outreach
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/reports/new`}
                  className="btn btn-outline w-full justify-start"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Generate Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="filter-bar flex-1 mr-4">
              <input
                type="text"
                placeholder="Search participants..."
                className="input input-sm w-64"
              />
            </div>
            <Link href={`/campaigns/${campaign.id}/discovery`} className="btn btn-primary">
              Find Participants
            </Link>
          </div>

          {participants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="empty-state-title">No participants yet</h3>
              <p className="empty-state-text">Start by finding participants that match your criteria</p>
              <Link href={`/campaigns/${campaign.id}/discovery`} className="btn btn-primary">
                Find Participants
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Fit Score</th>
                      <th>Outreach</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((cp) => (
                      <tr key={cp.id}>
                        <td>
                          <div>
                            <span className="font-medium text-gray-900">
                              {cp.participant?.full_name}
                            </span>
                            {cp.participant?.email && (
                              <p className="text-xs text-gray-500 m-0">{cp.participant.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-600">{cp.participant?.company_name || '-'}</td>
                        <td>
                          <span className={`badge badge-${
                            cp.status === 'completed' ? 'success' :
                            cp.status === 'scheduled' ? 'info' :
                            ['contacted', 'responded'].includes(cp.status) ? 'warning' :
                            'neutral'
                          }`}>
                            {cp.status}
                          </span>
                        </td>
                        <td className="font-mono">
                          {cp.fit_score ? `${cp.fit_score}%` : '-'}
                        </td>
                        <td className="font-mono text-sm">
                          {cp.outreach_attempts} attempts
                        </td>
                        <td className="text-gray-500 text-sm">
                          {new Date(cp.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="empty-state">
          <h3 className="empty-state-title">Outreach Center</h3>
          <p className="empty-state-text">Configure and send outreach to your participants</p>
          <p className="text-xs text-gray-400 mt-2">Coming soon - Phase 3</p>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="empty-state">
          <h3 className="empty-state-title">Sessions</h3>
          <p className="empty-state-text">Manage scheduled and completed research sessions</p>
          <p className="text-xs text-gray-400 mt-2">Coming soon - Phase 5</p>
        </div>
      )}

      {activeTab === 'artifacts' && (
        <div className="empty-state">
          <h3 className="empty-state-title">Artifacts</h3>
          <p className="empty-state-text">Upload and process research data (recordings, transcripts, etc.)</p>
          <p className="text-xs text-gray-400 mt-2">Coming soon - Phase 5</p>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="empty-state">
          <h3 className="empty-state-title">Reports</h3>
          <p className="empty-state-text">Generate insights and reports from your research data</p>
          <p className="text-xs text-gray-400 mt-2">Coming soon - Phase 6</p>
        </div>
      )}
    </AppLayout>
  );
}
