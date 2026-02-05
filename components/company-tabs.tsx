'use client';

import { useState } from 'react';
import { CompanyResponse, TabId } from '@/lib/types';
import { SummaryTab } from './tabs/summary-tab';
import { ProductTab } from './tabs/product-tab';
import { BusinessTab } from './tabs/business-tab';
import { RefreshButton } from './refresh-button';

interface CompanyTabsProps {
  data: CompanyResponse;
  tabsLoading: Record<TabId, boolean>;
  onRefresh: (tab: TabId) => void;
}

const TAB_CONFIG = [
  { id: 'summary' as const, label: 'Summary', subtitle: 'Should I dig deeper?' },
  { id: 'product' as const, label: 'Product', subtitle: 'How it works' },
  { id: 'business' as const, label: 'Business', subtitle: 'Can they win?' },
  { id: 'people' as const, label: 'People', subtitle: 'Who uses it?' },
];

export function CompanyTabs({ data, tabsLoading, onRefresh }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const getTabData = () => {
    switch (activeTab) {
      case 'summary':
        return data.summary;
      case 'product':
        return data.product;
      case 'business':
        return data.business;
      case 'people':
        return data.people;
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
            <div className="text-left">
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
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--vaaya-text-muted)' }}
              >
                {tab.subtitle}
              </div>
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
              {activeTab === 'summary' && <SummaryTab data={data.summary.data} />}
              {activeTab === 'product' && <ProductTab data={data.product.data} />}
              {activeTab === 'business' && <BusinessTab data={data.business.data} />}
              {activeTab === 'people' && <PeopleTabPlaceholder />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder for People tab (not yet implemented)
function PeopleTabPlaceholder() {
  return (
    <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
      <div className="text-4xl mb-4">🚧</div>
      <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--vaaya-text)' }}>People Tab Coming Soon</h3>
      <p>Discovered users and buyers will appear here.</p>
    </div>
  );
}
