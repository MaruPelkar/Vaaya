// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY CORE
// ═══════════════════════════════════════════════════════════════════════════════

export interface Company {
  domain: string;
  name: string;
  logo_url: string | null;
  dashboard_data: DashboardData | null;
  dashboard_updated_at: string | null;
  dashboard_sources: string[];
  product_data: ProductData | null;
  product_updated_at: string | null;
  product_sources: string[];
  business_data: BusinessData | null;
  business_updated_at: string | null;
  business_sources: string[];
  person_data: PersonData | null;
  person_updated_at: string | null;
  person_sources: string[];
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: DASHBOARD - "Full company briefing at a glance"
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardData {
  // Card 1: Positioning + ICP
  positioning: {
    one_liner: string;
    category_tags: string[];
    primary_personas: PersonaChip[];
    top_jobs: string[]; // Top 3 JTBD
  };

  // Card 2: Product Reality
  product_reality: {
    feature_area_coverage: FeatureAreaCoverage[];
    top_capabilities: string[]; // Top 5
    integration_count: number;
    top_integration_categories: string[];
  };

  // Card 3: Monetization + Gating
  monetization: {
    pricing_model: PricingModel;
    plans: PlanSummary[];
    enterprise_gates: EnterpriseGate[];
    hard_limits: string[]; // Top 3 highlights
  };

  // Card 4: Momentum
  momentum: {
    sparkline_data: MomentumPoint[];
    summary_sentence: string;
    signals: MomentumSignal[];
  };

  // Below fold: Timeline
  timeline: TimelineEvent[];

  // Below fold: Customer Voice
  customer_voice: {
    positive_themes: string[]; // 3
    negative_themes: string[]; // 3
    sources: string[];
  };

  // Below fold: Competitive Snapshot
  competitive: {
    competitors: CompetitorSummary[]; // Top 3
  };

  // Below fold: Risk Flags (conditional)
  risks: Risk[]; // Only medium/high severity

  // Metadata
  generated_at: string;
}

// Dashboard supporting types
export interface PersonaChip {
  name: string;
  type: 'user' | 'buyer' | 'admin';
}

export interface FeatureAreaCoverage {
  area: string;
  coverage_percent: number;
}

export interface PlanSummary {
  name: string;
  price_display: string;
  key_feature: string;
}

export type EnterpriseGateName = 'SSO' | 'SCIM' | 'RBAC' | 'Audit Logs' | 'Data Residency';

export interface EnterpriseGate {
  name: EnterpriseGateName;
  available: boolean;
  plan?: string;
}

export interface MomentumPoint {
  date: string;
  value: number;
  type: 'headcount' | 'events' | 'hiring';
}

export interface MomentumSignal {
  type: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
}

export type TimelineEventType = 'product' | 'pricing' | 'gtm' | 'security';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  source_url?: string;
}

export type CompetitorType = 'direct' | 'adjacent' | 'replacement';

export interface CompetitorSummary {
  name: string;
  type: CompetitorType;
  wedge: string; // 1-line differentiation
}

export type RiskType = 'security' | 'reliability' | 'platform' | 'regulatory' | 'pricing';
export type RiskSeverity = 'medium' | 'high';

export interface Risk {
  type: RiskType;
  severity: RiskSeverity;
  description: string;
}

export type PricingModel = 'seat' | 'usage' | 'subscription' | 'transaction' | 'hybrid' | 'unknown';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: PRODUCT - "How it actually works" (placeholder for future)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProductData {
  // Feature Map grouped by workflow stage
  feature_map: {
    onboarding: Feature[];
    core_workflow: Feature[];
    collaboration: Feature[];
    analytics: Feature[];
    admin: Feature[];
  };

  // Personas (detailed)
  personas: PersonaDetail[];

  // Integrations
  integrations: {
    items: Integration[];
    total_count: number;
  };

  // Metadata
  generated_at: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  feature_area: string;
  personas: string[];
  plan_gate: 'free' | 'starter' | 'pro' | 'enterprise' | 'all';
  status: 'launched' | 'beta' | 'deprecated';
  evidence_url?: string;
}

export interface PersonaDetail {
  id: string;
  name: string;
  type: 'user' | 'buyer' | 'admin';
  role?: string;
  goals: string[];
  pains: string[];
  jobs_to_be_done: string[];
  key_features: string[];
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  depth: 'shallow' | 'deep';
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: BUSINESS - "Strategic and competitive intelligence" (placeholder)
// ═══════════════════════════════════════════════════════════════════════════════

export interface BusinessData {
  // GTM Profile
  gtm: {
    motion: 'plg' | 'sales_led' | 'hybrid';
    primary_buyer_roles: string[];
    acquisition_channels: string[];
    implementation_model: 'self_serve' | 'assisted' | 'ps_heavy';
    expansion_levers: string[];
  };

  // Pricing & Packaging
  pricing: {
    plans: PricingPlanDetail[];
    pricing_history: PricingHistoryEvent[];
  };

  // Competition
  competition: {
    competitors: CompetitorDetail[];
    feature_parity_summary: string;
    differentiation_durability: 'easy_to_copy' | 'moderate' | 'hard_to_copy';
  };

  // Signals
  signals: {
    funding: FundingSignal | null;
    hiring: HiringSignal | null;
    web_footprint: WebSignal | null;
    reliability: ReliabilitySignal | null;
  };

  // Metadata
  generated_at: string;
}

export interface PricingPlanDetail {
  name: string;
  price_display: string;
  billing_terms: string[];
  limits: { name: string; value: string }[];
  key_features: string[];
  enterprise_gates: string[];
}

export interface PricingHistoryEvent {
  date: string;
  change_type: 'new_plan' | 'price_change' | 'feature_change' | 'limit_change';
  description: string;
}

export interface CompetitorDetail {
  name: string;
  domain?: string;
  type: CompetitorType;
  overlap_jobs: string[];
  win_reasons: string[];
  lose_reasons: string[];
}

export interface FundingSignal {
  stage: string;
  total_raised: string;
  last_round_date?: string;
  investors: string[];
}

export interface HiringSignal {
  total_open_roles: number;
  velocity: 'accelerating' | 'stable' | 'slowing';
  focus_areas: string[];
}

export interface WebSignal {
  traffic_estimate: string;
  trend: 'up' | 'stable' | 'down';
}

export interface ReliabilitySignal {
  incidents_30d: number;
  uptime_percent?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: PERSON - "Users and buyers discovered" (placeholder)
// ═══════════════════════════════════════════════════════════════════════════════

export interface PersonData {
  users: DiscoveredPerson[];
  buyers: DiscoveredPerson[];
  companies_using: CompanyUsing[];
  generated_at: string;
}

export interface DiscoveredPerson {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  type: 'user' | 'buyer' | 'evaluator';
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  confidence_score: number;
  signals: PersonSignal[];
}

export type PersonSignalSource =
  | 'linkedin_search'
  | 'nyne_search'
  | 'g2_review'
  | 'capterra_review'
  | 'producthunt'
  | 'job_posting'
  | 'linkedin_post'
  | 'youtube_video'
  | 'webinar'
  | 'website'
  | 'press_release';

export interface PersonSignal {
  source: PersonSignalSource | string;
  text: string;
  url: string | null;
  date: string | null;
}

export interface CompanyUsing {
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  confidence: 'high' | 'medium' | 'low';
}

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TabId = 'dashboard' | 'product' | 'business' | 'person';

export interface CompanyResponse {
  company: {
    domain: string;
    name: string;
    logo_url: string | null;
  };
  dashboard: TabData<DashboardData>;
  product: TabData<ProductData>;
  business: TabData<BusinessData>;
  person: TabData<PersonData>;
}

export interface TabData<T> {
  data: T | null;
  updated_at: string | null;
  sources: string[];
  loading?: boolean;
}

// Streaming event types
export type StreamEvent =
  | { type: 'tab_started'; tab: TabId }
  | { type: 'tab_complete'; tab: TabId; data: DashboardData | ProductData | BusinessData | PersonData; sources: string[] }
  | { type: 'tab_error'; tab: TabId; error: string }
  | { type: 'all_complete' }
  | { type: 'company_info'; name: string; logo_url: string | null }
  | { type: 'error'; message: string };

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AutocompleteResult {
  name: string;
  domain: string;
  logo: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY DATA FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getEmptyDashboardData(): DashboardData {
  return {
    positioning: {
      one_liner: '',
      category_tags: [],
      primary_personas: [],
      top_jobs: [],
    },
    product_reality: {
      feature_area_coverage: [],
      top_capabilities: [],
      integration_count: 0,
      top_integration_categories: [],
    },
    monetization: {
      pricing_model: 'unknown',
      plans: [],
      enterprise_gates: [],
      hard_limits: [],
    },
    momentum: {
      sparkline_data: [],
      summary_sentence: '',
      signals: [],
    },
    timeline: [],
    customer_voice: {
      positive_themes: [],
      negative_themes: [],
      sources: [],
    },
    competitive: {
      competitors: [],
    },
    risks: [],
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyProductData(): ProductData {
  return {
    feature_map: {
      onboarding: [],
      core_workflow: [],
      collaboration: [],
      analytics: [],
      admin: [],
    },
    personas: [],
    integrations: {
      items: [],
      total_count: 0,
    },
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyBusinessData(): BusinessData {
  return {
    gtm: {
      motion: 'hybrid',
      primary_buyer_roles: [],
      acquisition_channels: [],
      implementation_model: 'self_serve',
      expansion_levers: [],
    },
    pricing: {
      plans: [],
      pricing_history: [],
    },
    competition: {
      competitors: [],
      feature_parity_summary: '',
      differentiation_durability: 'moderate',
    },
    signals: {
      funding: null,
      hiring: null,
      web_footprint: null,
      reliability: null,
    },
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyPersonData(): PersonData {
  return {
    users: [],
    buyers: [],
    companies_using: [],
    generated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  saved_companies: string[];
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  [key: string]: unknown;
}
