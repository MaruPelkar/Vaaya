// Database record
export interface Company {
  domain: string;
  name: string;
  logo_url: string | null;
  tab1_data: Tab1Data;
  tab1_updated_at: string | null;
  tab1_sources: string[];
  tab2_data: Tab2Data;
  tab2_updated_at: string | null;
  tab2_sources: string[];
  tab3_data: Tab3Data;
  tab3_updated_at: string | null;
  tab3_sources: string[];
  created_at: string;
  updated_at: string;
}

// Tab 1: Company Overview
export interface Tab1Data {
  description: string;
  founded: number | null;
  headquarters: string | null;
  employee_range: string | null;
  industry: string | null;
  funding: {
    total: string | null;
    last_round: string | null;
    last_round_date: string | null;
    investors: string[];
  };
  leadership: Array<{
    name: string;
    title: string;
    linkedin_url: string | null;
  }>;
  socials: {
    twitter: string | null;
    linkedin: string | null;
    github: string | null;
  };
  website: string;
}

// Tab 2: Market Intelligence
export interface Tab2Data {
  summary: string;
  sentiment_score: number; // 0-1
  loved_features: string[];
  common_complaints: string[];
  recent_releases: Array<{
    title: string;
    date: string;
    source_url: string;
  }>;
  press_mentions: Array<{
    title: string;
    date: string;
    source: string;
    snippet: string;
    url: string;
  }>;
  raw_mentions: Array<{
    source: 'twitter' | 'linkedin' | 'reddit' | 'g2' | 'hackernews' | 'other';
    text: string;
    date: string | null;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

// Tab 3: User Discovery
export interface Tab3Data {
  users: Array<{
    id: string; // Generated UUID
    name: string;
    title: string | null;
    company: string | null;
    confidence_score: number; // 0-1
    signals: Array<{
      type: SignalType;
      confidence: number;
      snippet: string;
      url: string;
      date: string | null;
    }>;
    linkedin_url: string | null;
    email: string | null;
  }>;
  companies_using: string[];
  total_signals_found: number;
}

export type SignalType =
  | 'g2_review'
  | 'capterra_review'
  | 'trustradius_review'
  | 'testimonial'
  | 'linkedin_post'
  | 'twitter_mention'
  | 'reddit_post'
  | 'forum_post'
  | 'github_issue'
  | 'stackoverflow'
  | 'job_posting_inference';

// Autocomplete response
export interface AutocompleteResult {
  name: string;
  domain: string;
  logo: string;
}

// API response types
export interface CompanyResponse {
  company: {
    domain: string;
    name: string;
    logo_url: string | null;
  };
  tab1: {
    data: Tab1Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
  tab2: {
    data: Tab2Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
  tab3: {
    data: Tab3Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
}

// Streaming event types
export type StreamEvent =
  | { type: 'tab_started'; tab: 1 | 2 | 3 }
  | { type: 'tab_complete'; tab: 1 | 2 | 3; data: Tab1Data | Tab2Data | Tab3Data; sources: string[] }
  | { type: 'tab_error'; tab: 1 | 2 | 3; error: string }
  | { type: 'all_complete' }
  | { type: 'company_info'; name: string; logo_url: string | null }
  | { type: 'error'; message: string };
