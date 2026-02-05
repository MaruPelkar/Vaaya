import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface FeaturesResult {
  markdown: string;
  metadata?: Record<string, string>;
  source: string;
}

/**
 * Scrape the features page for product information
 */
export async function scrapeFeaturesPage(domain: string): Promise<FeaturesResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Product/Features] Scraping features page: ${urls.features}`);

  const result = await scrapeUrl(urls.features, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (result.success && result.markdown) {
    console.log(`[Product/Features] Successfully scraped features (${result.markdown.length} chars)`);
    return {
      markdown: result.markdown,
      metadata: result.metadata as Record<string, string> | undefined,
      source: urls.features,
    };
  }

  // Try alternative paths
  const alternativePaths = ['/product', '/solutions', '/platform', '/capabilities', '/use-cases'];
  for (const path of alternativePaths) {
    const altUrl = `https://${domain}${path}`;
    console.log(`[Product/Features] Trying alternative: ${altUrl}`);
    const altResult = await scrapeUrl(altUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    if (altResult.success && altResult.markdown) {
      console.log(`[Product/Features] Found features at ${altUrl} (${altResult.markdown.length} chars)`);
      return {
        markdown: altResult.markdown,
        metadata: altResult.metadata as Record<string, string> | undefined,
        source: altUrl,
      };
    }
  }

  console.log(`[Product/Features] Could not find features page for ${domain}`);
  return null;
}

/**
 * Scrape the homepage for product information (fallback)
 */
export async function scrapeHomepageForProduct(domain: string): Promise<FeaturesResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Product/Features] Scraping homepage for product info: ${urls.homepage}`);

  const result = await scrapeUrl(urls.homepage, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success || !result.markdown) {
    console.log(`[Product/Features] Failed to scrape homepage`);
    return null;
  }

  console.log(`[Product/Features] Successfully scraped homepage (${result.markdown.length} chars)`);
  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
    source: urls.homepage,
  };
}
