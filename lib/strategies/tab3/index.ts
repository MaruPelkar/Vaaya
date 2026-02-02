import { Tab3Data, SignalType } from '@/lib/types';
import { RawUserSignal } from './types';
import { searchReviewAuthors } from './review-authors';
import { searchTestimonials } from './testimonials';
import { searchLinkedInMentions } from './linkedin-mentions';
import { searchForumUsers } from './forums';
import { searchJobPostings } from './job-postings';
import { v4 as uuidv4 } from 'uuid';

export async function executeTab3Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab3Data; sources: string[] }> {
  const sources: string[] = [];
  const allSignals: RawUserSignal[] = [];

  // Gather signals in parallel
  const [reviewsResult, testimonialsResult, linkedinResult, forumsResult, jobsResult] =
    await Promise.allSettled([
      searchReviewAuthors(companyName),
      searchTestimonials(domain, companyName),
      searchLinkedInMentions(companyName),
      searchForumUsers(companyName),
      searchJobPostings(companyName),
    ]);

  if (reviewsResult.status === 'fulfilled' && reviewsResult.value.length) {
    sources.push('review_sites');
    allSignals.push(...reviewsResult.value);
  }

  if (testimonialsResult.status === 'fulfilled' && testimonialsResult.value.length) {
    sources.push('testimonials');
    allSignals.push(...testimonialsResult.value);
  }

  if (linkedinResult.status === 'fulfilled' && linkedinResult.value.length) {
    sources.push('linkedin');
    allSignals.push(...linkedinResult.value);
  }

  if (forumsResult.status === 'fulfilled' && forumsResult.value.length) {
    sources.push('forums');
    allSignals.push(...forumsResult.value);
  }

  if (jobsResult.status === 'fulfilled' && jobsResult.value.length) {
    sources.push('job_postings');
    allSignals.push(...jobsResult.value);
  }

  // Deduplicate and merge signals by person
  const userMap = new Map<string, Tab3Data['users'][0]>();
  const companiesUsing = new Set<string>();

  allSignals.forEach(signal => {
    // Create a key for deduplication (normalized name + company)
    const key = `${signal.name.toLowerCase().trim()}-${(signal.company || '').toLowerCase().trim()}`;

    if (signal.company) {
      companiesUsing.add(signal.company);
    }

    if (userMap.has(key)) {
      // Add signal to existing user
      const user = userMap.get(key)!;
      user.signals.push({
        type: signal.signalType,
        confidence: signal.confidence,
        snippet: signal.snippet,
        url: signal.url,
        date: signal.date || null,
      });
      // Update confidence score (diminishing returns formula)
      user.confidence_score = calculateConfidence(user.signals);
      // Update linkedin if found
      if (signal.linkedin_url && !user.linkedin_url) {
        user.linkedin_url = signal.linkedin_url;
      }
    } else {
      // Create new user
      userMap.set(key, {
        id: uuidv4(),
        name: signal.name,
        title: signal.title || null,
        company: signal.company || null,
        confidence_score: signal.confidence,
        signals: [{
          type: signal.signalType,
          confidence: signal.confidence,
          snippet: signal.snippet,
          url: signal.url,
          date: signal.date || null,
        }],
        linkedin_url: signal.linkedin_url || null,
        email: null,
      });
    }
  });

  // Convert to array and sort by confidence
  const users = Array.from(userMap.values())
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 100);

  return {
    data: {
      users,
      companies_using: Array.from(companiesUsing).slice(0, 50),
      total_signals_found: allSignals.length,
    },
    sources,
  };
}

// Calculate compound confidence from multiple signals
function calculateConfidence(signals: Tab3Data['users'][0]['signals']): number {
  const SIGNAL_WEIGHTS: Record<SignalType, number> = {
    g2_review: 0.95,
    capterra_review: 0.90,
    trustradius_review: 0.90,
    testimonial: 0.85,
    linkedin_post: 0.85,
    twitter_mention: 0.75,
    reddit_post: 0.70,
    forum_post: 0.70,
    github_issue: 0.75,
    stackoverflow: 0.70,
    job_posting_inference: 0.50,
  };

  // Sort by weight descending
  const sortedSignals = [...signals].sort(
    (a, b) => SIGNAL_WEIGHTS[b.type] - SIGNAL_WEIGHTS[a.type]
  );

  // Compound with diminishing returns
  let total = 0;
  sortedSignals.forEach((signal, index) => {
    const weight = SIGNAL_WEIGHTS[signal.type];
    const diminishingFactor = Math.pow(0.7, index);
    total = total + (1 - total) * weight * diminishingFactor;
  });

  return Math.min(total, 0.99);
}
