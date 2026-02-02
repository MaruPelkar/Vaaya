'use client';

import { SignalType } from '@/lib/types';

interface Signal {
  type: SignalType;
  confidence: number;
  snippet: string;
  url: string;
}

const SIGNAL_LABELS: Record<SignalType, string> = {
  g2_review: 'G2 Review',
  capterra_review: 'Capterra',
  trustradius_review: 'TrustRadius',
  testimonial: 'Testimonial',
  linkedin_post: 'LinkedIn',
  twitter_mention: 'Twitter',
  reddit_post: 'Reddit',
  forum_post: 'Forum',
  github_issue: 'GitHub',
  stackoverflow: 'Stack Overflow',
  job_posting_inference: 'Job Posting',
};

const SIGNAL_COLORS: Record<SignalType, string> = {
  g2_review: 'bg-orange-100 text-orange-700',
  capterra_review: 'bg-orange-100 text-orange-700',
  trustradius_review: 'bg-orange-100 text-orange-700',
  testimonial: 'bg-purple-100 text-purple-700',
  linkedin_post: 'bg-blue-100 text-blue-700',
  twitter_mention: 'bg-sky-100 text-sky-700',
  reddit_post: 'bg-red-100 text-red-700',
  forum_post: 'bg-gray-100 text-gray-700',
  github_issue: 'bg-gray-800 text-white',
  stackoverflow: 'bg-amber-100 text-amber-700',
  job_posting_inference: 'bg-green-100 text-green-700',
};

export function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${SIGNAL_COLORS[signal.type]} hover:opacity-80`}
      title={signal.snippet}
    >
      {SIGNAL_LABELS[signal.type]}
      <span className="opacity-60">({Math.round(signal.confidence * 100)}%)</span>
    </a>
  );
}
