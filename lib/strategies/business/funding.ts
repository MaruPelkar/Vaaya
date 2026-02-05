import { searchWeb, scrapeUrl } from '@/lib/firecrawl';

export interface FundingResult {
  searchResults: Array<{
    title: string;
    description: string;
    url: string;
  }>;
  careersContent?: string;
  careersUrl?: string;
}

/**
 * Search for funding and traction information
 */
export async function searchFundingInfo(companyName: string, domain: string): Promise<FundingResult | null> {
  console.log(`[Business/Funding] Searching for funding info about ${companyName}`);

  // Search for funding news
  const fundingSearch = await searchWeb(`${companyName} funding round series investment`, {
    limit: 5,
    scrapeResults: false,
  });

  const searchResults: Array<{ title: string; description: string; url: string }> = [];

  if (fundingSearch.success && fundingSearch.data) {
    for (const item of fundingSearch.data) {
      searchResults.push({
        title: item.title,
        description: item.description,
        url: item.url,
      });
    }
    console.log(`[Business/Funding] Found ${searchResults.length} funding search results`);
  }

  // Try to scrape careers page for hiring info
  let careersContent: string | undefined;
  let careersUrl: string | undefined;

  const careersPaths = ['/careers', '/jobs', '/hiring', '/work-with-us', '/join-us'];
  for (const path of careersPaths) {
    const url = `https://${domain}${path}`;
    console.log(`[Business/Funding] Trying careers page: ${url}`);
    const result = await scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    if (result.success && result.markdown) {
      careersContent = result.markdown;
      careersUrl = url;
      console.log(`[Business/Funding] Found careers page at ${url} (${result.markdown.length} chars)`);
      break;
    }
  }

  if (searchResults.length === 0 && !careersContent) {
    console.log(`[Business/Funding] No funding/careers information found for ${companyName}`);
    return null;
  }

  return { searchResults, careersContent, careersUrl };
}
