import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface PricingResult {
  markdown: string;
  metadata?: Record<string, string>;
  source: string;
}

/**
 * Scrape the pricing page for plan and pricing information
 */
export async function scrapePricingPage(domain: string): Promise<PricingResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Business/Pricing] Scraping pricing page: ${urls.pricing}`);

  const result = await scrapeUrl(urls.pricing, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (result.success && result.markdown) {
    console.log(`[Business/Pricing] Successfully scraped pricing (${result.markdown.length} chars)`);
    return {
      markdown: result.markdown,
      metadata: result.metadata as Record<string, string> | undefined,
      source: urls.pricing,
    };
  }

  // Try alternative paths
  const alternativePaths = ['/plans', '/price', '/packages', '/buy', '/subscription', '/upgrade'];
  for (const path of alternativePaths) {
    const altUrl = `https://${domain}${path}`;
    console.log(`[Business/Pricing] Trying alternative: ${altUrl}`);
    const altResult = await scrapeUrl(altUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    if (altResult.success && altResult.markdown) {
      console.log(`[Business/Pricing] Found pricing at ${altUrl} (${altResult.markdown.length} chars)`);
      return {
        markdown: altResult.markdown,
        metadata: altResult.metadata as Record<string, string> | undefined,
        source: altUrl,
      };
    }
  }

  console.log(`[Business/Pricing] Could not find pricing page for ${domain}`);
  return null;
}
