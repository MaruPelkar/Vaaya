import { DashboardData, getEmptyDashboardData } from '@/lib/types';
import { scrapeUrl, searchWeb, buildCommonUrls, ScrapeResult, SearchResult } from '@/lib/firecrawl';
import { structureContent } from '@/lib/openai';
import { DASHBOARD_JSON_SCHEMA, DASHBOARD_SYSTEM_PROMPT } from './schemas';

interface DashboardStrategyResult {
  data: DashboardData;
  sources: string[];
}

/**
 * Execute all Dashboard tab strategies in parallel and merge results
 */
export async function executeDashboardStrategies(
  domain: string,
  companyName: string
): Promise<DashboardStrategyResult> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[Dashboard] Starting data collection for ${companyName} (${domain})`);

  const urls = buildCommonUrls(domain);

  // Run all scrapers and searches in parallel
  const [
    homepageResult,
    pricingResult,
    featuresResult,
    integrationsResult,
    aboutResult,
    careersResult,
    competitorSearchResult,
    reviewSearchResult,
    newsSearchResult,
  ] = await Promise.allSettled([
    // Scrape key pages
    scrapeUrl(urls.homepage),
    scrapeUrl(urls.pricing),
    scrapeUrl(urls.features),
    scrapeUrl(urls.integrations),
    scrapeUrl(urls.about),
    scrapeUrl(urls.careers),
    // Web searches for additional context
    searchWeb(`${companyName} competitors vs alternatives`, { limit: 5 }),
    searchWeb(`${companyName} reviews G2 Capterra customer feedback`, { limit: 5 }),
    searchWeb(`${companyName} news funding 2024 2025`, { limit: 5 }),
  ]);

  // Aggregate scraped content
  const aggregatedContent = buildAggregatedContent(
    companyName,
    domain,
    {
      homepage: extractResult(homepageResult),
      pricing: extractResult(pricingResult),
      features: extractResult(featuresResult),
      integrations: extractResult(integrationsResult),
      about: extractResult(aboutResult),
      careers: extractResult(careersResult),
    },
    {
      competitors: extractSearchResult(competitorSearchResult),
      reviews: extractSearchResult(reviewSearchResult),
      news: extractSearchResult(newsSearchResult),
    },
    sources
  );

  console.log(`[Dashboard] Scraped ${sources.length} sources, structuring with AI...`);

  // If no sources were successfully scraped, return empty data to avoid hallucination
  if (sources.length === 0) {
    console.log(`[Dashboard] No sources available - returning empty data to prevent hallucination`);
    const elapsed = Date.now() - startTime;
    console.log(`[Dashboard] Completed in ${elapsed}ms`);
    return { data: getEmptyDashboardData(), sources };
  }

  // Use OpenAI to structure into DashboardData
  const dashboardData = await structureContent<DashboardData>(
    aggregatedContent,
    DASHBOARD_SYSTEM_PROMPT,
    DASHBOARD_JSON_SCHEMA,
    { maxTokens: 8000 }
  );

  const elapsed = Date.now() - startTime;
  console.log(`[Dashboard] Completed in ${elapsed}ms`);

  if (dashboardData) {
    dashboardData.generated_at = new Date().toISOString();
    return { data: dashboardData, sources };
  }

  return { data: getEmptyDashboardData(), sources };
}

function extractResult(
  result: PromiseSettledResult<ScrapeResult>
): ScrapeResult | null {
  if (result.status === 'fulfilled' && result.value.success) {
    return result.value;
  }
  return null;
}

function extractSearchResult(
  result: PromiseSettledResult<SearchResult>
): SearchResult | null {
  if (result.status === 'fulfilled' && result.value.success) {
    return result.value;
  }
  return null;
}

function buildAggregatedContent(
  companyName: string,
  domain: string,
  scraped: {
    homepage: ScrapeResult | null;
    pricing: ScrapeResult | null;
    features: ScrapeResult | null;
    integrations: ScrapeResult | null;
    about: ScrapeResult | null;
    careers: ScrapeResult | null;
  },
  searched: {
    competitors: SearchResult | null;
    reviews: SearchResult | null;
    news: SearchResult | null;
  },
  sources: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Company Analysis: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push(`Analysis Date: ${new Date().toISOString().split('T')[0]}`);
  sections.push('');

  // Homepage content
  if (scraped.homepage?.markdown) {
    sources.push('homepage');
    sections.push('## Homepage Content');
    if (scraped.homepage.metadata?.title) {
      sections.push(`Title: ${scraped.homepage.metadata.title}`);
    }
    if (scraped.homepage.metadata?.description) {
      sections.push(`Description: ${scraped.homepage.metadata.description}`);
    }
    sections.push('');
    sections.push(truncateContent(scraped.homepage.markdown, 6000));
    sections.push('');
  }

  // Pricing page content
  if (scraped.pricing?.markdown) {
    sources.push('pricing');
    sections.push('## Pricing Page Content');
    sections.push(truncateContent(scraped.pricing.markdown, 5000));
    sections.push('');
  }

  // Features page content
  if (scraped.features?.markdown) {
    sources.push('features');
    sections.push('## Features Page Content');
    sections.push(truncateContent(scraped.features.markdown, 4000));
    sections.push('');
  }

  // Integrations page content
  if (scraped.integrations?.markdown) {
    sources.push('integrations');
    sections.push('## Integrations Page Content');
    sections.push(truncateContent(scraped.integrations.markdown, 3000));
    sections.push('');
  }

  // About page content
  if (scraped.about?.markdown) {
    sources.push('about');
    sections.push('## About Page Content');
    sections.push(truncateContent(scraped.about.markdown, 2000));
    sections.push('');
  }

  // Careers page content (for hiring signals)
  if (scraped.careers?.markdown) {
    sources.push('careers');
    sections.push('## Careers Page Content');
    sections.push(truncateContent(scraped.careers.markdown, 2000));
    sections.push('');
  }

  // Competitor search results
  if (searched.competitors?.data && searched.competitors.data.length > 0) {
    sources.push('competitor_search');
    sections.push('## Competitor Research');
    for (const item of searched.competitors.data.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(item.description);
      if (item.markdown) {
        sections.push(truncateContent(item.markdown, 1000));
      }
      sections.push('');
    }
  }

  // Review search results
  if (searched.reviews?.data && searched.reviews.data.length > 0) {
    sources.push('review_search');
    sections.push('## Customer Reviews & Feedback');
    for (const item of searched.reviews.data.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(item.description);
      if (item.markdown) {
        sections.push(truncateContent(item.markdown, 1000));
      }
      sections.push('');
    }
  }

  // News search results
  if (searched.news?.data && searched.news.data.length > 0) {
    sources.push('news_search');
    sections.push('## Recent News & Updates');
    for (const item of searched.news.data.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(item.description);
      sections.push('');
    }
  }

  return sections.join('\n');
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}
