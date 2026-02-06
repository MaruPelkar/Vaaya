'use client';

import { FeatureAreaCoverage } from '@/lib/types';
import { ProgressBar } from '../ui/progress-bar';

interface ProductRealityCardProps {
  feature_area_coverage: FeatureAreaCoverage[];
  top_capabilities: string[];
  integration_count: number;
  top_integration_categories: string[];
}

export function ProductRealityCard({
  feature_area_coverage,
  top_capabilities,
  integration_count,
  top_integration_categories,
}: ProductRealityCardProps) {
  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="metric-label">Product Reality</h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>

      {/* Feature Area Coverage */}
      {feature_area_coverage.length > 0 && (
        <div className="mb-4">
          <div className="metric-label mb-3">Feature Coverage</div>
          <div className="space-y-3">
            {feature_area_coverage.slice(0, 4).map((area, i) => (
              <ProgressBar
                key={i}
                label={area.area}
                value={area.coverage_percent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Capabilities */}
      {top_capabilities.length > 0 && (
        <div className="mb-4">
          <div className="metric-label mb-3">Top Capabilities</div>
          <ul className="space-y-2">
            {top_capabilities.slice(0, 5).map((cap, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--gray-700)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Integrations */}
      <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--gray-200)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="metric-label">Integrations</span>
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
            {integration_count > 0 ? `${integration_count}+` : 'N/A'}
          </span>
        </div>
        {top_integration_categories.length > 0 && (
          <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
            {top_integration_categories.slice(0, 3).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
