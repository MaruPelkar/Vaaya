'use client';

import { AppLayout } from '@/components/layout/app-layout';

export default function TemplatesPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Templates' }]}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-description">Manage email, call script, and report templates</p>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h3 className="empty-state-title">Templates Coming Soon</h3>
        <p className="empty-state-text">
          Create and manage reusable templates for outreach and reports. This feature will be available in Phase 3.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Email templates, call scripts, and AI personalization settings.
        </p>
      </div>
    </AppLayout>
  );
}
