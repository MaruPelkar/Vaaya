'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { createBrowserClient } from '@/lib/db';

const seniorityOptions = ['IC', 'Lead', 'Manager', 'Director', 'VP', 'C-Suite', 'Founder'];
const departmentOptions = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Customer Success', 'Operations', 'HR', 'Finance', 'Other'];

export default function NewParticipantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    job_title: '',
    seniority_level: '',
    department: '',
    company_name: '',
    company_size: '',
    company_industry: '',
    city: '',
    country: '',
    notes: '',
    tags: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        source: 'manual',
      };

      const { data, error: insertError } = await supabase
        .from('participants')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/participants/${data.id}`);
    } catch (err) {
      console.error('Error creating participant:', err);
      setError(err instanceof Error ? err.message : 'Failed to create participant');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-fill first/last name from full name
    if (name === 'full_name') {
      const parts = value.trim().split(' ');
      if (parts.length >= 2) {
        setFormData((prev) => ({
          ...prev,
          full_name: value,
          first_name: parts[0],
          last_name: parts.slice(1).join(' '),
        }));
      }
    }
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Participants', href: '/participants' },
        { label: 'New Participant' },
      ]}
    >
      <div className="max-w-2xl">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Add New Participant</h1>
            <p className="page-description">Manually add a participant to your global pool</p>
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
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Information</h3>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>

              <hr className="border-gray-200 my-4" />

              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Professional Details</h3>

              {/* Job Title */}
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="input"
                  placeholder="Senior Product Manager"
                />
              </div>

              {/* Seniority & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Seniority Level</label>
                  <select
                    name="seniority_level"
                    value={formData.seniority_level}
                    onChange={handleChange}
                    className="select w-full"
                  >
                    <option value="">Select...</option>
                    {seniorityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="select w-full"
                  >
                    <option value="">Select...</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Industry</label>
                  <input
                    type="text"
                    name="company_industry"
                    value={formData.company_industry}
                    onChange={handleChange}
                    className="input"
                    placeholder="Technology"
                  />
                </div>
              </div>

              <hr className="border-gray-200 my-4" />

              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Location</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="San Francisco"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input"
                    placeholder="United States"
                  />
                </div>
              </div>

              <hr className="border-gray-200 my-4" />

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="input"
                  placeholder="startup, saas, early-adopter (comma separated)"
                />
                <p className="form-hint">Comma-separated tags for easier filtering</p>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input textarea"
                  placeholder="Any additional notes about this participant..."
                  rows={3}
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
              disabled={loading || !formData.full_name}
            >
              {loading ? 'Creating...' : 'Create Participant'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
