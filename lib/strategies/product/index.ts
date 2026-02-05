import { ProductData, getEmptyProductData } from '@/lib/types';
import { scrapeUrl, searchWeb, buildCommonUrls, ScrapeResult, SearchResult } from '@/lib/firecrawl';
import { structureContent } from '@/lib/openai';
import { PRODUCT_JSON_SCHEMA, PRODUCT_SYSTEM_PROMPT } from './schemas';

interface ProductStrategyResult {
  data: ProductData;
  sources: string[];
}

/**
 * Execute Product tab strategies - focuses on features, personas, and integrations
 */
export async function executeProductStrategies(
  domain: string,
  companyName: string
): Promise<ProductStrategyResult> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[Product] Starting data collection for ${companyName} (${domain})`);

  const urls = buildCommonUrls(domain);

  // Run scrapers in parallel - focus on product-related pages
  const [
    homepageResult,
    featuresResult,
    pricingResult,
    integrationsResult,
    docsSearchResult,
    useCasesSearchResult,
  ] = await Promise.allSettled([
    scrapeUrl(urls.homepage),
    scrapeUrl(urls.features),
    scrapeUrl(urls.pricing),
    scrapeUrl(urls.integrations),
    searchWeb(`${companyName} documentation features how to`, { limit: 5 }),
    searchWeb(`${companyName} use cases customers workflow`, { limit: 5 }),
  ]);

  // Aggregate content
  const aggregatedContent = buildProductContent(
    companyName,
    domain,
    {
      homepage: extractResult(homepageResult),
      features: extractResult(featuresResult),
      pricing: extractResult(pricingResult),
      integrations: extractResult(integrationsResult),
    },
    {
      docs: extractSearchResult(docsSearchResult),
      useCases: extractSearchResult(useCasesSearchResult),
    },
    sources
  );

  console.log(`[Product] Scraped ${sources.length} sources, structuring with AI...`);

  // If no sources, return empty data
  if (sources.length === 0) {
    console.log(`[Product] No sources available - returning empty data`);
    const elapsed = Date.now() - startTime;
    console.log(`[Product] Completed in ${elapsed}ms`);
    return { data: getEmptyProductData(), sources };
  }

  // Use OpenAI to structure into ProductData
  const productData = await structureContent<ProductData>(
    aggregatedContent,
    PRODUCT_SYSTEM_PROMPT,
    PRODUCT_JSON_SCHEMA,
    { maxTokens: 8000 }
  );

  const elapsed = Date.now() - startTime;
  console.log(`[Product] Completed in ${elapsed}ms`);

  if (productData) {
    productData.generated_at = new Date().toISOString();
    return { data: productData, sources };
  }

  return { data: getEmptyProductData(), sources };
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

function buildProductContent(
  companyName: string,
  domain: string,
  scraped: {
    homepage: ScrapeResult | null;
    features: ScrapeResult | null;
    pricing: ScrapeResult | null;
    integrations: ScrapeResult | null;
  },
  searched: {
    docs: SearchResult | null;
    useCases: SearchResult | null;
  },
  sources: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Product Analysis: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push(`Analysis Date: ${new Date().toISOString().split('T')[0]}`);
  sections.push('');

  // Homepage for positioning context
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
    sections.push(truncateContent(scraped.homepage.markdown, 4000));
    sections.push('');
  }

  // Features page - primary source for feature map
  if (scraped.features?.markdown) {
    sources.push('features');
    sections.push('## Features Page Content');
    sections.push(truncateContent(scraped.features.markdown, 8000));
    sections.push('');
  }

  // Pricing page - for plan gates
  if (scraped.pricing?.markdown) {
    sources.push('pricing');
    sections.push('## Pricing Page Content');
    sections.push(truncateContent(scraped.pricing.markdown, 4000));
    sections.push('');
  }

  // Integrations page
  if (scraped.integrations?.markdown) {
    sources.push('integrations');
    sections.push('## Integrations Page Content');
    sections.push(truncateContent(scraped.integrations.markdown, 5000));
    sections.push('');
  }

  // Documentation search results
  if (searched.docs?.data && searched.docs.data.length > 0) {
    sources.push('docs_search');
    sections.push('## Documentation & Feature Details');
    for (const item of searched.docs.data.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(item.description);
      if (item.markdown) {
        sections.push(truncateContent(item.markdown, 1500));
      }
      sections.push('');
    }
  }

  // Use cases search results - for personas
  if (searched.useCases?.data && searched.useCases.data.length > 0) {
    sources.push('usecases_search');
    sections.push('## Use Cases & Customer Stories');
    for (const item of searched.useCases.data.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(item.description);
      if (item.markdown) {
        sections.push(truncateContent(item.markdown, 1000));
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}
