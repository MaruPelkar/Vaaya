'use client';

import { ProductData, Feature } from '@/lib/types';
import { Chip } from '../ui/chip';

interface ProductTabProps {
  data: ProductData | null;
}

const WORKFLOW_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  core_action: 'Core Actions',
  collaboration: 'Collaboration',
  reporting: 'Reporting & Analytics',
  admin: 'Admin & Settings',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-green-100 text-green-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-orange-100 text-orange-700',
  all: 'bg-gray-100 text-gray-700',
};

export function ProductTab({ data }: ProductTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        No product data available
      </div>
    );
  }

  const allFeatures = [
    ...data.feature_map.onboarding,
    ...data.feature_map.core_action,
    ...data.feature_map.collaboration,
    ...data.feature_map.reporting,
    ...data.feature_map.admin,
  ];

  const hasFeatures = allFeatures.length > 0;
  const hasIntegrations = data.integrations.top_integrations.length > 0;
  const hasPersonas = data.personas.length > 0;

  return (
    <div className="space-y-10">
      {/* Feature Map */}
      <section>
        <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
          Feature Map
        </h3>

        {hasFeatures ? (
          <div className="space-y-8">
            {Object.entries(data.feature_map).map(([stage, features]) => {
              if (features.length === 0) return null;
              return (
                <div key={stage}>
                  <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {WORKFLOW_LABELS[stage] || stage}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                      <FeatureCard key={i} feature={feature} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bento-box rounded-lg p-8 text-center" style={{ color: 'var(--vaaya-text-muted)' }}>
            No features identified yet
          </div>
        )}
      </section>

      {/* Personas */}
      {hasPersonas && (
        <section>
          <h3 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--vaaya-text)' }}>
            Personas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.personas.map((persona, i) => (
              <div key={i} className="bento-box rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>
                    {persona.title}
                  </div>
                  <Chip variant="small">{persona.department}</Chip>
                  <span className="text-xs capitalize" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {persona.seniority.replace('_', ' ')}
                  </span>
                </div>

                {persona.jobs_to_be_done.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                      Jobs to be Done
                    </div>
                    <ul className="space-y-1">
                      {persona.jobs_to_be_done.slice(0, 3).map((job, j) => (
                        <li key={j} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                          <span style={{ color: 'var(--vaaya-brand)' }}>•</span>
                          {job}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {persona.pain_points_solved.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                      Pain Points Solved
                    </div>
                    <ul className="space-y-1">
                      {persona.pain_points_solved.slice(0, 3).map((pain, j) => (
                        <li key={j} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                          <span className="text-green-600">✓</span>
                          {pain}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Integrations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>
            Integrations
          </h3>
          {data.integrations.total_count > 0 && (
            <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
              {data.integrations.total_count} total
            </span>
          )}
        </div>

        {hasIntegrations ? (
          <>
            {/* Categories */}
            {data.integrations.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {data.integrations.categories.map((cat, i) => (
                  <Chip key={i} variant="category">
                    {cat.name} ({cat.count})
                  </Chip>
                ))}
              </div>
            )}

            {/* Top Integrations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.integrations.top_integrations.slice(0, 12).map((integration, i) => (
                <div key={i} className="bento-box rounded-lg p-4 shadow-sm">
                  <div className="font-bold text-sm mb-1" style={{ color: 'var(--vaaya-text)' }}>
                    {integration.name}
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {integration.category}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      integration.depth === 'native' ? 'bg-green-100 text-green-700' :
                      integration.depth === 'api' ? 'bg-blue-100 text-blue-700' :
                      integration.depth === 'zapier_only' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {integration.depth.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bento-box rounded-lg p-8 text-center" style={{ color: 'var(--vaaya-text-muted)' }}>
            No integrations identified yet
          </div>
        )}
      </section>

      {/* Available Filters (for reference) */}
      {(data.available_personas.length > 0 || data.available_feature_areas.length > 0) && (
        <section className="bento-box rounded-lg p-6 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
            Feature Metadata
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.available_personas.length > 0 && (
              <div>
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Personas
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.available_personas.map((p, i) => (
                    <Chip key={i} variant="small">{p}</Chip>
                  ))}
                </div>
              </div>
            )}
            {data.available_plan_gates.length > 0 && (
              <div>
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Plan Gates
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.available_plan_gates.map((p, i) => (
                    <Chip key={i} variant="small">{p}</Chip>
                  ))}
                </div>
              </div>
            )}
            {data.available_feature_areas.length > 0 && (
              <div>
                <div className="text-xs uppercase font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                  Feature Areas
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.available_feature_areas.map((a, i) => (
                    <Chip key={i} variant="small">{a}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="bento-box rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="font-bold text-sm" style={{ color: 'var(--vaaya-text)' }}>
          {feature.name}
        </div>
        <div className="flex items-center gap-1">
          {feature.is_new && (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
              New
            </span>
          )}
          {feature.is_updated && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
              Updated
            </span>
          )}
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
        {feature.description}
      </p>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${PLAN_COLORS[feature.plan_gate] || PLAN_COLORS.all}`}>
          {feature.plan_gate}
        </span>
        {feature.personas.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
            {feature.personas.slice(0, 2).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
