import { BusinessData, getEmptyBusinessData } from '@/lib/types';
import { scrapePricingPage } from './pricing';
import { searchCompetitors } from './competitors';
import { searchFundingInfo } from './funding';
import { searchTimelineEvents } from './timeline';
import { structureContent } from '@/lib/openai';

/**
 * Execute all Business tab strategies in parallel and merge results
 */
export async function executeBusinessStrategies(
  domain: string,
  companyName: string
): Promise<{ data: BusinessData; sources: string[] }> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[Business] Starting data collection for ${companyName} (${domain})`);

  // Run all scrapers/searches in parallel
  const [pricingResult, competitorsResult, fundingResult, timelineResult] = await Promise.allSettled([
    scrapePricingPage(domain),
    searchCompetitors(companyName),
    searchFundingInfo(companyName, domain),
    searchTimelineEvents(companyName),
  ]);

  // Aggregate scraped content
  const aggregatedContent = buildAggregatedContent(
    pricingResult,
    competitorsResult,
    fundingResult,
    timelineResult,
    companyName,
    domain,
    sources
  );

  console.log(`[Business] Gathered ${sources.length} sources, structuring with AI...`);

  // Use OpenAI to structure into BusinessData
  const businessData = await structureContent<BusinessData>(
    aggregatedContent,
    BUSINESS_SYSTEM_PROMPT,
    BUSINESS_JSON_SCHEMA
  );

  const elapsed = Date.now() - startTime;
  console.log(`[Business] Completed in ${elapsed}ms`);

  if (businessData) {
    businessData.generated_at = new Date().toISOString();
    return { data: businessData, sources };
  }

  return { data: getEmptyBusinessData(), sources };
}

function buildAggregatedContent(
  pricingResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string } | null>,
  competitorsResult: PromiseSettledResult<{ competitors: Array<{ title: string; description: string; url: string }>; alternatives: Array<{ title: string; description: string; url: string }> } | null>,
  fundingResult: PromiseSettledResult<{ searchResults: Array<{ title: string; description: string; url: string }>; careersContent?: string; careersUrl?: string } | null>,
  timelineResult: PromiseSettledResult<{ newsItems: Array<{ title: string; description: string; url: string; date?: string }> } | null>,
  companyName: string,
  domain: string,
  sources: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Business Analysis: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push('');

  // Pricing page content
  if (pricingResult.status === 'fulfilled' && pricingResult.value) {
    sources.push('pricing');
    sections.push('## Pricing Page Content');
    sections.push(`Source: ${pricingResult.value.source}`);
    sections.push('');
    sections.push(truncateContent(pricingResult.value.markdown, 10000));
    sections.push('');
  }

  // Competitor information
  if (competitorsResult.status === 'fulfilled' && competitorsResult.value) {
    sources.push('competitors');
    sections.push('## Competitor Search Results');
    sections.push('');
    sections.push('### Direct Competitors:');
    for (const comp of competitorsResult.value.competitors) {
      sections.push(`- **${comp.title}**`);
      sections.push(`  ${comp.description}`);
      sections.push(`  URL: ${comp.url}`);
    }
    sections.push('');
    sections.push('### Alternatives:');
    for (const alt of competitorsResult.value.alternatives) {
      sections.push(`- **${alt.title}**`);
      sections.push(`  ${alt.description}`);
      sections.push(`  URL: ${alt.url}`);
    }
    sections.push('');
  }

  // Funding information
  if (fundingResult.status === 'fulfilled' && fundingResult.value) {
    sources.push('funding');
    sections.push('## Funding & Investment Search Results');
    sections.push('');
    for (const item of fundingResult.value.searchResults) {
      sections.push(`- **${item.title}**`);
      sections.push(`  ${item.description}`);
    }
    sections.push('');

    if (fundingResult.value.careersContent) {
      sources.push('careers');
      sections.push('## Careers Page Content');
      sections.push(`Source: ${fundingResult.value.careersUrl}`);
      sections.push('');
      sections.push(truncateContent(fundingResult.value.careersContent, 4000));
      sections.push('');
    }
  }

  // Timeline events
  if (timelineResult.status === 'fulfilled' && timelineResult.value) {
    sources.push('news');
    sections.push('## Recent News & Events');
    sections.push('');
    for (const item of timelineResult.value.newsItems) {
      sections.push(`- **${item.title}**`);
      sections.push(`  ${item.description}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}

const BUSINESS_SYSTEM_PROMPT = `You are a B2B SaaS business analyst creating a business intelligence report for a company.

Extract and structure information from the provided content into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use null or empty arrays
- Infer reasonable values when there are strong contextual clues

Pricing:
- Extract all pricing plans with their prices, features, and limits
- Identify enterprise tier features and gates
- Note trial information if available

Competitive:
- Identify direct competitors (same core function)
- Identify alternatives (different approach to same problem)
- Extract key differentiators from competitive content
- Write a brief competitive positioning statement

Traction:
- Extract funding information (total raised, last round, investors)
- Analyze hiring signals from careers page (open roles, growth areas)
- Note any notable customers mentioned
- Count case studies or testimonials if mentioned

Timeline:
- Create timeline events from news items
- Classify each event by type (pricing_change, product_launch, funding, acquisition, leadership, partnership, repositioning)
- Include source attribution`;

const BUSINESS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    pricing: {
      type: 'object',
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: ['string', 'null'] },
              billing_cycle: { type: ['string', 'null'], enum: ['monthly', 'annual', 'custom', null] },
              limits: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    value: { type: 'string' },
                  },
                  required: ['name', 'value'],
                  additionalProperties: false,
                },
              },
              key_features: { type: 'array', items: { type: 'string' } },
              target_audience: { type: ['string', 'null'] },
            },
            required: ['name', 'price', 'billing_cycle', 'limits', 'key_features', 'target_audience'],
            additionalProperties: false,
          },
        },
        enterprise_info: {
          type: 'object',
          properties: {
            has_enterprise: { type: 'boolean' },
            contact_sales: { type: 'boolean' },
            known_features: { type: 'array', items: { type: 'string' } },
          },
          required: ['has_enterprise', 'contact_sales', 'known_features'],
          additionalProperties: false,
        },
        trial_info: {
          type: 'object',
          properties: {
            has_free_trial: { type: 'boolean' },
            trial_length_days: { type: ['number', 'null'] },
            requires_credit_card: { type: ['boolean', 'null'] },
          },
          required: ['has_free_trial', 'trial_length_days', 'requires_credit_card'],
          additionalProperties: false,
        },
        pricing_page_url: { type: ['string', 'null'] },
      },
      required: ['plans', 'enterprise_info', 'trial_info', 'pricing_page_url'],
      additionalProperties: false,
    },
    competitive: {
      type: 'object',
      properties: {
        direct_competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: ['string', 'null'] },
              description: { type: 'string' },
              positioning: { type: 'string' },
            },
            required: ['name', 'domain', 'description', 'positioning'],
            additionalProperties: false,
          },
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: ['string', 'null'] },
              description: { type: 'string' },
              positioning: { type: 'string' },
            },
            required: ['name', 'domain', 'description', 'positioning'],
            additionalProperties: false,
          },
        },
        differentiators: { type: 'array', items: { type: 'string' } },
        competitive_positioning: { type: 'string' },
      },
      required: ['direct_competitors', 'alternatives', 'differentiators', 'competitive_positioning'],
      additionalProperties: false,
    },
    traction: {
      type: 'object',
      properties: {
        funding: {
          type: 'object',
          properties: {
            total_raised: { type: ['string', 'null'] },
            last_round: { type: ['string', 'null'] },
            last_round_date: { type: ['string', 'null'] },
            last_round_amount: { type: ['string', 'null'] },
            investors: { type: 'array', items: { type: 'string' } },
            valuation: { type: ['string', 'null'] },
          },
          required: ['total_raised', 'last_round', 'last_round_date', 'last_round_amount', 'investors', 'valuation'],
          additionalProperties: false,
        },
        hiring: {
          type: 'object',
          properties: {
            total_open_roles: { type: 'number' },
            velocity: { type: 'string', enum: ['accelerating', 'stable', 'slowing', 'unknown'] },
            key_hires_focus: { type: 'array', items: { type: 'string' } },
            careers_url: { type: ['string', 'null'] },
          },
          required: ['total_open_roles', 'velocity', 'key_hires_focus', 'careers_url'],
          additionalProperties: false,
        },
        web_proxies: {
          type: 'object',
          properties: {
            estimated_traffic: { type: ['string', 'null'] },
            traffic_trend: { type: 'string', enum: ['up', 'stable', 'down', 'unknown'] },
          },
          required: ['estimated_traffic', 'traffic_trend'],
          additionalProperties: false,
        },
        customer_proof: {
          type: 'object',
          properties: {
            notable_customers: { type: 'array', items: { type: 'string' } },
            case_studies_count: { type: 'number' },
            testimonials_count: { type: 'number' },
          },
          required: ['notable_customers', 'case_studies_count', 'testimonials_count'],
          additionalProperties: false,
        },
      },
      required: ['funding', 'hiring', 'web_proxies', 'customer_proof'],
      additionalProperties: false,
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['pricing_change', 'product_launch', 'funding', 'acquisition', 'leadership', 'partnership', 'repositioning'] },
          title: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
          source_url: { type: ['string', 'null'] },
          source_name: { type: 'string' },
        },
        required: ['type', 'title', 'description', 'date', 'source_url', 'source_name'],
        additionalProperties: false,
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          type: { type: 'string', enum: ['official', 'review', 'news', 'social', 'community'] },
          last_accessed: { type: 'string' },
        },
        required: ['name', 'url', 'type', 'last_accessed'],
        additionalProperties: false,
      },
    },
    generated_at: { type: 'string' },
  },
  required: [
    'pricing',
    'competitive',
    'traction',
    'timeline',
    'sources',
    'generated_at',
  ],
  additionalProperties: false,
};
