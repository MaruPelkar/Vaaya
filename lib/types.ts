// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY CORE
// ═══════════════════════════════════════════════════════════════════════════════

export interface Company {
  domain: string;
  name: string;
  logo_url: string | null;
  summary_data: SummaryData | null;
  summary_updated_at: string | null;
  summary_sources: string[];
  product_data: ProductData | null;
  product_updated_at: string | null;
  product_sources: string[];
  business_data: BusinessData | null;
  business_updated_at: string | null;
  business_sources: string[];
  people_data: PeopleData | null;
  people_updated_at: string | null;
  people_sources: string[];
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: SUMMARY - "Should I dig deeper?"
// ═══════════════════════════════════════════════════════════════════════════════

export interface SummaryData {
  // One-liner + Category
  one_liner: string;
  category_tags: string[]; // e.g., ["CRM", "Sales Automation", "B2B SaaS"]
  platforms: string[]; // e.g., ["Web", "iOS", "Android", "Chrome Extension"]

  // ICP + Personas
  icp_chips: string[]; // e.g., ["SMB Sales Teams", "Enterprise RevOps", "SaaS Startups"]
  personas: {
    users: PersonaSummary[];
    buyers: PersonaSummary[];
  };

  // Use Cases
  top_use_cases: UseCase[];

  // Competitive Position
  why_they_win: string[]; // 3 bullets
  where_they_lose: string[]; // 3 bullets

  // Product Map
  product_map: ProductModule[];

  // Pricing
  pricing_at_glance: {
    has_free_tier: boolean;
    free_tier_description: string | null;
    starting_price: string | null; // e.g., "$49/user/month"
    enterprise_gates: string[]; // e.g., ["SSO", "SAML", "Custom SLAs"]
    pricing_model: 'per_seat' | 'usage_based' | 'flat_rate' | 'hybrid' | 'unknown';
  };

  // Key Signals
  signals: {
    funding_stage: string | null; // e.g., "Series B"
    total_funding: string | null;
    last_funding_date: string | null;
    headcount: number | null;
    headcount_trend: 'growing' | 'stable' | 'shrinking' | null;
    hiring_mix: HiringMix | null;
  };

  // Recent Changes
  recent_changes: {
    thirty_days: RecentChange[];
    ninety_days: RecentChange[];
  };

  // Metadata
  generated_at: string;
}

export interface PersonaSummary {
  title: string; // e.g., "Sales Development Rep"
  seniority: 'ic' | 'manager' | 'director' | 'vp' | 'c_level';
  department: string;
}

export interface UseCase {
  title: string;
  description: string;
  persona_fit: string[];
}

export interface ProductModule {
  name: string;
  description: string;
  key_features: string[];
}

export interface HiringMix {
  engineering_pct: number;
  sales_pct: number;
  product_pct: number;
  other_pct: number;
}

export interface RecentChange {
  type: 'product_launch' | 'pricing_change' | 'acquisition' | 'funding' | 'leadership' | 'partnership' | 'positioning';
  title: string;
  date: string;
  source_url: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: PRODUCT - "How it actually works"
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProductData {
  // Feature Map grouped by workflow stage
  feature_map: {
    onboarding: Feature[];
    core_action: Feature[];
    collaboration: Feature[];
    reporting: Feature[];
    admin: Feature[];
  };

  // Filter metadata
  available_personas: string[];
  available_plan_gates: string[];
  available_feature_areas: string[];

  // Personas (detailed)
  personas: PersonaDetail[];

  // Integrations
  integrations: {
    top_integrations: Integration[];
    categories: IntegrationCategory[];
    total_count: number;
  };

  // Generated at
  generated_at: string;
}

export interface Feature {
  name: string;
  description: string;
  personas: string[]; // which personas use it
  plan_gate: 'free' | 'starter' | 'pro' | 'enterprise' | 'all';
  feature_area: string;
  is_new: boolean;
  is_updated: boolean;
  update_date: string | null;
}

export interface PersonaDetail {
  title: string;
  seniority: 'ic' | 'manager' | 'director' | 'vp' | 'c_level';
  department: string;
  jobs_to_be_done: string[];
  key_features_used: string[];
  pain_points_solved: string[];
}

export interface Integration {
  name: string;
  category: string;
  depth: 'native' | 'api' | 'zapier_only' | 'partner';
  description: string;
  logo_url: string | null;
}

export interface IntegrationCategory {
  name: string;
  count: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: BUSINESS - "Can they win and how do they make money"
// ═══════════════════════════════════════════════════════════════════════════════

export interface BusinessData {
  // Pricing & Packaging
  pricing: {
    plans: PricingPlan[];
    enterprise_info: {
      has_enterprise: boolean;
      contact_sales: boolean;
      known_features: string[];
    };
    trial_info: {
      has_free_trial: boolean;
      trial_length_days: number | null;
      requires_credit_card: boolean | null;
    };
    pricing_page_url: string | null;
  };

  // Competitive Landscape
  competitive: {
    direct_competitors: Competitor[];
    alternatives: Competitor[];
    differentiators: string[];
    competitive_positioning: string;
  };

  // Traction Signals
  traction: {
    funding: FundingInfo;
    hiring: HiringInfo;
    web_proxies: WebProxy;
    customer_proof: CustomerProof;
  };

  // Timeline (filterable feed)
  timeline: TimelineEvent[];

  // Sources
  sources: SourceReference[];

  // Generated at
  generated_at: string;
}

export interface PricingPlan {
  name: string;
  price: string | null; // e.g., "$49/month" or "Custom"
  billing_cycle: 'monthly' | 'annual' | 'custom' | null;
  limits: PlanLimit[];
  key_features: string[];
  target_audience: string | null;
}

export interface PlanLimit {
  name: string;
  value: string;
}

export interface Competitor {
  name: string;
  domain: string | null;
  description: string;
  positioning: string;
}

export interface FundingInfo {
  total_raised: string | null;
  last_round: string | null;
  last_round_date: string | null;
  last_round_amount: string | null;
  investors: string[];
  valuation: string | null;
}

export interface HiringInfo {
  total_open_roles: number;
  velocity: 'accelerating' | 'stable' | 'slowing' | 'unknown';
  key_hires_focus: string[];
  careers_url: string | null;
}

export interface WebProxy {
  estimated_traffic: string | null;
  traffic_trend: 'up' | 'stable' | 'down' | 'unknown';
}

export interface CustomerProof {
  notable_customers: string[];
  case_studies_count: number;
  testimonials_count: number;
}

export interface TimelineEvent {
  type: 'pricing_change' | 'product_launch' | 'funding' | 'acquisition' | 'leadership' | 'partnership' | 'repositioning';
  title: string;
  description: string;
  date: string;
  source_url: string | null;
  source_name: string;
}

export interface SourceReference {
  name: string;
  url: string;
  type: 'official' | 'review' | 'news' | 'social' | 'community';
  last_accessed: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: PEOPLE - "Users who have used the product"
// ═══════════════════════════════════════════════════════════════════════════════

export interface PeopleData {
  summary: {
    total_people_found: number;
    users_count: number;
    buyers_count: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
    signals_collected: number;
    sources_searched: string[];
  };

  users: DiscoveredPerson[];
  buyers: DiscoveredPerson[];

  companies_using: CompanyUsing[];

  collected_at: string;
  collection_time_ms: number;
}

export interface DiscoveredPerson {
  id: string;
  name: string;
  company: string | null;
  role: string | null;

  // Type classification
  person_type: 'user' | 'buyer' | 'evaluator' | 'unknown';

  // Contact info
  linkedin_url: string | null;
  twitter_handle: string | null;
  email: string | null;

  // Scoring
  confidence_score: number;
  signal_count: number;

  // Persona tags
  persona_tags: string[];

  // Evidence
  signals: PersonSignal[];
}

export interface PersonSignal {
  source: SignalSource;
  tier: 1 | 2 | 3;
  text: string;
  url: string;
  date: string | null;
  confidence: number;
  indicates_usage: boolean;
  indicates_purchase_authority: boolean;
}

export interface CompanyUsing {
  name: string;
  domain: string | null;
  logo_url: string | null;
  industry: string | null;
  size: string | null;
  signal_count: number;
  confidence: 'high' | 'medium' | 'low';
}

export type SignalSource =
  | 'g2_review' | 'capterra_review' | 'trustradius_review'
  | 'linkedin_post' | 'twitter_post' | 'testimonial'
  | 'case_study' | 'product_hunt' | 'youtube_review'
  | 'github_issue' | 'github_discussion' | 'stackoverflow'
  | 'reddit_post' | 'reddit_comment' | 'hn_comment'
  | 'forum_post' | 'discord' | 'slack_community'
  | 'job_posting' | 'logo_wall' | 'press_mention';

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TabId = 'summary' | 'product' | 'business' | 'people';

export interface CompanyResponse {
  company: {
    domain: string;
    name: string;
    logo_url: string | null;
  };
  summary: TabData<SummaryData>;
  product: TabData<ProductData>;
  business: TabData<BusinessData>;
  people: TabData<PeopleData>;
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
  | { type: 'tab_complete'; tab: TabId; data: SummaryData | ProductData | BusinessData | PeopleData; sources: string[] }
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

export function getEmptySummaryData(): SummaryData {
  return {
    one_liner: '',
    category_tags: [],
    platforms: [],
    icp_chips: [],
    personas: { users: [], buyers: [] },
    top_use_cases: [],
    why_they_win: [],
    where_they_lose: [],
    product_map: [],
    pricing_at_glance: {
      has_free_tier: false,
      free_tier_description: null,
      starting_price: null,
      enterprise_gates: [],
      pricing_model: 'unknown',
    },
    signals: {
      funding_stage: null,
      total_funding: null,
      last_funding_date: null,
      headcount: null,
      headcount_trend: null,
      hiring_mix: null,
    },
    recent_changes: {
      thirty_days: [],
      ninety_days: [],
    },
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyProductData(): ProductData {
  return {
    feature_map: {
      onboarding: [],
      core_action: [],
      collaboration: [],
      reporting: [],
      admin: [],
    },
    available_personas: [],
    available_plan_gates: [],
    available_feature_areas: [],
    personas: [],
    integrations: {
      top_integrations: [],
      categories: [],
      total_count: 0,
    },
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyBusinessData(): BusinessData {
  return {
    pricing: {
      plans: [],
      enterprise_info: {
        has_enterprise: false,
        contact_sales: false,
        known_features: [],
      },
      trial_info: {
        has_free_trial: false,
        trial_length_days: null,
        requires_credit_card: null,
      },
      pricing_page_url: null,
    },
    competitive: {
      direct_competitors: [],
      alternatives: [],
      differentiators: [],
      competitive_positioning: '',
    },
    traction: {
      funding: {
        total_raised: null,
        last_round: null,
        last_round_date: null,
        last_round_amount: null,
        investors: [],
        valuation: null,
      },
      hiring: {
        total_open_roles: 0,
        velocity: 'unknown',
        key_hires_focus: [],
        careers_url: null,
      },
      web_proxies: {
        estimated_traffic: null,
        traffic_trend: 'unknown',
      },
      customer_proof: {
        notable_customers: [],
        case_studies_count: 0,
        testimonials_count: 0,
      },
    },
    timeline: [],
    sources: [],
    generated_at: new Date().toISOString(),
  };
}

export function getEmptyPeopleData(): PeopleData {
  return {
    summary: {
      total_people_found: 0,
      users_count: 0,
      buyers_count: 0,
      high_confidence_count: 0,
      medium_confidence_count: 0,
      low_confidence_count: 0,
      signals_collected: 0,
      sources_searched: [],
    },
    users: [],
    buyers: [],
    companies_using: [],
    collected_at: new Date().toISOString(),
    collection_time_ms: 0,
  };
}
