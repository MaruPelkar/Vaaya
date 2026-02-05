import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface PricingResult {
  markdown: string;
  metadata?: Record<string, string>;
}

/**
 * Scrape the company pricing page
 */
export async function scrapePricingPage(domain: string): Promise<PricingResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Summary/Pricing] Scraping pricing page: ${urls.pricing}`);

  const result = await scrapeUrl(urls.pricing, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success) {
    // Try alternative pricing paths
    const alternativePaths = ['/plans', '/price', '/packages', '/buy', '/subscription'];
    for (const path of alternativePaths) {
      const altUrl = `https://${domain}${path}`;
      console.log(`[Summary/Pricing] Trying alternative: ${altUrl}`);
      const altResult = await scrapeUrl(altUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });
      if (altResult.success && altResult.markdown) {
        console.log(`[Summary/Pricing] Found pricing at ${altUrl}`);
        return {
          markdown: altResult.markdown,
          metadata: altResult.metadata as Record<string, string> | undefined,
        };
      }
    }
    console.warn(`[Summary/Pricing] Could not find pricing page for ${domain}`);
    return null;
  }

  if (!result.markdown) {
    console.warn(`[Summary/Pricing] No markdown content from pricing page`);
    return null;
  }

  console.log(`[Summary/Pricing] Successfully scraped pricing (${result.markdown.length} chars)`);

  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
  };
}
