'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Client } from '@/lib/types/research';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={[{ label: 'Customers' }]}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-description">Manage your customer companies</p>
        </div>
        <Link href="/customers/new" className="btn btn-primary">
          Add Customer
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group flex-1">
          <input
            type="text"
            placeholder="Search customers..."
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

      {/* Customers Grid */}
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
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 className="empty-state-title">No customers yet</h3>
          <p className="empty-state-text">
            Add your first customer to start managing research campaigns.
          </p>
          <Link href="/customers/new" className="btn btn-primary">
            Add Customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="card card-hover no-underline group"
            >
              <div className="flex items-start gap-4">
                <div className="avatar avatar-xl bg-gray-100">
                  {customer.logo_url ? (
                    <img src={customer.logo_url} alt={customer.name} />
                  ) : (
                    <span className="text-gray-400">{customer.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 m-0 group-hover:underline">
                    {customer.name}
                  </h3>
                  {customer.industry && (
                    <p className="text-sm text-gray-500 m-0 mt-1">{customer.industry}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-400">
                      <span className="font-mono font-medium text-gray-600">{customer.campaigns_count || 0}</span> campaigns
                    </span>
                    {customer.website && (
                      <span className="text-xs text-gray-400 truncate">
                        {customer.website.replace(/^https?:\/\//, '')}
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
