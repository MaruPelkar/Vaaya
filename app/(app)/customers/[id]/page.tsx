'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Client, Campaign } from '@/lib/types/research';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  async function fetchCustomer() {
    try {
      const supabase = createBrowserClient();

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);
      setFormData(customerData);

      // Fetch campaigns for this customer
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', params.id);

      if (error) throw error;

      setCustomer({ ...customer, ...formData } as Client);
      setEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated campaigns.')) {
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      router.push('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: 'Not Found' }]}>
        <div className="empty-state">
          <h3 className="empty-state-title">Customer not found</h3>
          <Link href="/customers" className="btn btn-primary mt-4">
            Back to Customers
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Customers', href: '/customers' },
        { label: customer.name },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-xl bg-gray-100">
            {customer.logo_url ? (
              <img src={customer.logo_url} alt={customer.name} />
            ) : (
              <span className="text-gray-400 text-2xl">{customer.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-description">
              {customer.industry && <span>{customer.industry}</span>}
              {customer.website && (
                <a
                  href={customer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-primary hover:underline"
                >
                  {customer.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <Link href={`/campaigns/new?customer=${customer.id}`} className="btn btn-primary">
            New Campaign
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2">
          {/* Campaigns */}
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Campaigns</h3>
              <span className="text-xs text-gray-500">{campaigns.length} total</span>
            </div>
            {campaigns.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-text">No campaigns yet</p>
                <Link href={`/campaigns/new?customer=${customer.id}`} className="btn btn-outline btn-sm">
                  Create First Campaign
                </Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
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
                          <span className={`badge badge-${
                            campaign.status === 'active' ? 'success' :
                            campaign.status === 'completed' ? 'info' :
                            campaign.status === 'paused' ? 'warning' : 'neutral'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="text-gray-500 text-sm">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Details</h3>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.contact_name || ''}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="input textarea"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn btn-primary flex-1">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.contact_name && (
                  <div>
                    <span className="label">Contact</span>
                    <p className="text-sm text-gray-900 m-0 mt-1">{customer.contact_name}</p>
                    {customer.contact_email && (
                      <a href={`mailto:${customer.contact_email}`} className="text-sm text-primary">
                        {customer.contact_email}
                      </a>
                    )}
                  </div>
                )}
                {customer.notes && (
                  <div>
                    <span className="label">Notes</span>
                    <p className="text-sm text-gray-600 m-0 mt-1 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
                <div>
                  <span className="label">Created</span>
                  <p className="text-sm text-gray-600 m-0 mt-1">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="card mt-4 border-red-200">
            <div className="card-header">
              <h3 className="card-title text-red-600">Danger Zone</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Deleting this customer will also delete all associated campaigns and data.
            </p>
            <button onClick={handleDelete} className="btn btn-danger w-full">
              Delete Customer
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
