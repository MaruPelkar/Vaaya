'use client';

import { DashboardData } from '@/lib/types';
import { PositioningCard } from '../dashboard/positioning-card';
import { ProductRealityCard } from '../dashboard/product-reality-card';
import { MonetizationCard } from '../dashboard/monetization-card';
import { MomentumCard } from '../dashboard/momentum-card';
import { TimelineTape } from '../dashboard/timeline-tape';
import { CustomerVoiceCard } from '../dashboard/customer-voice-card';
import { CompetitiveSnapshot } from '../dashboard/competitive-snapshot';
import { RiskFlags } from '../dashboard/risk-flags';

interface DashboardTabProps {
  data: DashboardData | null;
}

export function DashboardTab({ data }: DashboardTabProps) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--vaaya-text-muted)' }}>
        No dashboard data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Above the Fold: 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Positioning + ICP */}
        <PositioningCard
          one_liner={data.positioning.one_liner}
          category_tags={data.positioning.category_tags}
          primary_personas={data.positioning.primary_personas}
          top_jobs={data.positioning.top_jobs}
        />

        {/* Card 2: Product Reality */}
        <ProductRealityCard
          feature_area_coverage={data.product_reality.feature_area_coverage}
          top_capabilities={data.product_reality.top_capabilities}
          integration_count={data.product_reality.integration_count}
          top_integration_categories={data.product_reality.top_integration_categories}
        />

        {/* Card 3: Monetization + Gating */}
        <MonetizationCard
          pricing_model={data.monetization.pricing_model}
          plans={data.monetization.plans}
          enterprise_gates={data.monetization.enterprise_gates}
          hard_limits={data.monetization.hard_limits}
        />

        {/* Card 4: Momentum */}
        <MomentumCard
          sparkline_data={data.momentum.sparkline_data}
          summary_sentence={data.momentum.summary_sentence}
          signals={data.momentum.signals}
        />
      </div>

      {/* Below the Fold: Timeline */}
      <TimelineTape events={data.timeline} />

      {/* Below the Fold: Customer Voice + Competitive Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerVoiceCard
          positive_themes={data.customer_voice.positive_themes}
          negative_themes={data.customer_voice.negative_themes}
          sources={data.customer_voice.sources}
        />

        <CompetitiveSnapshot competitors={data.competitive.competitors} />
      </div>

      {/* Below the Fold: Risk Flags (conditional - only renders if risks exist) */}
      <RiskFlags risks={data.risks} />
    </div>
  );
}
