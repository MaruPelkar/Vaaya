'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Client } from '@/lib/types/research';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={[{ label: 'Clients' }]}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-description">Manage your client companies</p>
        </div>
        <Link href="/clients/new" className="btn btn-primary">
          Add Client
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group flex-1">
          <input
            type="text"
            placeholder="Search clients..."
            className="input input-sm w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">Sort by</span>
          <select className="select">
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="campaigns">Campaigns</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-12 w-12 rounded-full mb-3" />
              <div className="skeleton h-5 w-32 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 className="empty-state-title">No clients yet</h3>
          <p className="empty-state-text">
            Add your first client to start managing research campaigns.
          </p>
          <Link href="/clients/new" className="btn btn-primary">
            Add Client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card card-hover no-underline group"
            >
              <div className="flex items-start gap-4">
                <div className="avatar avatar-xl bg-gray-100">
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} />
                  ) : (
                    <span className="text-gray-400">{client.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 m-0 group-hover:underline">
                    {client.name}
                  </h3>
                  {client.industry && (
                    <p className="text-sm text-gray-500 m-0 mt-1">{client.industry}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-400">
                      <span className="font-mono font-medium text-gray-600">{client.campaigns_count || 0}</span> campaigns
                    </span>
                    {client.website && (
                      <span className="text-xs text-gray-400 truncate">
                        {client.website.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
