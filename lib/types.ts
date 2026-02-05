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

  // Company Status
  status: 'active' | 'acquired' | 'ipo' | 'shut_down' | null;
  acquired_by: string | null;
  acquisition_date: string | null;
  ipo_date: string | null;
  stock_symbol: string | null;

  // Funding Details
  funding: {
    total: string | null;
    last_round: string | null;
    last_round_date: string | null;
    investors: string[];
  };

  // Funding Timeline (detailed rounds)
  funding_rounds: Array<{
    round_type: string; // e.g., "Seed", "Series A", "Series B"
    amount: string | null;
    date: string | null;
    valuation: string | null;
    lead_investors: string[];
  }>;

  // Employee Trend
  employee_count: number | null;
  employee_trend: Array<{
    date: string;
    count: number;
  }>;
  employee_growth_rate: string | null; // e.g., "+25% YoY"

  // Acquisitions Made
  acquisitions: Array<{
    company_name: string;
    date: string | null;
    amount: string | null;
    description: string | null;
  }>;

  // Competitive Landscape
  competitors: Array<{
    name: string;
    domain: string | null;
    description: string | null;
  }>;

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

// Tab 2: Market Intelligence - Product Intelligence Engine
export interface Tab2Data {
  executive_brief: ExecutiveBrief;
  tier1: Tier1OfficialSources;
  tier2: Tier2CommunitySources;
  tier3: Tier3ProductIntelligence;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTIVE BRIEF
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExecutiveBrief {
  generated_at: string;

  whats_new: {
    summary: string;
    releases: Array<{
      title: string;
      type: 'major_feature' | 'minor_feature' | 'integration' | 'improvement' | 'announcement';
      date: string;
      description: string;
      source: string;
      source_url: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    time_period: string;
    total_releases_found: number;
  };

  market_reaction: {
    summary: string;
    sentiment: {
      score: number; // 0-100
      label: 'very_positive' | 'positive' | 'mixed' | 'negative' | 'very_negative';
      trend: 'improving' | 'stable' | 'declining';
      based_on_mentions: number;
    };
    positive_themes: Array<{
      theme: string;
      frequency: 'very_common' | 'common' | 'occasional';
      example_quote: string | null;
      sources: string[];
    }>;
    negative_themes: Array<{
      theme: string;
      frequency: 'very_common' | 'common' | 'occasional';
      example_quote: string | null;
      sources: string[];
    }>;
    notable_reactions: Array<{
      quote: string;
      source: string;
      source_url: string | null;
      sentiment: 'positive' | 'negative' | 'neutral';
      author_context: string | null;
    }>;
  };

  product_direction: {
    summary: string;
    confirmed_roadmap: Array<{
      feature: string;
      status: 'announced' | 'in_beta' | 'coming_soon';
      expected_timeline: string | null;
      source: string;
      source_url: string;
    }>;
    likely_priorities: Array<{
      area: string;
      confidence: 'high' | 'medium' | 'low';
      evidence: string[];
      signal_count: number;
    }>;
    top_requested_features: Array<{
      feature: string;
      demand_level: 'high' | 'medium' | 'low';
      sources: string[];
      vote_count: number | null;
    }>;
    strategic_signals: Array<{
      signal: string;
      evidence: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 1: OFFICIAL SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Tier1OfficialSources {
  g2: {
    url: string;
    overall_rating: number;
    total_reviews: number;
    review_trend: 'up' | 'down' | 'stable';
    categories: Array<{
      category: string;
      rank: number | null;
      total_in_category: number | null;
      badge: string | null;
    }>;
    scores: {
      ease_of_use: number | null;
      quality_of_support: number | null;
      ease_of_setup: number | null;
      ease_of_admin: number | null;
    };
    top_pros: string[];
    top_cons: string[];
    recent_reviews: Array<{
      rating: number;
      title: string;
      snippet: string;
      reviewer_role: string | null;
      reviewer_company_size: string | null;
      date: string;
      url: string;
    }>;
  } | null;

  capterra: {
    url: string;
    overall_rating: number;
    total_reviews: number;
    scores: {
      ease_of_use: number | null;
      customer_service: number | null;
      features: number | null;
      value_for_money: number | null;
    };
    recent_reviews: Array<{
      rating: number;
      title: string;
      snippet: string;
      date: string;
      url: string;
    }>;
  } | null;

  trustradius: {
    url: string;
    tr_score: number;
    total_reviews: number;
    recent_reviews: Array<{
      rating: number;
      snippet: string;
      date: string;
      url: string;
    }>;
  } | null;

  gartner: {
    peer_insights_rating: number | null;
    magic_quadrant: {
      position: 'Leader' | 'Challenger' | 'Visionary' | 'Niche Player' | null;
      year: number;
      report_url: string | null;
    } | null;
    key_strengths: string[];
    cautions: string[];
  } | null;

  forrester: {
    wave_position: string | null;
    wave_year: number | null;
  } | null;

  linkedin: {
    company_url: string;
    follower_count: number | null;
    follower_growth: number | null;
    company_posts: Array<{
      content_snippet: string;
      post_type: 'product_update' | 'hiring' | 'thought_leadership' | 'company_news' | 'other';
      engagement: {
        likes: number;
        comments: number;
      };
      date: string;
      url: string;
    }>;
    employee_posts: Array<{
      author_name: string;
      author_title: string;
      content_snippet: string;
      is_product_related: boolean;
      engagement: number;
      date: string;
      url: string;
    }>;
  } | null;

  crunchbase_news: Array<{
    title: string;
    date: string;
    category: 'funding' | 'acquisition' | 'product' | 'partnership' | 'leadership' | 'other';
    url: string;
  }>;

  press_releases: Array<{
    title: string;
    date: string;
    source: string;
    category: 'product' | 'partnership' | 'funding' | 'expansion' | 'award' | 'other';
    snippet: string;
    url: string;
    key_announcement: string;
  }>;

  analyst_coverage: Array<{
    analyst_firm: string;
    report_type: string;
    mention_context: string;
    date: string;
    url: string | null;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 2: COMMUNITY & SOCIAL
// ═══════════════════════════════════════════════════════════════════════════════

export interface Tier2CommunitySources {
  aggregate_sentiment: {
    score: number;
    label: 'positive' | 'mixed' | 'negative';
    total_mentions: number;
    most_active_platform: string;
  };

  reddit: {
    subreddits_active: string[];
    has_dedicated_subreddit: boolean;
    dedicated_subreddit_members: number | null;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    top_threads: Array<{
      subreddit: string;
      title: string;
      score: number;
      num_comments: number;
      date: string;
      sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
      key_points: string[];
      url: string;
    }>;
    common_praise: string[];
    common_complaints: string[];
    competitor_mentions: Array<{
      competitor: string;
      context: string;
      comparison_sentiment: 'favorable' | 'unfavorable' | 'neutral';
    }>;
  } | null;

  twitter: {
    mention_volume_30d: number | null;
    sentiment_score: number | null;
    notable_tweets: Array<{
      author_handle: string;
      author_followers: number | null;
      content: string;
      likes: number;
      retweets: number;
      date: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      url: string;
    }>;
    influencer_mentions: Array<{
      author: string;
      followers: number | null;
      content_snippet: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      url: string;
    }>;
    trending_topics: string[];
  } | null;

  hacker_news: {
    total_stories: number;
    total_comments: number;
    top_stories: Array<{
      title: string;
      points: number;
      num_comments: number;
      date: string;
      discussion_sentiment: 'positive' | 'negative' | 'mixed';
      key_discussion_points: string[];
      url: string;
    }>;
    show_hn_posts: Array<{
      title: string;
      points: number;
      num_comments: number;
      date: string;
      url: string;
    }>;
    notable_comments: Array<{
      context: string;
      comment_snippet: string;
      points: number;
    }>;
  } | null;

  facebook: {
    has_official_page: boolean;
    page_followers: number | null;
    group_mentions: Array<{
      group_name: string;
      post_topic: string;
      engagement: number;
      sentiment: 'positive' | 'negative' | 'neutral';
      date: string;
    }>;
  } | null;

  discord: {
    has_official_server: boolean;
    server_members: number | null;
    server_url: string | null;
    discussion_themes: string[];
    activity_level: 'very_active' | 'active' | 'moderate' | 'low' | 'unknown';
  } | null;

  official_community: {
    platform: string;
    url: string;
    total_members: number | null;
    total_topics: number | null;
    hot_topics: Array<{
      title: string;
      replies: number;
      views: number | null;
      category: string;
      is_feature_request: boolean;
      is_bug_report: boolean;
      url: string;
    }>;
    trending_feature_requests: string[];
    common_support_issues: string[];
    unanswered_questions: number | null;
  } | null;

  youtube: {
    official_channel_subs: number | null;
    third_party_reviews: Array<{
      channel_name: string;
      title: string;
      views: number;
      sentiment: 'positive' | 'negative' | 'neutral';
      url: string;
    }>;
  } | null;

  product_hunt: {
    total_launches: number;
    latest_launch: {
      name: string;
      tagline: string;
      upvotes: number;
      date: string;
      url: string;
    } | null;
  } | null;

  quora: {
    questions_found: number;
    notable_qa: Array<{
      question: string;
      answer_snippet: string;
      views: number;
    }>;
  } | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 3: PRODUCT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

export interface Tier3ProductIntelligence {
  changelog: {
    url: string | null;
    releases: Array<{
      version: string | null;
      date: string;
      title: string;
      type: 'major' | 'minor' | 'patch' | 'announcement';
      highlights: string[];
      url: string;
    }>;
    velocity: {
      releases_last_30_days: number;
      releases_last_90_days: number;
      average_days_between_releases: number;
      trend: 'accelerating' | 'stable' | 'slowing';
    };
    active_areas: Array<{
      area: string;
      update_count: number;
      recent_examples: string[];
    }>;
  } | null;

  help_docs: {
    url: string | null;
    recent_additions: Array<{
      title: string;
      category: string;
      date_detected: string;
      url: string;
      inferred_feature: string | null;
    }>;
    main_categories: string[];
    signals: {
      has_api_docs: boolean;
      has_developer_portal: boolean;
      documentation_quality: 'comprehensive' | 'adequate' | 'limited' | 'unknown';
    };
  } | null;

  github: {
    org_name: string | null;
    main_repo: string | null;
    is_open_source: boolean;
    metrics: {
      stars: number;
      forks: number;
      open_issues: number;
      open_prs: number;
      contributors: number;
      last_commit: string;
      activity_level: 'very_active' | 'active' | 'moderate' | 'low';
    } | null;
    recent_issues: Array<{
      title: string;
      number: number;
      state: 'open' | 'closed';
      labels: string[];
      comments: number;
      reactions: number;
      date: string;
      issue_type: 'bug' | 'feature_request' | 'question' | 'other';
      url: string;
    }>;
    hot_issues: Array<{
      title: string;
      comments: number;
      reactions: number;
      url: string;
    }>;
    feature_requests: Array<{
      title: string;
      reactions: number;
      comments: number;
      status: 'open' | 'planned' | 'in_progress' | 'closed';
      url: string;
    }>;
    bug_patterns: string[];
    recent_prs: Array<{
      title: string;
      merged_at: string;
      labels: string[];
      url: string;
    }>;
    inferred_priorities: string[];
  } | null;

  support: {
    help_center_url: string | null;
    common_issues: Array<{
      issue: string;
      frequency: 'high' | 'medium' | 'low';
      category: string;
    }>;
    support_signals: {
      g2_support_rating: number | null;
      response_time_claim: string | null;
      community_sentiment: 'positive' | 'mixed' | 'negative';
    };
    pain_points: Array<{
      issue: string;
      severity: 'critical' | 'major' | 'minor';
      source: string;
    }>;
  };

  api_docs: {
    url: string | null;
    has_public_api: boolean;
    recent_changes: Array<{
      change: string;
      type: 'new_endpoint' | 'deprecation' | 'breaking' | 'enhancement';
      date: string | null;
    }>;
    integrations: {
      native_count: number | null;
      zapier: boolean;
      make: boolean;
      api_quality: 'excellent' | 'good' | 'limited' | 'unknown';
    };
  } | null;

  public_roadmap: {
    url: string;
    platform: string;
    items: Array<{
      title: string;
      status: 'under_review' | 'planned' | 'in_progress' | 'completed';
      votes: number | null;
      category: string | null;
      expected_date: string | null;
    }>;
    most_voted: Array<{
      title: string;
      votes: number;
      status: string;
    }>;
  } | null;

  status_page: {
    url: string;
    current_status: 'operational' | 'degraded' | 'outage';
    uptime_90d: number | null;
    recent_incidents: Array<{
      title: string;
      date: string;
      severity: 'minor' | 'major' | 'critical';
      duration_minutes: number | null;
      affected: string[];
    }>;
  } | null;

  job_signals: {
    total_open_roles: number;
    careers_url: string | null;
    product_signals: Array<{
      role_title: string;
      inferred_focus: string;
      key_requirements: string[];
    }>;
    tech_investments: Array<{
      technology: string;
      role_count: number;
      signal: string;
    }>;
    team_signals: string[];
    expansion_signals: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: USER DISCOVERY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export type SignalSource =
  // Tier 1: Direct (0.80 - 0.95)
  | 'g2_review' | 'capterra_review' | 'trustradius_review'
  | 'linkedin_post' | 'twitter_post' | 'testimonial'
  | 'case_study' | 'product_hunt' | 'youtube_review'
  // Tier 2: Community (0.60 - 0.75)
  | 'github_issue' | 'github_discussion' | 'stackoverflow'
  | 'reddit_post' | 'reddit_comment' | 'hn_comment'
  | 'forum_post' | 'discord' | 'github_star' | 'github_contributor'
  // Tier 3: Inferred (0.45 - 0.55)
  | 'job_posting' | 'logo_wall' | 'press_mention' | 'integration_user'
  // Tier 4: Technical
  | 'config_file';

export interface RawSignal {
  id: string;
  source: SignalSource;
  tier: 1 | 2 | 3 | 4;
  source_url: string;

  // Extracted person info
  extracted_name: string | null;
  extracted_company: string | null;
  extracted_role: string | null;
  extracted_linkedin: string | null;
  extracted_twitter: string | null;
  extracted_github: string | null;
  extracted_email: string | null;

  // Context
  signal_text: string;
  signal_date: string | null;
  base_confidence: number; // 0-1

  // Optional metadata
  metadata?: Record<string, string | number | null>;
}

export interface DiscoveredUser {
  id: string;

  // Identity
  name: string;
  company: string | null;
  role: string | null;

  // Contact
  linkedin_url: string | null;
  twitter_handle: string | null;
  github_username: string | null;
  email: string | null;

  // Scoring
  confidence_score: number; // 0-100
  signal_count: number;
  strongest_signal: SignalSource;

  // Evidence
  signals: Array<{
    source: SignalSource;
    tier: number;
    text: string;
    url: string;
    date: string | null;
    confidence: number;
  }>;
}

export interface Tab3Data {
  summary: {
    total_users_found: number;
    high_confidence_count: number;  // ≥70
    medium_confidence_count: number; // 40-69
    low_confidence_count: number;   // <40
    signals_collected: number;
    sources_searched: string[];
  };

  users: DiscoveredUser[];

  // For Tier 3: companies we identified
  companies_identified: Array<{
    name: string;
    source: string;
    signals: number;
  }>;

  collected_at: string;
  collection_time_ms: number;
}

// Legacy type alias for backward compatibility
export type SignalType = SignalSource;

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

// ═══════════════════════════════════════════════════════════════════════════════
// CSV UPLOAD & BOLNA AI INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface CSVRow {
  sno: string;
  name: string;
  software: string;
  phone_number: string;
}

export interface BolnaCallRequest {
  agent_id: string;
  recipient_phone_number: string;
  user_data?: {
    name: string;
    software: string;
  };
}

export interface BolnaCallResponse {
  call_id: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

export interface CSVProcessingResult {
  row: CSVRow;
  bolna_response: BolnaCallResponse;
  success: boolean;
  error?: string;
}
