'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Client, Campaign } from '@/lib/types/research';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  async function fetchClient() {
    try {
      const supabase = createBrowserClient();

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
      setFormData(clientData);

      // Fetch campaigns for this client
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching client:', error);
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

      setClient({ ...client, ...formData } as Client);
      setEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated campaigns.')) {
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      router.push('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Not Found' }]}>
        <div className="empty-state">
          <h3 className="empty-state-title">Client not found</h3>
          <Link href="/clients" className="btn btn-primary mt-4">
            Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Clients', href: '/clients' },
        { label: client.name },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-xl bg-gray-100">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} />
            ) : (
              <span className="text-gray-400 text-2xl">{client.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{client.name}</h1>
            <p className="page-description">
              {client.industry && <span>{client.industry}</span>}
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-primary hover:underline"
                >
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <Link href={`/campaigns/new?client=${client.id}`} className="btn btn-primary">
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
                <Link href={`/campaigns/new?client=${client.id}`} className="btn btn-outline btn-sm">
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
                {client.contact_name && (
                  <div>
                    <span className="label">Contact</span>
                    <p className="text-sm text-gray-900 m-0 mt-1">{client.contact_name}</p>
                    {client.contact_email && (
                      <a href={`mailto:${client.contact_email}`} className="text-sm text-primary">
                        {client.contact_email}
                      </a>
                    )}
                  </div>
                )}
                {client.notes && (
                  <div>
                    <span className="label">Notes</span>
                    <p className="text-sm text-gray-600 m-0 mt-1 whitespace-pre-wrap">{client.notes}</p>
                  </div>
                )}
                <div>
                  <span className="label">Created</span>
                  <p className="text-sm text-gray-600 m-0 mt-1">
                    {new Date(client.created_at).toLocaleDateString()}
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
              Deleting this client will also delete all associated campaigns and data.
            </p>
            <button onClick={handleDelete} className="btn btn-danger w-full">
              Delete Client
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
