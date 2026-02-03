import { RawSignal, DiscoveredUser } from '@/lib/types';
import { calculateConfidenceScore } from './scoring';

export function resolveEntities(signals: RawSignal[]): DiscoveredUser[] {
  const clusters = new Map<string, RawSignal[]>();

  // Group signals by merge key
  for (const signal of signals) {
    const key = getMergeKey(signal);
    if (!key) continue;

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(signal);
  }

  // Convert clusters to users
  const users: DiscoveredUser[] = [];

  for (const [, clusterSignals] of clusters) {
    const user = mergeSignalsToUser(clusterSignals);
    user.confidence_score = calculateConfidenceScore(user);
    users.push(user);
  }

  // Sort by confidence
  return users.sort((a, b) => b.confidence_score - a.confidence_score);
}

function getMergeKey(signal: RawSignal): string | null {
  // Priority: LinkedIn > Email > Twitter > GitHub > Name+Company > Name alone
  if (signal.extracted_linkedin) {
    return `li:${normalizeLinkedIn(signal.extracted_linkedin)}`;
  }
  if (signal.extracted_email) {
    return `email:${signal.extracted_email.toLowerCase()}`;
  }
  if (signal.extracted_twitter) {
    return `tw:${signal.extracted_twitter.toLowerCase().replace('@', '')}`;
  }
  if (signal.extracted_github) {
    return `gh:${signal.extracted_github.toLowerCase()}`;
  }
  if (signal.extracted_name && signal.extracted_company) {
    return `nc:${normalize(signal.extracted_name)}:${normalize(signal.extracted_company)}`;
  }
  if (signal.extracted_name) {
    return `n:${normalize(signal.extracted_name)}`;
  }
  return null;
}

function mergeSignalsToUser(signals: RawSignal[]): DiscoveredUser {
  // Take best data from each signal
  let name = '';
  let company: string | null = null;
  let role: string | null = null;
  let linkedin: string | null = null;
  let twitter: string | null = null;
  let github: string | null = null;
  let email: string | null = null;

  // Sort signals by confidence to prioritize better sources
  signals.sort((a, b) => b.base_confidence - a.base_confidence);

  for (const s of signals) {
    if (s.extracted_name && s.extracted_name.length > name.length) name = s.extracted_name;
    if (s.extracted_company && !company) company = s.extracted_company;
    if (s.extracted_role && !role) role = s.extracted_role;
    if (s.extracted_linkedin && !linkedin) linkedin = s.extracted_linkedin;
    if (s.extracted_twitter && !twitter) twitter = s.extracted_twitter;
    if (s.extracted_github && !github) github = s.extracted_github;
    if (s.extracted_email && !email) email = s.extracted_email;
  }

  // Determine strongest signal
  const strongestSignal = signals[0]?.source || 'g2_review';

  return {
    id: crypto.randomUUID(),
    name: name || signals[0]?.extracted_twitter || signals[0]?.extracted_github || 'Unknown',
    company,
    role,
    linkedin_url: linkedin,
    twitter_handle: twitter,
    github_username: github,
    email,
    confidence_score: 0, // Set after by calculateConfidenceScore
    signal_count: signals.length,
    strongest_signal: strongestSignal,
    signals: signals.map(s => ({
      source: s.source,
      tier: s.tier,
      text: s.signal_text,
      url: s.source_url,
      date: s.signal_date,
      confidence: s.base_confidence,
    })),
  };
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeLinkedIn(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1].toLowerCase() : url.toLowerCase();
}
