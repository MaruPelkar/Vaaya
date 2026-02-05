import { searchWeb } from '@/lib/firecrawl';

export interface CompetitorResult {
  competitors: Array<{
    title: string;
    description: string;
    url: string;
  }>;
  alternatives: Array<{
    title: string;
    description: string;
    url: string;
  }>;
}

/**
 * Search for competitor information
 */
export async function searchCompetitors(companyName: string): Promise<CompetitorResult | null> {
  console.log(`[Business/Competitors] Searching for competitors of ${companyName}`);

  // Search for competitors
  const competitorSearch = await searchWeb(`${companyName} competitors comparison`, {
    limit: 5,
    scrapeResults: false,
  });

  // Search for alternatives
  const alternativeSearch = await searchWeb(`${companyName} alternatives`, {
    limit: 5,
    scrapeResults: false,
  });

  const competitors: Array<{ title: string; description: string; url: string }> = [];
  const alternatives: Array<{ title: string; description: string; url: string }> = [];

  if (competitorSearch.success && competitorSearch.data) {
    for (const item of competitorSearch.data) {
      competitors.push({
        title: item.title,
        description: item.description,
        url: item.url,
      });
    }
    console.log(`[Business/Competitors] Found ${competitors.length} competitor search results`);
  }

  if (alternativeSearch.success && alternativeSearch.data) {
    for (const item of alternativeSearch.data) {
      alternatives.push({
        title: item.title,
        description: item.description,
        url: item.url,
      });
    }
    console.log(`[Business/Competitors] Found ${alternatives.length} alternative search results`);
  }

  if (competitors.length === 0 && alternatives.length === 0) {
    console.log(`[Business/Competitors] No competitor information found for ${companyName}`);
    return null;
  }

  return { competitors, alternatives };
}
