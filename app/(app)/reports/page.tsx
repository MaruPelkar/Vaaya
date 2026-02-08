'use client';

import { AppLayout } from '@/components/layout/app-layout';

export default function ReportsPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Reports' }]}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">View and generate research reports</p>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <h3 className="empty-state-title">Reports Coming Soon</h3>
        <p className="empty-state-text">
          Generate AI-powered reports from your research data. This feature will be available in Phase 6.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Executive summaries, thematic analysis, highlight reels, and more.
        </p>
      </div>
    </AppLayout>
  );
}
