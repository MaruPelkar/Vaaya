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
  { id: 'dashboard' as const, label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  )},
  { id: 'product' as const, label: 'Product', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )},
  { id: 'business' as const, label: 'Business', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { id: 'person' as const, label: 'Person', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )},
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
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{
          backgroundColor: 'var(--gray-100)',
          border: '1px solid var(--gray-200)',
        }}
      >
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--white)' : 'transparent',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-500)',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'var(--gray-200)';
                e.currentTarget.style.color = 'var(--gray-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gray-500)';
              }
            }}
          >
            {tab.icon}
            <span className="font-semibold text-sm">
              {tab.label}
            </span>
            {tabsLoading[tab.id] && (
              <span
                className="ml-1 inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="dashboard-card"
        style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Refresh Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--gray-200)' }}
        >
          <div
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: 'var(--gray-500)' }}
          >
            {tabData.updated_at ? (
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Last updated: {new Date(tabData.updated_at).toLocaleString()}
              </span>
            ) : tabsLoading[activeTab] ? (
              <span className="flex items-center gap-2">
                <div
                  className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
                Loading...
              </span>
            ) : (
              <span>Not yet loaded</span>
            )}
          </div>
          <RefreshButton
            loading={tabsLoading[activeTab]}
            onClick={() => onRefresh(activeTab)}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {tabsLoading[activeTab] && !tabData.updated_at ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div
                  className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
                <p className="font-medium" style={{ color: 'var(--gray-500)' }}>
                  Fetching data...
                </p>
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
    <div className="text-center py-16">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--gray-100)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--gray-900)' }}>
        Person Tab Coming Soon
      </h3>
      <p style={{ color: 'var(--gray-500)' }}>
        Discovered users and buyers will appear here.
      </p>
    </div>
  );
}
