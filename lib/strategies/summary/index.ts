import { SummaryData, getEmptySummaryData } from '@/lib/types';
import { scrapeWebsiteForSummary } from './website';
import { scrapePricingPage } from './pricing';
import { scrapeAboutPage } from './about';
import { searchRecentNews } from './news';
import { structureContent } from '@/lib/openai';

/**
 * Execute all Summary tab strategies in parallel and merge results
 */
export async function executeSummaryStrategies(
  domain: string,
  companyName: string
): Promise<{ data: SummaryData; sources: string[] }> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[Summary] Starting data collection for ${companyName} (${domain})`);

  // Run all scrapers in parallel
  const [websiteResult, pricingResult, aboutResult, newsResult] = await Promise.allSettled([
    scrapeWebsiteForSummary(domain),
    scrapePricingPage(domain),
    scrapeAboutPage(domain),
    searchRecentNews(companyName, domain),
  ]);

  // Aggregate scraped content
  const aggregatedContent = buildAggregatedContent(
    websiteResult,
    pricingResult,
    aboutResult,
    newsResult,
    companyName,
    domain,
    sources
  );

  console.log(`[Summary] Scraped ${sources.length} sources, structuring with AI...`);

  // Use OpenAI to structure into SummaryData
  const summaryData = await structureContent<SummaryData>(
    aggregatedContent,
    SUMMARY_SYSTEM_PROMPT,
    SUMMARY_JSON_SCHEMA
  );

  const elapsed = Date.now() - startTime;
  console.log(`[Summary] Completed in ${elapsed}ms`);

  if (summaryData) {
    summaryData.generated_at = new Date().toISOString();
    return { data: summaryData, sources };
  }

  return { data: getEmptySummaryData(), sources };
}

function buildAggregatedContent(
  websiteResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string> } | null>,
  pricingResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string> } | null>,
  aboutResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string> } | null>,
  newsResult: PromiseSettledResult<Array<{ title: string; snippet: string; date: string; url: string }> | null>,
  companyName: string,
  domain: string,
  sources: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Company Analysis: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push('');

  // Homepage content
  if (websiteResult.status === 'fulfilled' && websiteResult.value) {
    sources.push('homepage');
    sections.push('## Homepage Content');
    if (websiteResult.value.metadata?.title) {
      sections.push(`Title: ${websiteResult.value.metadata.title}`);
    }
    if (websiteResult.value.metadata?.description) {
      sections.push(`Description: ${websiteResult.value.metadata.description}`);
    }
    sections.push('');
    sections.push(truncateContent(websiteResult.value.markdown, 8000));
    sections.push('');
  }

  // Pricing page content
  if (pricingResult.status === 'fulfilled' && pricingResult.value) {
    sources.push('pricing');
    sections.push('## Pricing Page Content');
    sections.push(truncateContent(pricingResult.value.markdown, 6000));
    sections.push('');
  }

  // About page content
  if (aboutResult.status === 'fulfilled' && aboutResult.value) {
    sources.push('about');
    sections.push('## About Page Content');
    sections.push(truncateContent(aboutResult.value.markdown, 4000));
    sections.push('');
  }

  // Recent news
  if (newsResult.status === 'fulfilled' && newsResult.value && newsResult.value.length > 0) {
    sources.push('news');
    sections.push('## Recent News & Updates');
    for (const item of newsResult.value.slice(0, 10)) {
      sections.push(`- **${item.title}** (${item.date})`);
      sections.push(`  ${item.snippet}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}

const SUMMARY_SYSTEM_PROMPT = `You are a B2B SaaS product analyst creating an executive summary for a company intelligence report.

Extract and structure information from the provided website content, pricing pages, and news into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use null or empty arrays
- one_liner: A single sentence that explains what the company does (like a tagline)
- category_tags: Product categories like "CRM", "Sales Automation", "Developer Tools"
- platforms: Where the product runs (Web, iOS, Android, Desktop, Chrome Extension, etc.)
- icp_chips: Ideal Customer Profile descriptions like "SMB Sales Teams", "Enterprise IT"
- personas: Split into users (people who use it daily) and buyers (people who purchase it)
- why_they_win: Key competitive advantages (3 bullets max)
- where_they_lose: Known weaknesses or gaps (3 bullets max)
- product_map: Main product areas/modules (not individual features)
- pricing_at_glance: Extract pricing model, tiers, and enterprise gates
- signals: Funding stage, headcount if mentioned
- recent_changes: Any product launches, pricing changes, or company news from last 90 days`;

const SUMMARY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    one_liner: { type: 'string', description: 'Single sentence describing what the company does' },
    category_tags: { type: 'array', items: { type: 'string' } },
    platforms: { type: 'array', items: { type: 'string' } },
    icp_chips: { type: 'array', items: { type: 'string' } },
    personas: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              seniority: { type: 'string', enum: ['ic', 'manager', 'director', 'vp', 'c_level'] },
              department: { type: 'string' },
            },
            required: ['title', 'seniority', 'department'],
            additionalProperties: false,
          },
        },
        buyers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              seniority: { type: 'string', enum: ['ic', 'manager', 'director', 'vp', 'c_level'] },
              department: { type: 'string' },
            },
            required: ['title', 'seniority', 'department'],
            additionalProperties: false,
          },
        },
      },
      required: ['users', 'buyers'],
      additionalProperties: false,
    },
    top_use_cases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          persona_fit: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'description', 'persona_fit'],
        additionalProperties: false,
      },
    },
    why_they_win: { type: 'array', items: { type: 'string' } },
    where_they_lose: { type: 'array', items: { type: 'string' } },
    product_map: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          key_features: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'description', 'key_features'],
        additionalProperties: false,
      },
    },
    pricing_at_glance: {
      type: 'object',
      properties: {
        has_free_tier: { type: 'boolean' },
        free_tier_description: { type: ['string', 'null'] },
        starting_price: { type: ['string', 'null'] },
        enterprise_gates: { type: 'array', items: { type: 'string' } },
        pricing_model: { type: 'string', enum: ['per_seat', 'usage_based', 'flat_rate', 'hybrid', 'unknown'] },
      },
      required: ['has_free_tier', 'free_tier_description', 'starting_price', 'enterprise_gates', 'pricing_model'],
      additionalProperties: false,
    },
    signals: {
      type: 'object',
      properties: {
        funding_stage: { type: ['string', 'null'] },
        total_funding: { type: ['string', 'null'] },
        last_funding_date: { type: ['string', 'null'] },
        headcount: { type: ['number', 'null'] },
        headcount_trend: { type: ['string', 'null'], enum: ['growing', 'stable', 'shrinking', null] },
        hiring_mix: {
          type: ['object', 'null'],
          properties: {
            engineering_pct: { type: 'number' },
            sales_pct: { type: 'number' },
            product_pct: { type: 'number' },
            other_pct: { type: 'number' },
          },
          required: ['engineering_pct', 'sales_pct', 'product_pct', 'other_pct'],
          additionalProperties: false,
        },
      },
      required: ['funding_stage', 'total_funding', 'last_funding_date', 'headcount', 'headcount_trend', 'hiring_mix'],
      additionalProperties: false,
    },
    recent_changes: {
      type: 'object',
      properties: {
        thirty_days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['product_launch', 'pricing_change', 'acquisition', 'funding', 'leadership', 'partnership', 'positioning'] },
              title: { type: 'string' },
              date: { type: 'string' },
              source_url: { type: ['string', 'null'] },
            },
            required: ['type', 'title', 'date', 'source_url'],
            additionalProperties: false,
          },
        },
        ninety_days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['product_launch', 'pricing_change', 'acquisition', 'funding', 'leadership', 'partnership', 'positioning'] },
              title: { type: 'string' },
              date: { type: 'string' },
              source_url: { type: ['string', 'null'] },
            },
            required: ['type', 'title', 'date', 'source_url'],
            additionalProperties: false,
          },
        },
      },
      required: ['thirty_days', 'ninety_days'],
      additionalProperties: false,
    },
    generated_at: { type: 'string' },
  },
  required: [
    'one_liner',
    'category_tags',
    'platforms',
    'icp_chips',
    'personas',
    'top_use_cases',
    'why_they_win',
    'where_they_lose',
    'product_map',
    'pricing_at_glance',
    'signals',
    'recent_changes',
    'generated_at',
  ],
  additionalProperties: false,
};
