'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { createBrowserClient } from '@/lib/db';

export default function SettingsPage() {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };
  return (
    <AppLayout breadcrumbs={[{ label: 'Settings' }]}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Configure integrations and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Integrations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Integrations</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">N</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm m-0">Nyne API</p>
                  <p className="text-xs text-gray-500 m-0">People discovery</p>
                </div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">B</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm m-0">Bland AI</p>
                  <p className="text-xs text-gray-500 m-0">Voice outreach</p>
                </div>
              </div>
              <span className="badge badge-neutral">Not configured</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">T</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm m-0">Tremendous</p>
                  <p className="text-xs text-gray-500 m-0">Gift card incentives</p>
                </div>
              </div>
              <span className="badge badge-neutral">Not configured</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">R</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm m-0">Resend</p>
                  <p className="text-xs text-gray-500 m-0">Email outreach</p>
                </div>
              </div>
              <span className="badge badge-neutral">Not configured</span>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">API Keys</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Configure your API keys in the environment variables. These are read from your <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.env</code> file.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <code className="text-gray-600">OPENAI_API_KEY</code>
              <span className="badge badge-success">Set</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <code className="text-gray-600">NYNE_API_KEY</code>
              <span className="badge badge-success">Set</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <code className="text-gray-600">BLAND_API_KEY</code>
              <span className="badge badge-neutral">Not set</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <code className="text-gray-600">TREMENDOUS_API_KEY</code>
              <span className="badge badge-neutral">Not set</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <code className="text-gray-600">RESEND_API_KEY</code>
              <span className="badge badge-neutral">Not set</span>
            </div>
          </div>
        </div>

        {/* Defaults */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Default Incentives</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Default incentive amounts by seniority level (USD, 30-minute session).
          </p>
          <div className="space-y-3">
            {[
              { level: 'IC / Junior', amount: '$25' },
              { level: 'Lead / Senior', amount: '$50' },
              { level: 'Manager', amount: '$75' },
              { level: 'Director', amount: '$100' },
              { level: 'VP', amount: '$150' },
              { level: 'C-Suite / Founder', amount: '$200+' },
            ].map((item) => (
              <div key={item.level} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.level}</span>
                <span className="font-mono text-gray-900">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="label">Organization</span>
              <p className="text-sm text-gray-900 m-0 mt-1">Vaaya Research</p>
            </div>
            <div>
              <span className="label">Team Members</span>
              <p className="text-sm text-gray-600 m-0 mt-1">2 members</p>
            </div>
            <hr className="border-gray-200" />
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="btn btn-secondary w-full"
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
