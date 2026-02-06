'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyTabs } from '@/components/company-tabs';
import { UserMenu } from '@/components/user-menu';
import {
  CompanyResponse,
  StreamEvent,
  TabId,
  DashboardData,
  ProductData,
  BusinessData,
  PersonData,
  getEmptyDashboardData,
  getEmptyProductData,
  getEmptyBusinessData,
  getEmptyPersonData,
} from '@/lib/types';

export default function CompanyPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState<Record<TabId, boolean>>({
    dashboard: false,
    product: false,
    business: false,
    person: false,
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
          dashboard: { data: getEmptyDashboardData(), updated_at: null, sources: [], loading: true },
          product: { data: getEmptyProductData(), updated_at: null, sources: [], loading: true },
          business: { data: getEmptyBusinessData(), updated_at: null, sources: [], loading: true },
          person: { data: getEmptyPersonData(), updated_at: null, sources: [], loading: true },
        });
        setLoading(false);
        setTabsLoading({ dashboard: true, product: true, business: true, person: true });

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
                        data: event.data as DashboardData | ProductData | BusinessData | PersonData,
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--off-white)' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-base" style={{ color: 'var(--gray-500)' }}>Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--off-white)' }}>
        <div className="text-center">
          <p className="mb-4 text-lg" style={{ color: 'var(--gray-500)' }}>Company not found</p>
          <button
            onClick={() => router.push('/')}
            className="btn btn-outline"
          >
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--off-white)' }}>
      {/* Header Bar */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(248, 250, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        <div className="container-wide py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{ color: 'var(--gray-600)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
              e.currentTarget.style.color = 'var(--gray-900)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--gray-600)';
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          {/* Company Name in Header */}
          <div className="flex items-center gap-3">
            {data.company.logo_url && (
              <img
                src={data.company.logo_url}
                alt={data.company.name}
                className="w-8 h-8 rounded-md"
                style={{ backgroundColor: 'var(--gray-100)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="font-semibold" style={{ color: 'var(--gray-900)' }}>
              {data.company.name}
            </span>
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      <div className="container-wide py-8">
        {/* Company Header */}
        <div
          className="mb-8 p-8 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex items-center gap-6">
            {data.company.logo_url && (
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <img
                  src={data.company.logo_url}
                  alt={data.company.name}
                  className="w-16 h-16 rounded-lg object-contain"
                  style={{ backgroundColor: 'var(--white)' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <h1
                className="font-display text-4xl font-medium tracking-tight leading-tight"
                style={{ color: 'var(--white)' }}
              >
                {data.company.name}
              </h1>
              <p
                className="text-lg font-mono mt-1"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {data.company.domain}
              </p>
            </div>
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
