'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Campaign, TargetCriteria, SeniorityLevel, Department } from '@/lib/types/research';

const seniorityOptions: SeniorityLevel[] = ['IC', 'Lead', 'Manager', 'Director', 'VP', 'C-Suite', 'Founder'];
const departmentOptions: Department[] = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Customer Success', 'Operations', 'HR', 'Finance', 'Other'];
const companySizeOptions = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const defaultCriteria: TargetCriteria = {
  job_titles: [],
  seniority_levels: [],
  departments: [],
  company_sizes: [],
  industries: [],
  locations: [],
  products_used: [],
  custom_criteria: [],
};

export default function CriteriaPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState<TargetCriteria>(defaultCriteria);

  // Input states for adding items
  const [newTitle, setNewTitle] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newProduct, setNewProduct] = useState('');

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(name)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCampaign(data);
      if (data.target_criteria) {
        setCriteria({ ...defaultCriteria, ...data.target_criteria });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('campaigns')
        .update({ target_criteria: criteria })
        .eq('id', params.id);

      if (error) throw error;
      router.push(`/campaigns/${params.id}`);
    } catch (error) {
      console.error('Error saving criteria:', error);
    } finally {
      setSaving(false);
    }
  }

  function toggleArrayItem<T>(array: T[], item: T, setter: (value: T[]) => void) {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  }

  function addToArray(value: string, array: string[], setter: (value: string[]) => void, clearInput: () => void) {
    const trimmed = value.trim();
    if (trimmed && !array.includes(trimmed)) {
      setter([...array, trimmed]);
      clearInput();
    }
  }

  function removeFromArray<T>(array: T[], item: T, setter: (value: T[]) => void) {
    setter(array.filter((i) => i !== item));
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Not Found' }]}>
        <div className="empty-state">
          <h3 className="empty-state-title">Campaign not found</h3>
          <Link href="/campaigns" className="btn btn-primary mt-4">
            Back to Campaigns
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign.name, href: `/campaigns/${campaign.id}` },
        { label: 'Target Criteria' },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Target Criteria</h1>
          <p className="page-description">
            Define who you&apos;re looking for in this research campaign
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Criteria'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Job Titles */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Job Titles</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {criteria.job_titles.map((title) => (
              <span key={title} className="badge badge-success">
                {title}
                <button
                  type="button"
                  onClick={() => removeFromArray(criteria.job_titles, title, (v) => setCriteria({ ...criteria, job_titles: v }))}
                  className="ml-1 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g., Product Manager, Engineering Lead"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToArray(newTitle, criteria.job_titles, (v) => setCriteria({ ...criteria, job_titles: v }), () => setNewTitle(''))}
            />
            <button
              type="button"
              onClick={() => addToArray(newTitle, criteria.job_titles, (v) => setCriteria({ ...criteria, job_titles: v }), () => setNewTitle(''))}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
          <p className="form-hint mt-2">These will be used when searching for participants</p>
        </div>

        {/* Seniority Levels */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Seniority Levels</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {seniorityOptions.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => toggleArrayItem(criteria.seniority_levels, level, (v) => setCriteria({ ...criteria, seniority_levels: v }))}
                className={`badge cursor-pointer ${criteria.seniority_levels.includes(level) ? 'badge-success' : 'badge-neutral hover:bg-gray-200'}`}
              >
                {criteria.seniority_levels.includes(level) ? '✓ ' : '+ '}{level}
              </button>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Departments</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {departmentOptions.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => toggleArrayItem(criteria.departments, dept, (v) => setCriteria({ ...criteria, departments: v }))}
                className={`badge cursor-pointer ${criteria.departments.includes(dept) ? 'badge-success' : 'badge-neutral hover:bg-gray-200'}`}
              >
                {criteria.departments.includes(dept) ? '✓ ' : '+ '}{dept}
              </button>
            ))}
          </div>
        </div>

        {/* Company Size */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Company Size</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {companySizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleArrayItem(criteria.company_sizes, size, (v) => setCriteria({ ...criteria, company_sizes: v }))}
                className={`badge cursor-pointer ${criteria.company_sizes.includes(size) ? 'badge-success' : 'badge-neutral hover:bg-gray-200'}`}
              >
                {criteria.company_sizes.includes(size) ? '✓ ' : '+ '}{size} employees
              </button>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Industries</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {criteria.industries.map((industry) => (
              <span key={industry} className="badge badge-success">
                {industry}
                <button
                  type="button"
                  onClick={() => removeFromArray(criteria.industries, industry, (v) => setCriteria({ ...criteria, industries: v }))}
                  className="ml-1 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g., SaaS, Fintech, Healthcare"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToArray(newIndustry, criteria.industries, (v) => setCriteria({ ...criteria, industries: v }), () => setNewIndustry(''))}
            />
            <button
              type="button"
              onClick={() => addToArray(newIndustry, criteria.industries, (v) => setCriteria({ ...criteria, industries: v }), () => setNewIndustry(''))}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Locations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Locations</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {criteria.locations.map((location) => (
              <span key={location} className="badge badge-success">
                {location}
                <button
                  type="button"
                  onClick={() => removeFromArray(criteria.locations, location, (v) => setCriteria({ ...criteria, locations: v }))}
                  className="ml-1 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g., San Francisco, New York, Remote"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToArray(newLocation, criteria.locations, (v) => setCriteria({ ...criteria, locations: v }), () => setNewLocation(''))}
            />
            <button
              type="button"
              onClick={() => addToArray(newLocation, criteria.locations, (v) => setCriteria({ ...criteria, locations: v }), () => setNewLocation(''))}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Products Used (Competitors/Complements) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Products Used</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Target users of specific products (competitors, complements, or category tools)
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {criteria.products_used.map((product) => (
              <span key={product} className="badge badge-success">
                {product}
                <button
                  type="button"
                  onClick={() => removeFromArray(criteria.products_used, product, (v) => setCriteria({ ...criteria, products_used: v }))}
                  className="ml-1 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g., Notion, Slack, Figma"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToArray(newProduct, criteria.products_used, (v) => setCriteria({ ...criteria, products_used: v }), () => setNewProduct(''))}
            />
            <button
              type="button"
              onClick={() => addToArray(newProduct, criteria.products_used, (v) => setCriteria({ ...criteria, products_used: v }), () => setNewProduct(''))}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
