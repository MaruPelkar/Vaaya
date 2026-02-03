'use client';

import { useState } from 'react';
import { CompanyResponse } from '@/lib/types';
import { Tab1Overview } from './tab1-overview';
import { Tab2Intelligence } from './tab2-intelligence';
import { Tab3Users } from './tab3-users';
import { RefreshButton } from './refresh-button';

interface CompanyTabsProps {
  data: CompanyResponse;
  tabsLoading: { 1: boolean; 2: boolean; 3: boolean };
  onRefresh: (tab: 1 | 2 | 3) => void;
}

export function CompanyTabs({ data, tabsLoading, onRefresh }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  const tabs = [
    { id: 1 as const, label: 'Overview', updated: data.tab1.updated_at },
    { id: 2 as const, label: 'Market Intelligence', updated: data.tab2.updated_at },
    { id: 3 as const, label: 'User Discovery', updated: data.tab3.updated_at },
  ];

  const getTabData = () => {
    switch (activeTab) {
      case 1:
        return data.tab1;
      case 2:
        return data.tab2;
      case 3:
        return data.tab3;
    }
  };

  const tabData = getTabData();

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-300 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-base font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tabsLoading[tab.id] && (
              <span className="ml-2 inline-block w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-md border border-gray-300">
        {/* Refresh Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <div className="text-xs uppercase tracking-wide font-medium text-gray-500">
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
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Fetching data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 1 && <Tab1Overview data={data.tab1.data} />}
              {activeTab === 2 && <Tab2Intelligence data={data.tab2.data} />}
              {activeTab === 3 && <Tab3Users data={data.tab3.data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
