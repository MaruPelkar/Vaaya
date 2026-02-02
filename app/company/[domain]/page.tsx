'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyTabs } from '@/components/company-tabs';
import { CompanyResponse, StreamEvent, Tab1Data, Tab2Data, Tab3Data } from '@/lib/types';

const emptyTab1Data: Tab1Data = {
  description: '',
  founded: null,
  headquarters: null,
  employee_range: null,
  industry: null,
  funding: { total: null, last_round: null, last_round_date: null, investors: [] },
  leadership: [],
  socials: { twitter: null, linkedin: null, github: null },
  website: '',
};

const emptyTab2Data: Tab2Data = {
  summary: '',
  sentiment_score: 0.5,
  loved_features: [],
  common_complaints: [],
  recent_releases: [],
  press_mentions: [],
  raw_mentions: [],
};

const emptyTab3Data: Tab3Data = {
  users: [],
  companies_using: [],
  total_signals_found: 0,
};

export default function CompanyPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState({ 1: false, 2: false, 3: false });

  useEffect(() => {
    fetchCompanyData();
  }, [domain]);

  const fetchCompanyData = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/company/${domain}`);
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Streaming response - new company
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        // Initialize with loading states
        setData({
          company: { domain: domain, name: domain, logo_url: `https://logo.clearbit.com/${domain}` },
          tab1: { data: emptyTab1Data, updated_at: null, sources: [], loading: true },
          tab2: { data: emptyTab2Data, updated_at: null, sources: [], loading: true },
          tab3: { data: emptyTab3Data, updated_at: null, sources: [], loading: true },
        });
        setLoading(false);
        setTabsLoading({ 1: true, 2: true, 3: true });

        let buffer = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));

                if (event.type === 'company_info') {
                  setData(prev => prev ? {
                    ...prev,
                    company: {
                      ...prev.company,
                      name: event.name,
                      logo_url: event.logo_url,
                    },
                  } : null);
                } else if (event.type === 'tab_complete') {
                  const tabKey = `tab${event.tab}` as 'tab1' | 'tab2' | 'tab3';
                  setData(prev => prev ? {
                    ...prev,
                    [tabKey]: {
                      data: event.data,
                      updated_at: new Date().toISOString(),
                      sources: event.sources,
                      loading: false,
                    },
                  } : null);
                  setTabsLoading(prev => ({ ...prev, [event.tab]: false }));
                } else if (event.type === 'tab_error') {
                  setTabsLoading(prev => ({ ...prev, [event.tab]: false }));
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      } else {
        // JSON response - cached data
        const json = await response.json();
        setData(json);
        setLoading(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async (tab: 1 | 2 | 3) => {
    setTabsLoading(prev => ({ ...prev, [tab]: true }));

    try {
      const response = await fetch(`/api/company/${domain}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab }),
      });

      const result = await response.json();
      const tabKey = `tab${tab}` as 'tab1' | 'tab2' | 'tab3';

      setData(prev => prev ? {
        ...prev,
        [tabKey]: {
          data: result.data,
          updated_at: result.updated_at,
          sources: result.sources,
        },
      } : null);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTabsLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Company not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-500 hover:underline"
          >
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        {/* Company Header */}
        <div className="flex items-center gap-4 mb-8">
          {data.company.logo_url && (
            <img
              src={data.company.logo_url}
              alt={data.company.name}
              className="w-16 h-16 rounded-lg bg-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.company.name}</h1>
            <p className="text-gray-500">{data.company.domain}</p>
          </div>
        </div>

        {/* Tabs */}
        <CompanyTabs
          data={data}
          tabsLoading={tabsLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </main>
  );
}
