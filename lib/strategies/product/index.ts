import { ProductData, getEmptyProductData } from '@/lib/types';
import { scrapeFeaturesPage, scrapeHomepageForProduct } from './features';
import { scrapeIntegrationsPage } from './integrations';
import { scrapeDocsPage, scrapeChangelogPage } from './docs';
import { structureContent } from '@/lib/openai';

/**
 * Execute all Product tab strategies in parallel and merge results
 */
export async function executeProductStrategies(
  domain: string,
  companyName: string
): Promise<{ data: ProductData; sources: string[] }> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[Product] Starting data collection for ${companyName} (${domain})`);

  // Run all scrapers in parallel
  const [featuresResult, homepageResult, integrationsResult, docsResult, changelogResult] = await Promise.allSettled([
    scrapeFeaturesPage(domain),
    scrapeHomepageForProduct(domain),
    scrapeIntegrationsPage(domain),
    scrapeDocsPage(domain),
    scrapeChangelogPage(domain),
  ]);

  // Aggregate scraped content
  const aggregatedContent = buildAggregatedContent(
    featuresResult,
    homepageResult,
    integrationsResult,
    docsResult,
    changelogResult,
    companyName,
    domain,
    sources
  );

  console.log(`[Product] Scraped ${sources.length} sources, structuring with AI...`);

  // Use OpenAI to structure into ProductData
  const productData = await structureContent<ProductData>(
    aggregatedContent,
    PRODUCT_SYSTEM_PROMPT,
    PRODUCT_JSON_SCHEMA
  );

  const elapsed = Date.now() - startTime;
  console.log(`[Product] Completed in ${elapsed}ms`);

  if (productData) {
    productData.generated_at = new Date().toISOString();
    return { data: productData, sources };
  }

  return { data: getEmptyProductData(), sources };
}

function buildAggregatedContent(
  featuresResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string } | null>,
  homepageResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string } | null>,
  integrationsResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string } | null>,
  docsResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string; type: string } | null>,
  changelogResult: PromiseSettledResult<{ markdown: string; metadata?: Record<string, string>; source: string; type: string } | null>,
  companyName: string,
  domain: string,
  sources: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Product Analysis: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push('');

  // Features page content (highest priority)
  if (featuresResult.status === 'fulfilled' && featuresResult.value) {
    sources.push('features');
    sections.push('## Features Page Content');
    if (featuresResult.value.metadata?.title) {
      sections.push(`Title: ${featuresResult.value.metadata.title}`);
    }
    sections.push('');
    sections.push(truncateContent(featuresResult.value.markdown, 10000));
    sections.push('');
  }

  // Homepage content (if features page not found or as supplement)
  if (homepageResult.status === 'fulfilled' && homepageResult.value) {
    sources.push('homepage');
    sections.push('## Homepage Content');
    if (homepageResult.value.metadata?.title) {
      sections.push(`Title: ${homepageResult.value.metadata.title}`);
    }
    sections.push('');
    sections.push(truncateContent(homepageResult.value.markdown, 6000));
    sections.push('');
  }

  // Integrations page content
  if (integrationsResult.status === 'fulfilled' && integrationsResult.value) {
    sources.push('integrations');
    sections.push('## Integrations Page Content');
    sections.push(truncateContent(integrationsResult.value.markdown, 8000));
    sections.push('');
  }

  // Docs page content
  if (docsResult.status === 'fulfilled' && docsResult.value) {
    sources.push('docs');
    sections.push('## Documentation / API Content');
    sections.push(truncateContent(docsResult.value.markdown, 4000));
    sections.push('');
  }

  // Changelog content
  if (changelogResult.status === 'fulfilled' && changelogResult.value) {
    sources.push('changelog');
    sections.push('## Changelog / Recent Updates');
    sections.push(truncateContent(changelogResult.value.markdown, 4000));
    sections.push('');
  }

  return sections.join('\n');
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}

const PRODUCT_SYSTEM_PROMPT = `You are a B2B SaaS product analyst creating a detailed product feature map for a company intelligence report.

Extract and structure information from the provided website content into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use null or empty arrays

Feature Classification:
- onboarding: Features for getting started, setup, import, tutorials, templates
- core_action: Main value-delivery features (what users do most)
- collaboration: Team features, sharing, comments, permissions, multiplayer
- reporting: Analytics, dashboards, exports, metrics, insights
- admin: Settings, billing, user management, security, compliance

For each feature:
- name: Clear feature name
- description: 1-2 sentence description of what it does
- personas: Who would use this feature (infer from context)
- plan_gate: Which plan includes this (free, starter, pro, enterprise, or all if unclear)
- feature_area: Logical grouping like "Data Management", "Automation", "Visualization"
- is_new/is_updated: Flag if mentioned in changelog as recent

Personas:
- Extract detailed personas with their jobs-to-be-done and pain points
- Include seniority level and department

Integrations:
- List top integrations with categories (CRM, Communication, Storage, etc.)
- depth: native (built-in), api (requires coding), zapier_only, partner`;

const PRODUCT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    feature_map: {
      type: 'object',
      properties: {
        onboarding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              feature_area: { type: 'string' },
              is_new: { type: 'boolean' },
              is_updated: { type: 'boolean' },
              update_date: { type: ['string', 'null'] },
            },
            required: ['name', 'description', 'personas', 'plan_gate', 'feature_area', 'is_new', 'is_updated', 'update_date'],
            additionalProperties: false,
          },
        },
        core_action: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              feature_area: { type: 'string' },
              is_new: { type: 'boolean' },
              is_updated: { type: 'boolean' },
              update_date: { type: ['string', 'null'] },
            },
            required: ['name', 'description', 'personas', 'plan_gate', 'feature_area', 'is_new', 'is_updated', 'update_date'],
            additionalProperties: false,
          },
        },
        collaboration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              feature_area: { type: 'string' },
              is_new: { type: 'boolean' },
              is_updated: { type: 'boolean' },
              update_date: { type: ['string', 'null'] },
            },
            required: ['name', 'description', 'personas', 'plan_gate', 'feature_area', 'is_new', 'is_updated', 'update_date'],
            additionalProperties: false,
          },
        },
        reporting: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              feature_area: { type: 'string' },
              is_new: { type: 'boolean' },
              is_updated: { type: 'boolean' },
              update_date: { type: ['string', 'null'] },
            },
            required: ['name', 'description', 'personas', 'plan_gate', 'feature_area', 'is_new', 'is_updated', 'update_date'],
            additionalProperties: false,
          },
        },
        admin: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              feature_area: { type: 'string' },
              is_new: { type: 'boolean' },
              is_updated: { type: 'boolean' },
              update_date: { type: ['string', 'null'] },
            },
            required: ['name', 'description', 'personas', 'plan_gate', 'feature_area', 'is_new', 'is_updated', 'update_date'],
            additionalProperties: false,
          },
        },
      },
      required: ['onboarding', 'core_action', 'collaboration', 'reporting', 'admin'],
      additionalProperties: false,
    },
    available_personas: { type: 'array', items: { type: 'string' } },
    available_plan_gates: { type: 'array', items: { type: 'string' } },
    available_feature_areas: { type: 'array', items: { type: 'string' } },
    personas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          seniority: { type: 'string', enum: ['ic', 'manager', 'director', 'vp', 'c_level'] },
          department: { type: 'string' },
          jobs_to_be_done: { type: 'array', items: { type: 'string' } },
          key_features_used: { type: 'array', items: { type: 'string' } },
          pain_points_solved: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'seniority', 'department', 'jobs_to_be_done', 'key_features_used', 'pain_points_solved'],
        additionalProperties: false,
      },
    },
    integrations: {
      type: 'object',
      properties: {
        top_integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              depth: { type: 'string', enum: ['native', 'api', 'zapier_only', 'partner'] },
              description: { type: 'string' },
              logo_url: { type: ['string', 'null'] },
            },
            required: ['name', 'category', 'depth', 'description', 'logo_url'],
            additionalProperties: false,
          },
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              count: { type: 'number' },
            },
            required: ['name', 'count'],
            additionalProperties: false,
          },
        },
        total_count: { type: 'number' },
      },
      required: ['top_integrations', 'categories', 'total_count'],
      additionalProperties: false,
    },
    generated_at: { type: 'string' },
  },
  required: [
    'feature_map',
    'available_personas',
    'available_plan_gates',
    'available_feature_areas',
    'personas',
    'integrations',
    'generated_at',
  ],
  additionalProperties: false,
};
