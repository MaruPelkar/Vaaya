'use client';

import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';

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
        {[
          { label: 'Active Campaigns', value: '0' },
          { label: 'Total Participants', value: '0' },
          { label: 'Completed Sessions', value: '0' },
          { label: 'Pending Outreach', value: '0' },
        ].map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{stat.label}</span>
            </div>
            <div className="metric-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Campaigns - Empty State */}
        <div className="col-span-2">
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Active Campaigns</h3>
              <Link href="/campaigns" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-400)' }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-4">No active campaigns yet</p>
              <Link href="/campaigns/new" className="btn btn-primary btn-sm">
                Create your first campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity - Empty State */}
        <div className="col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="py-8 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-400)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 m-0">No recent activity</p>
              <p className="text-xs text-gray-400 m-0 mt-1">Activity will appear here as you work</p>
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
            <Link href="/customers/new" className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Add Customer
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
