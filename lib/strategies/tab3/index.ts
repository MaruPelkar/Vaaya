import { Tab3Data, RawSignal } from '@/lib/types';
import { collectReviewSignals } from './collectors/reviews';
import { collectLinkedInSignals } from './collectors/linkedin';
import { collectTwitterSignals } from './collectors/twitter';
import { collectTestimonialSignals } from './collectors/testimonials';
import { collectGitHubSignals } from './collectors/github';
import { collectForumSignals } from './collectors/forums';
import { collectJobSignals } from './collectors/jobs';
import { collectCustomerSignals } from './collectors/customers';
import { resolveEntities } from './resolution';

export async function executeTab3Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab3Data; sources: string[] }> {
  const startTime = Date.now();

  console.log('[Tab3] Starting User Discovery Engine...');

  // Run all collectors in parallel
  const results = await Promise.allSettled([
    collectReviewSignals(companyName),
    collectLinkedInSignals(companyName),
    collectTwitterSignals(companyName),
    collectTestimonialSignals(companyName, domain),
    collectGitHubSignals(companyName),
    collectForumSignals(companyName),
    collectJobSignals(companyName),
    collectCustomerSignals(companyName, domain),
  ]);

  // Gather successful signals
  let allSignals: RawSignal[] = [];
  const sourcesSearched: string[] = [];

  const collectors = [
    'reviews',
    'linkedin',
    'twitter',
    'testimonials',
    'github',
    'forums',
    'jobs',
    'customers',
  ];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
      allSignals = allSignals.concat(result.value);
      sourcesSearched.push(collectors[i]);
      console.log(`[Tab3] ${collectors[i]}: ${result.value.length} signals`);
    } else if (result.status === 'rejected') {
      console.error(`[Tab3] ${collectors[i]} failed:`, result.reason);
    }
  });

  console.log(`[Tab3] Total raw signals: ${allSignals.length}`);

  // Resolve entities (dedupe and merge)
  const users = resolveEntities(allSignals);

  console.log(`[Tab3] Resolved to ${users.length} unique users`);

  // Extract companies identified (from Tier 3 inferred signals)
  const companiesMap = new Map<string, { source: string; count: number }>();
  for (const signal of allSignals) {
    const company = signal.extracted_company || signal.metadata?.inferred_company;
    if (company && typeof company === 'string') {
      const existing = companiesMap.get(company);
      if (existing) {
        existing.count++;
      } else {
        companiesMap.set(company, { source: signal.source, count: 1 });
      }
    }
  }

  // Calculate confidence buckets
  const highConfidence = users.filter(u => u.confidence_score >= 70).length;
  const mediumConfidence = users.filter(u => u.confidence_score >= 40 && u.confidence_score < 70).length;
  const lowConfidence = users.filter(u => u.confidence_score < 40).length;

  const data: Tab3Data = {
    summary: {
      total_users_found: users.length,
      high_confidence_count: highConfidence,
      medium_confidence_count: mediumConfidence,
      low_confidence_count: lowConfidence,
      signals_collected: allSignals.length,
      sources_searched: sourcesSearched,
    },
    users,
    companies_identified: Array.from(companiesMap.entries())
      .map(([name, data]) => ({
        name,
        source: data.source,
        signals: data.count,
      }))
      .sort((a, b) => b.signals - a.signals)
      .slice(0, 50),
    collected_at: new Date().toISOString(),
    collection_time_ms: Date.now() - startTime,
  };

  console.log(`[Tab3] Complete in ${data.collection_time_ms}ms. Sources: ${sourcesSearched.join(', ')}`);

  return { data, sources: sourcesSearched };
}
