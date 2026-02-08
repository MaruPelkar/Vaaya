'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Campaign, CampaignStatus } from '@/lib/types/research';

const statusColors: Record<CampaignStatus, string> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
  archived: 'neutral',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<(Campaign & { client: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Campaigns' }]}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-description">Manage your research campaigns</p>
        </div>
        <Link href="/campaigns/new" className="btn btn-primary">
          New Campaign
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Total</div>
          <div className="metric-value">{stats.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active</div>
          <div className="metric-value text-green-600">{stats.active}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Draft</div>
          <div className="metric-value text-gray-500">{stats.draft}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completed</div>
          <div className="metric-value text-blue-600">{stats.completed}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group flex-1">
          <input
            type="text"
            placeholder="Search campaigns..."
            className="input input-sm w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="table-container">
          <div className="p-8">
            <div className="skeleton h-8 w-full mb-4" />
            <div className="skeleton h-8 w-full mb-4" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="empty-state-title">No campaigns found</h3>
          <p className="empty-state-text">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first campaign to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link href="/campaigns/new" className="btn btn-primary">
              New Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Dates</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-gray-900 font-medium no-underline hover:underline"
                      >
                        {campaign.name}
                      </Link>
                      {campaign.description && (
                        <p className="text-xs text-gray-500 m-0 mt-0.5 truncate max-w-xs">
                          {campaign.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/clients/${campaign.client_id}`}
                        className="text-gray-600 no-underline hover:underline"
                      >
                        {campaign.client?.name || 'Unknown'}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge badge-${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="font-mono text-sm">
                      {campaign.budget_estimated > 0 ? (
                        <span>
                          ${campaign.budget_spent.toFixed(0)} / ${campaign.budget_estimated.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">
                      {campaign.start_date ? (
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {campaign.end_date && (
                            <> - {new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
