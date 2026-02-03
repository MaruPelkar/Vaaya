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

    // Company Status
    status: null,
    acquired_by: null,
    acquisition_date: null,
    ipo_date: null,
    stock_symbol: null,

    // Funding
    funding: {
      total: null,
      last_round: null,
      last_round_date: null,
      investors: [],
    },
    funding_rounds: [],

    // Employee Trend
    employee_count: null,
    employee_trend: [],
    employee_growth_rate: null,

    // Acquisitions & Competitors
    acquisitions: [],
    competitors: [],

    // Leadership & Socials
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

    // Basic info
    if (pr.description) data.description = pr.description;
    if (pr.founded) data.founded = pr.founded;
    if (pr.headquarters) data.headquarters = pr.headquarters;
    if (pr.employee_range) data.employee_range = pr.employee_range;
    if (pr.industry) data.industry = pr.industry;

    // Company Status
    if (pr.status) data.status = pr.status;
    if (pr.acquired_by) data.acquired_by = pr.acquired_by;
    if (pr.acquisition_date) data.acquisition_date = pr.acquisition_date;
    if (pr.ipo_date) data.ipo_date = pr.ipo_date;
    if (pr.stock_symbol) data.stock_symbol = pr.stock_symbol;

    // Funding
    if (pr.funding) data.funding = { ...data.funding, ...pr.funding };
    if (pr.funding_rounds?.length) data.funding_rounds = pr.funding_rounds;

    // Employee Trend
    if (pr.employee_count) data.employee_count = pr.employee_count;
    if (pr.employee_trend?.length) data.employee_trend = pr.employee_trend;
    if (pr.employee_growth_rate) data.employee_growth_rate = pr.employee_growth_rate;

    // Acquisitions & Competitors
    if (pr.acquisitions?.length) data.acquisitions = pr.acquisitions;
    if (pr.competitors?.length) data.competitors = pr.competitors;

    // Leadership & Socials
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
