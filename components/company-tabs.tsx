'use client';

import { useState } from 'react';
import { CompanyResponse, TabId } from '@/lib/types';
import { DashboardTab } from './tabs/dashboard-tab';
import { ProductTab } from './tabs/product-tab';
import { BusinessTab } from './tabs/business-tab';
import { RefreshButton } from './refresh-button';

interface CompanyTabsProps {
  data: CompanyResponse;
  tabsLoading: Record<TabId, boolean>;
  onRefresh: (tab: TabId) => void;
}

const TAB_CONFIG = [
  { id: 'dashboard' as const, label: 'Dashboard' },
  { id: 'product' as const, label: 'Product' },
  { id: 'business' as const, label: 'Business' },
  { id: 'person' as const, label: 'Person' },
];

export function CompanyTabs({ data, tabsLoading, onRefresh }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const getTabData = () => {
    switch (activeTab) {
      case 'dashboard':
        return data.dashboard;
      case 'product':
        return data.product;
      case 'business':
        return data.business;
      case 'person':
        return data.person;
    }
  };

  const tabData = getTabData();

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex mb-8" style={{ borderBottom: '1px solid var(--vaaya-border)' }}>
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-6 py-3 -mb-px transition-colors"
            style={{
              borderBottom: activeTab === tab.id ? '2px solid var(--vaaya-brand)' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                const label = e.currentTarget.querySelector('.tab-label') as HTMLElement;
                if (label) label.style.color = 'var(--vaaya-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                const label = e.currentTarget.querySelector('.tab-label') as HTMLElement;
                if (label) label.style.color = 'var(--vaaya-text-muted)';
              }
            }}
          >
            <div
              className="tab-label text-base font-semibold transition-colors"
              style={{
                color: activeTab === tab.id ? 'var(--vaaya-brand)' : 'var(--vaaya-text-muted)',
              }}
            >
              {tab.label}
              {tabsLoading[tab.id] && (
                <span
                  className="ml-2 inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--vaaya-brand)', borderTopColor: 'transparent' }}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="bento-box rounded-xl shadow-md"
        style={{
          backgroundColor: 'var(--vaaya-white)',
          border: '1px solid var(--vaaya-border)',
        }}
      >
        {/* Refresh Header */}
        <div
          className="flex items-center justify-between px-8 py-4"
          style={{ borderBottom: '1px solid var(--vaaya-border)' }}
        >
          <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
            {tabData.updated_at ? (
              <>Last updated: {new Date(tabData.updated_at).toLocaleString()}</>
            ) : tabsLoading[activeTab] ? (
              <>Loading...</>
            ) : (
              <>Not yet loaded</>
            )}
          </div>
          <RefreshButton
            loading={tabsLoading[activeTab]}
            onClick={() => onRefresh(activeTab)}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {tabsLoading[activeTab] && !tabData.updated_at ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: 'var(--vaaya-brand)', borderTopColor: 'transparent' }}
                />
                <p style={{ color: 'var(--vaaya-text-muted)' }}>Fetching data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab data={data.dashboard.data} />}
              {activeTab === 'product' && <ProductTab data={data.product.data} />}
              {activeTab === 'business' && <BusinessTab data={data.business.data} />}
              {activeTab === 'person' && <PersonTabPlaceholder />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder for Person tab (not yet implemented)
function PersonTabPlaceholder() {
  return (
    <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
      <div className="text-4xl mb-4">👤</div>
      <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--vaaya-text)' }}>Person Tab Coming Soon</h3>
      <p>Discovered users and buyers will appear here.</p>
    </div>
  );
}
