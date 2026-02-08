'use client';

import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';

// Placeholder stats - will be replaced with real data
const stats = [
  { label: 'Active Campaigns', value: '3', change: '+1', positive: true },
  { label: 'Total Participants', value: '156', change: '+24', positive: true },
  { label: 'Completed Sessions', value: '42', change: '+8', positive: true },
  { label: 'Pending Outreach', value: '18', change: '-5', positive: false },
];

const recentCampaigns = [
  { id: '1', name: 'User Onboarding Research', client: 'Acme Corp', status: 'active', participants: 24, completion: 65 },
  { id: '2', name: 'Feature Discovery', client: 'TechStart', status: 'active', participants: 18, completion: 40 },
  { id: '3', name: 'Competitor Analysis', client: 'Acme Corp', status: 'draft', participants: 0, completion: 0 },
];

const recentActivity = [
  { type: 'session', text: 'Completed interview with John D.', time: '2 hours ago', campaign: 'User Onboarding Research' },
  { type: 'outreach', text: 'Email sent to 5 participants', time: '4 hours ago', campaign: 'Feature Discovery' },
  { type: 'discovery', text: 'Found 12 new participants', time: '1 day ago', campaign: 'User Onboarding Research' },
  { type: 'report', text: 'Generated executive summary', time: '2 days ago', campaign: 'User Onboarding Research' },
];

export default function DashboardPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your research operations</p>
        </div>
        <Link href="/campaigns/new" className="btn btn-primary">
          New Campaign
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{stat.label}</span>
              <span className={`metric-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.change}
              </span>
            </div>
            <div className="metric-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Campaigns */}
        <div className="col-span-2">
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Active Campaigns</h3>
              <Link href="/campaigns" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Participants</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <Link href={`/campaigns/${campaign.id}`} className="text-gray-900 font-medium no-underline hover:underline">
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="text-gray-500">{campaign.client}</td>
                      <td>
                        <span className={`badge badge-${campaign.status === 'active' ? 'success' : 'neutral'}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="font-mono">{campaign.participants}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-20">
                            <div
                              className="progress-fill"
                              style={{ width: `${campaign.completion}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-mono">{campaign.completion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 m-0">{activity.text}</p>
                    <p className="text-xs text-gray-400 m-0 mt-0.5">
                      {activity.campaign} &middot; {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="flex gap-3">
            <Link href="/campaigns/new" className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Campaign
            </Link>
            <Link href="/participants/new" className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Add Participant
            </Link>
            <Link href="/clients/new" className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Add Client
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
