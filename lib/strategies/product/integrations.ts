import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface IntegrationsResult {
  markdown: string;
  metadata?: Record<string, string>;
  source: string;
}

/**
 * Scrape the integrations page for integration information
 */
export async function scrapeIntegrationsPage(domain: string): Promise<IntegrationsResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Product/Integrations] Scraping integrations page: ${urls.integrations}`);

  const result = await scrapeUrl(urls.integrations, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (result.success && result.markdown) {
    console.log(`[Product/Integrations] Successfully scraped integrations (${result.markdown.length} chars)`);
    return {
      markdown: result.markdown,
      metadata: result.metadata as Record<string, string> | undefined,
      source: urls.integrations,
    };
  }

  // Try alternative paths
  const alternativePaths = ['/apps', '/marketplace', '/connect', '/plugins', '/extensions', '/partners'];
  for (const path of alternativePaths) {
    const altUrl = `https://${domain}${path}`;
    console.log(`[Product/Integrations] Trying alternative: ${altUrl}`);
    const altResult = await scrapeUrl(altUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    if (altResult.success && altResult.markdown) {
      console.log(`[Product/Integrations] Found integrations at ${altUrl} (${altResult.markdown.length} chars)`);
      return {
        markdown: altResult.markdown,
        metadata: altResult.metadata as Record<string, string> | undefined,
        source: altUrl,
      };
    }
  }

  console.log(`[Product/Integrations] Could not find integrations page for ${domain}`);
  return null;
}
