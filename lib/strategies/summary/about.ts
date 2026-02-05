import { scrapeUrl, buildCommonUrls } from '@/lib/firecrawl';

export interface AboutResult {
  markdown: string;
  metadata?: Record<string, string>;
}

/**
 * Scrape the company about page for company information
 */
export async function scrapeAboutPage(domain: string): Promise<AboutResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Summary/About] Scraping about page: ${urls.about}`);

  const result = await scrapeUrl(urls.about, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success) {
    // Try alternative about paths
    const alternativePaths = ['/about-us', '/company', '/team', '/our-story', '/who-we-are'];
    for (const path of alternativePaths) {
      const altUrl = `https://${domain}${path}`;
      console.log(`[Summary/About] Trying alternative: ${altUrl}`);
      const altResult = await scrapeUrl(altUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });
      if (altResult.success && altResult.markdown) {
        console.log(`[Summary/About] Found about page at ${altUrl}`);
        return {
          markdown: altResult.markdown,
          metadata: altResult.metadata as Record<string, string> | undefined,
        };
      }
    }
    console.warn(`[Summary/About] Could not find about page for ${domain}`);
    return null;
  }

  if (!result.markdown) {
    console.warn(`[Summary/About] No markdown content from about page`);
    return null;
  }

  console.log(`[Summary/About] Successfully scraped about page (${result.markdown.length} chars)`);

  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
  };
}

/**
 * Scrape the careers page for hiring signals
 */
export async function scrapeCareersPage(domain: string): Promise<AboutResult | null> {
  const urls = buildCommonUrls(domain);

  console.log(`[Summary/About] Scraping careers page: ${urls.careers}`);

  const result = await scrapeUrl(urls.careers, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!result.success) {
    // Try alternative careers paths
    const alternativePaths = ['/jobs', '/join', '/join-us', '/work-with-us', '/opportunities'];
    for (const path of alternativePaths) {
      const altUrl = `https://${domain}${path}`;
      const altResult = await scrapeUrl(altUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });
      if (altResult.success && altResult.markdown) {
        return {
          markdown: altResult.markdown,
          metadata: altResult.metadata as Record<string, string> | undefined,
        };
      }
    }
    return null;
  }

  if (!result.markdown) {
    return null;
  }

  return {
    markdown: result.markdown,
    metadata: result.metadata as Record<string, string> | undefined,
  };
}
