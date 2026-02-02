import { Tab1Data } from '@/lib/types';
import { getPerplexitySummary } from './perplexity';
import { scrapeWebsite } from './website';

export async function executeTab1Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab1Data; sources: string[] }> {
  const sources: string[] = [];

  // Run strategies in parallel
  const [perplexityResult, websiteResult] = await Promise.allSettled([
    getPerplexitySummary(companyName, domain),
    scrapeWebsite(domain),
  ]);

  // Initialize with defaults
  let data: Tab1Data = {
    description: '',
    founded: null,
    headquarters: null,
    employee_range: null,
    industry: null,
    funding: {
      total: null,
      last_round: null,
      last_round_date: null,
      investors: [],
    },
    leadership: [],
    socials: {
      twitter: null,
      linkedin: null,
      github: null,
    },
    website: `https://${domain}`,
  };

  // Merge Perplexity data
  if (perplexityResult.status === 'fulfilled' && perplexityResult.value) {
    sources.push('perplexity');
    const pr = perplexityResult.value;
    if (pr.description) data.description = pr.description;
    if (pr.founded) data.founded = pr.founded;
    if (pr.headquarters) data.headquarters = pr.headquarters;
    if (pr.employee_range) data.employee_range = pr.employee_range;
    if (pr.industry) data.industry = pr.industry;
    if (pr.funding) data.funding = { ...data.funding, ...pr.funding };
    if (pr.leadership?.length) data.leadership = pr.leadership;
    if (pr.socials) data.socials = { ...data.socials, ...pr.socials };
  }

  // Merge website scrape data (leadership)
  if (websiteResult.status === 'fulfilled' && websiteResult.value) {
    sources.push('website');
    const ws = websiteResult.value;
    if (ws.leadership?.length) data.leadership = ws.leadership;
  }

  return { data, sources };
}
