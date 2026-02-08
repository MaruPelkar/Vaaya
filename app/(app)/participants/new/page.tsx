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
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState('');
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

  async function handleProfileUrlChange(url: string) {
    setProfileUrl(url);
    setEnrichMessage(null);

    // Auto-enrich when a valid URL is pasted
    if (url && (url.includes('linkedin.com') || url.includes('twitter.com') || url.includes('x.com'))) {
      await enrichFromUrl(url);
    }
  }

  async function enrichFromUrl(url: string) {
    setEnriching(true);
    setEnrichMessage(null);

    try {
      const response = await fetch('/api/participants/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEnrichMessage(data.error || 'Failed to fetch profile data');
        return;
      }

      if (data.success && data.data) {
        // Merge the enriched data with existing form data (don't overwrite non-empty fields)
        setFormData((prev) => ({
          ...prev,
          full_name: data.data.full_name || prev.full_name,
          first_name: data.data.first_name || prev.first_name,
          last_name: data.data.last_name || prev.last_name,
          job_title: data.data.job_title || prev.job_title,
          company_name: data.data.company_name || prev.company_name,
          company_industry: data.data.company_industry || prev.company_industry,
          city: data.data.city || prev.city,
          country: data.data.country || prev.country,
          seniority_level: data.data.seniority_level || prev.seniority_level,
          department: data.data.department || prev.department,
          linkedin_url: data.data.linkedin_url || prev.linkedin_url,
        }));

        if (data.message) {
          setEnrichMessage(data.message);
        } else {
          setEnrichMessage('Profile data loaded successfully!');
        }
      }
    } catch (err) {
      console.error('Error enriching profile:', err);
      setEnrichMessage('Failed to fetch profile data. Please fill in manually.');
    } finally {
      setEnriching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        source: profileUrl ? 'profile_import' : 'manual',
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
            <p className="page-description">Add a participant manually or import from a profile URL</p>
          </div>
        </div>

        {/* Profile URL Import */}
        <div className="card mb-4" style={{ backgroundColor: 'var(--gray-50)', border: '2px dashed var(--gray-200)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex-1">
              <label className="form-label font-semibold" style={{ color: 'var(--gray-900)' }}>
                Quick Import from Profile URL
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Paste a LinkedIn or Twitter profile URL to auto-fill the form
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => handleProfileUrlChange(e.target.value)}
                  className="input flex-1"
                  placeholder="https://linkedin.com/in/johndoe or https://twitter.com/johndoe"
                  disabled={enriching}
                />
                {enriching && (
                  <div className="flex items-center px-3">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
              {enrichMessage && (
                <p className={`text-sm mt-2 ${enrichMessage.includes('success') ? 'text-green-600' : 'text-amber-600'}`}>
                  {enrichMessage}
                </p>
              )}
            </div>
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
