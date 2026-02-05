import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface WebsiteResult {
  markdown: string;
  metadata?: Record<string, string>;
}

/**
 * Scrape the company homepage for summary information
 */
export async function scrapeWebsiteForSummary(domain: string): Promise<WebsiteResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Summary/Website] Scraping homepage: ${urls.homepage}`);

  const result = await scrapeUrl(urls.homepage, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success) {
    console.error(`[Summary/Website] Failed to scrape ${urls.homepage}:`, result.error);
    return null;
  }

  if (!result.markdown) {
    console.warn(`[Summary/Website] No markdown content from ${urls.homepage}`);
    return null;
  }

  console.log(`[Summary/Website] Successfully scraped homepage (${result.markdown.length} chars)`);

  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
  };
}

/**
 * Scrape the features page if it exists
 */
export async function scrapeFeaturesPage(domain: string): Promise<WebsiteResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Summary/Website] Scraping features page: ${urls.features}`);

  const result = await scrapeUrl(urls.features, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success || !result.markdown) {
    // Try alternative paths
    const alternativePaths = ['/product', '/solutions', '/platform'];
    for (const path of alternativePaths) {
      const altUrl = `https://${domain}${path}`;
      const altResult = await scrapeUrl(altUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });
      if (altResult.success && altResult.markdown) {
        console.log(`[Summary/Website] Found features at ${altUrl}`);
        return {
          markdown: altResult.markdown,
          metadata: altResult.metadata as Record<string, string> | undefined,
        };
      }
    }
    return null;
  }

  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
  };
}
