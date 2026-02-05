import Firecrawl from '@mendable/firecrawl-js';

// Initialize Firecrawl client (using v2 API)
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (!firecrawlApiKey) {
  console.warn('FIRECRAWL_API_KEY is not set. Firecrawl features will be disabled.');
}

const firecrawlClient = firecrawlApiKey ? new Firecrawl({ apiKey: firecrawlApiKey }) : null;

export interface ScrapeResult {
  success: boolean;
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    [key: string]: string | undefined;
  };
  error?: string;
}

export interface SearchResult {
  success: boolean;
  data?: Array<{
    url: string;
    title: string;
    description: string;
    markdown?: string;
  }>;
  error?: string;
}

/**
 * Scrape a single URL and return its content as markdown
 */
export async function scrapeUrl(
  url: string,
  options?: {
    formats?: ('markdown' | 'html' | 'links')[];
    onlyMainContent?: boolean;
    waitFor?: number;
  }
): Promise<ScrapeResult> {
  if (!firecrawlClient) {
    return { success: false, error: 'Firecrawl API key not configured' };
  }

  try {
    // v2 API uses scrape() method and returns Document directly
    const document = await firecrawlClient.scrape(url, {
      formats: options?.formats || ['markdown'],
      onlyMainContent: options?.onlyMainContent ?? true,
      waitFor: options?.waitFor,
    });

    return {
      success: true,
      markdown: document.markdown,
      html: document.html,
      links: document.links,
      metadata: document.metadata as ScrapeResult['metadata'],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Firecrawl scrape error for ${url}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Search the web and optionally scrape results
 */
export async function searchWeb(
  query: string,
  options?: {
    limit?: number;
    scrapeResults?: boolean;
  }
): Promise<SearchResult> {
  if (!firecrawlClient) {
    return { success: false, error: 'Firecrawl API key not configured' };
  }

  try {
    // v2 API returns SearchData with web/news/images arrays
    const searchData = await firecrawlClient.search(query, {
      limit: options?.limit || 5,
      scrapeOptions: options?.scrapeResults
        ? { formats: ['markdown'], onlyMainContent: true }
        : undefined,
    });

    // Extract results from web search results
    const webResults = searchData.web || [];

    return {
      success: true,
      data: webResults.map((item) => ({
        url: 'url' in item ? item.url : '',
        title: 'title' in item ? (item.title || '') : '',
        description: 'description' in item ? (item.description || '') : '',
        markdown: 'markdown' in item ? item.markdown : undefined,
      })),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Firecrawl search error for "${query}":`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Scrape multiple URLs in parallel
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options?: {
    formats?: ('markdown' | 'html' | 'links')[];
    onlyMainContent?: boolean;
  }
): Promise<Map<string, ScrapeResult>> {
  const results = new Map<string, ScrapeResult>();

  const scrapePromises = urls.map(async (url) => {
    const result = await scrapeUrl(url, options);
    results.set(url, result);
  });

  await Promise.allSettled(scrapePromises);

  return results;
}

/**
 * Build common page URLs for a domain
 */
export function buildCommonUrls(domain: string): {
  homepage: string;
  pricing: string;
  about: string;
  features: string;
  integrations: string;
  customers: string;
  careers: string;
} {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const cleanBase = baseUrl.replace(/\/$/, '');

  return {
    homepage: cleanBase,
    pricing: `${cleanBase}/pricing`,
    about: `${cleanBase}/about`,
    features: `${cleanBase}/features`,
    integrations: `${cleanBase}/integrations`,
    customers: `${cleanBase}/customers`,
    careers: `${cleanBase}/careers`,
  };
}

export { firecrawlClient };
