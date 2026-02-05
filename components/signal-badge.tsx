'use client';

import { SignalSource } from '@/lib/types';

interface Signal {
  type: SignalSource;
  confidence: number;
  snippet: string;
  url: string;
}

const SIGNAL_LABELS: Partial<Record<SignalSource, string>> = {
  g2_review: 'G2 Review',
  capterra_review: 'Capterra',
  trustradius_review: 'TrustRadius',
  testimonial: 'Testimonial',
  case_study: 'Case Study',
  linkedin_post: 'LinkedIn',
  twitter_post: 'Twitter',
  reddit_post: 'Reddit',
  reddit_comment: 'Reddit',
  forum_post: 'Forum',
  github_issue: 'GitHub',
  github_discussion: 'GitHub Discussion',
  stackoverflow: 'Stack Overflow',
  hn_comment: 'Hacker News',
  job_posting: 'Job Posting',
  logo_wall: 'Customer',
  press_mention: 'Press',
  product_hunt: 'Product Hunt',
  youtube_review: 'YouTube',
  discord: 'Discord',
  slack_community: 'Slack',
};

const SIGNAL_COLORS: Partial<Record<SignalSource, string>> = {
  g2_review: 'bg-orange-100 text-orange-700',
  capterra_review: 'bg-orange-100 text-orange-700',
  trustradius_review: 'bg-orange-100 text-orange-700',
  testimonial: 'bg-purple-100 text-purple-700',
  case_study: 'bg-purple-100 text-purple-700',
  linkedin_post: 'bg-blue-100 text-blue-700',
  twitter_post: 'bg-sky-100 text-sky-700',
  reddit_post: 'bg-red-100 text-red-700',
  reddit_comment: 'bg-red-100 text-red-700',
  forum_post: 'bg-gray-100 text-gray-700',
  github_issue: 'bg-gray-800 text-white',
  github_discussion: 'bg-gray-800 text-white',
  stackoverflow: 'bg-amber-100 text-amber-700',
  hn_comment: 'bg-orange-100 text-orange-700',
  job_posting: 'bg-green-100 text-green-700',
  logo_wall: 'bg-indigo-100 text-indigo-700',
  press_mention: 'bg-cyan-100 text-cyan-700',
  product_hunt: 'bg-orange-100 text-orange-700',
  youtube_review: 'bg-red-100 text-red-700',
  discord: 'bg-indigo-100 text-indigo-700',
  slack_community: 'bg-purple-100 text-purple-700',
};

export function SignalBadge({ signal }: { signal: Signal }) {
  const label = SIGNAL_LABELS[signal.type] || signal.type;
  const color = SIGNAL_COLORS[signal.type] || 'bg-gray-200 text-gray-800';

  return (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${color} hover:shadow-md transition-shadow`}
      title={signal.snippet}
    >
      {label}
      <span className="font-bold">({Math.round(signal.confidence * 100)}%)</span>
    </a>
  );
}
