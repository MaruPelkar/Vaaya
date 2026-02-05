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
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
        Product Reality
      </h3>

      {/* Feature Area Coverage */}
      {feature_area_coverage.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Feature Coverage
          </div>
          <div className="space-y-2">
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
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Top Capabilities
          </div>
          <ul className="space-y-1">
            {top_capabilities.slice(0, 5).map((cap, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                <span style={{ color: 'var(--vaaya-brand)' }}>✓</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Integrations */}
      <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--vaaya-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
            Integrations
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--vaaya-brand)' }}>
            {integration_count > 0 ? `${integration_count}+` : 'N/A'}
          </span>
        </div>
        {top_integration_categories.length > 0 && (
          <div className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
            {top_integration_categories.slice(0, 3).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
