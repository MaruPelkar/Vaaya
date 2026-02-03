import { SignalSource, DiscoveredUser } from '@/lib/types';

export const SIGNAL_WEIGHTS: Record<SignalSource, number> = {
  // Tier 1: Direct (0.80 - 0.95)
  g2_review: 0.95,
  capterra_review: 0.95,
  trustradius_review: 0.95,
  testimonial: 0.90,
  case_study: 0.90,
  linkedin_post: 0.85,
  product_hunt: 0.85,
  twitter_post: 0.80,
  youtube_review: 0.80,

  // Tier 2: Community (0.60 - 0.80)
  github_contributor: 0.80,
  github_issue: 0.75,
  github_discussion: 0.70,
  stackoverflow: 0.70,
  forum_post: 0.70,
  github_star: 0.70,
  reddit_post: 0.65,
  hn_comment: 0.65,
  reddit_comment: 0.60,
  discord: 0.60,

  // Tier 3: Inferred (0.45 - 0.55)
  job_posting: 0.55,
  logo_wall: 0.50,
  press_mention: 0.50,
  config_file: 0.50,
  integration_user: 0.45,
};

export const SIGNAL_TIERS: Record<SignalSource, 1 | 2 | 3 | 4> = {
  // Tier 1
  g2_review: 1,
  capterra_review: 1,
  trustradius_review: 1,
  testimonial: 1,
  case_study: 1,
  linkedin_post: 1,
  product_hunt: 1,
  twitter_post: 1,
  youtube_review: 1,

  // Tier 2
  github_contributor: 2,
  github_issue: 2,
  github_discussion: 2,
  stackoverflow: 2,
  forum_post: 2,
  github_star: 2,
  reddit_post: 2,
  hn_comment: 2,
  reddit_comment: 2,
  discord: 2,

  // Tier 3
  job_posting: 3,
  logo_wall: 3,
  press_mention: 3,
  integration_user: 3,

  // Tier 4
  config_file: 4,
};

export function calculateConfidenceScore(user: DiscoveredUser): number {
  // Base: highest signal confidence
  const maxSignal = Math.max(...user.signals.map(s => s.confidence));
  let score = maxSignal * 100;

  // Boost: multiple signals (diminishing returns)
  // Each additional signal adds up to 3 points
  const signalBoost = Math.min((user.signals.length - 1) * 3, 15);
  score += signalBoost;

  // Boost: identity completeness
  if (user.linkedin_url) score += 5;
  if (user.company) score += 3;
  if (user.role) score += 2;
  if (user.email) score += 3;

  // Boost: tier diversity (signals from multiple tiers)
  const tiers = new Set(user.signals.map(s => s.tier));
  score += (tiers.size - 1) * 2;

  // Cap at 99
  return Math.min(Math.round(score), 99);
}
