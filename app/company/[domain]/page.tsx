'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyTabs } from '@/components/company-tabs';
import {
  CompanyResponse,
  StreamEvent,
  TabId,
  SummaryData,
  ProductData,
  BusinessData,
  PeopleData,
  getEmptySummaryData,
  getEmptyProductData,
  getEmptyBusinessData,
  getEmptyPeopleData,
} from '@/lib/types';

export default function CompanyPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState<Record<TabId, boolean>>({
    summary: false,
    product: false,
    business: false,
    people: false,
  });

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
          summary: { data: getEmptySummaryData(), updated_at: null, sources: [], loading: true },
          product: { data: getEmptyProductData(), updated_at: null, sources: [], loading: true },
          business: { data: getEmptyBusinessData(), updated_at: null, sources: [], loading: true },
          people: { data: getEmptyPeopleData(), updated_at: null, sources: [], loading: true },
        });
        setLoading(false);
        setTabsLoading({ summary: true, product: true, business: true, people: true });

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
                  const tabKey = event.tab as TabId;
                  setData(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      [tabKey]: {
                        data: event.data as SummaryData | ProductData | BusinessData | PeopleData,
                        updated_at: new Date().toISOString(),
                        sources: event.sources,
                        loading: false,
                      },
                    };
                  });
                  setTabsLoading(prev => ({ ...prev, [tabKey]: false }));
                } else if (event.type === 'tab_error') {
                  const tabKey = event.tab as TabId;
                  setTabsLoading(prev => ({ ...prev, [tabKey]: false }));
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

  const handleRefresh = async (tab: TabId) => {
    setTabsLoading(prev => ({ ...prev, [tab]: true }));

    try {
      const response = await fetch(`/api/company/${domain}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab }),
      });

      const result = await response.json();

      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [tab]: {
            data: result.data,
            updated_at: result.updated_at,
            sources: result.sources,
          },
        };
      });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTabsLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--vaaya-white)' }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--vaaya-brand)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--vaaya-text-muted)' }}>Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--vaaya-white)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>Company not found</p>
          <button
            onClick={() => router.push('/')}
            className="hover:underline"
            style={{ color: 'var(--vaaya-brand)' }}
          >
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--vaaya-white)' }}>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="text-sm mb-8 flex items-center gap-1 transition-colors"
          style={{ color: 'var(--vaaya-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--vaaya-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--vaaya-text-muted)'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        {/* Company Header */}
        <div className="flex items-center gap-6 mb-12">
          {data.company.logo_url && (
            <img
              src={data.company.logo_url}
              alt={data.company.name}
              className="w-20 h-20 rounded-lg"
              style={{ backgroundColor: 'var(--vaaya-white)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight leading-tight" style={{ color: 'var(--vaaya-text)' }}>
              {data.company.name}
            </h1>
            <p className="text-lg font-mono" style={{ color: 'var(--vaaya-text-muted)' }}>{data.company.domain}</p>
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
