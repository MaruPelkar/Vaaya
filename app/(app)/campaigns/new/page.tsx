'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { createBrowserClient } from '@/lib/db';
import type { Client } from '@/lib/types/research';

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function NewCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer');

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: preselectedCustomerId || '',
    name: '',
    description: '',
    research_goals: [''],
    budget_estimated: '',
    start_date: getTodayDate(),
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();

      const payload = {
        client_id: formData.client_id,
        name: formData.name,
        description: formData.description || null,
        research_goals: formData.research_goals.filter((g) => g.trim()),
        budget_estimated: formData.budget_estimated ? parseFloat(formData.budget_estimated) : 0,
        start_date: formData.start_date || null,
        status: 'draft',
      };

      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/campaigns/${data.id}`);
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleGoalChange(index: number, value: string) {
    const newGoals = [...formData.research_goals];
    newGoals[index] = value;
    setFormData((prev) => ({ ...prev, research_goals: newGoals }));
  }

  function addGoal() {
    setFormData((prev) => ({ ...prev, research_goals: [...prev.research_goals, ''] }));
  }

  function removeGoal(index: number) {
    if (formData.research_goals.length > 1) {
      const newGoals = formData.research_goals.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, research_goals: newGoals }));
    }
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Campaigns', href: '/campaigns' },
        { label: 'New Campaign' },
      ]}
    >
      <div className="max-w-2xl">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Create New Campaign</h1>
            <p className="page-description">Set up a new research campaign for a customer</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="card">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Customer */}
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className="select w-full"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <p className="form-hint">
                  Don&apos;t see your customer?{' '}
                  <a href="/customers/new" className="text-primary">Add a new customer</a>
                </p>
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., User Onboarding Research Q1 2024"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input textarea"
                  placeholder="Brief description of the research objectives..."
                  rows={3}
                />
              </div>

              <hr className="border-gray-200 my-4" />

              {/* Research Goals */}
              <div className="form-group">
                <label className="form-label">Research Goals</label>
                <p className="form-hint mb-2">What are you trying to learn from this research?</p>
                <div className="space-y-2">
                  {formData.research_goals.map((goal, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => handleGoalChange(index, e.target.value)}
                        className="input flex-1"
                        placeholder={`Goal ${index + 1}`}
                      />
                      {formData.research_goals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGoal(index)}
                          className="btn btn-ghost btn-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addGoal}
                    className="btn btn-ghost btn-sm"
                  >
                    + Add Goal
                  </button>
                </div>
              </div>

              <hr className="border-gray-200 my-4" />

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">Estimated Budget (USD)</label>
                <input
                  type="number"
                  name="budget_estimated"
                  value={formData.budget_estimated}
                  onChange={handleChange}
                  className="input w-48"
                  placeholder="0"
                  min="0"
                  step="100"
                />
                <p className="form-hint">Include costs for incentives, tools, and outreach</p>
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input w-48"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.client_id || !formData.name}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'New Campaign' }]}>
        <div className="max-w-2xl animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64 mb-6" />
          <div className="skeleton h-96 w-full" />
        </div>
      </AppLayout>
    }>
      <NewCampaignForm />
    </Suspense>
  );
}
