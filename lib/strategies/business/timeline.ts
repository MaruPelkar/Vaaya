import { searchWeb } from '@/lib/firecrawl';

export interface TimelineResult {
  newsItems: Array<{
    title: string;
    description: string;
    url: string;
    date?: string;
  }>;
}

/**
 * Search for recent news and timeline events
 */
export async function searchTimelineEvents(companyName: string): Promise<TimelineResult | null> {
  console.log(`[Business/Timeline] Searching for recent news about ${companyName}`);

  // Search for recent news
  const newsSearch = await searchWeb(`${companyName} news announcement 2024 2025`, {
    limit: 10,
    scrapeResults: false,
  });

  const newsItems: Array<{ title: string; description: string; url: string; date?: string }> = [];

  if (newsSearch.success && newsSearch.data) {
    for (const item of newsSearch.data) {
      newsItems.push({
        title: item.title,
        description: item.description,
        url: item.url,
      });
    }
    console.log(`[Business/Timeline] Found ${newsItems.length} news items`);
  }

  // Search for product launches
  const launchSearch = await searchWeb(`${companyName} product launch feature release`, {
    limit: 5,
    scrapeResults: false,
  });

  if (launchSearch.success && launchSearch.data) {
    for (const item of launchSearch.data) {
      // Avoid duplicates
      if (!newsItems.some(n => n.url === item.url)) {
        newsItems.push({
          title: item.title,
          description: item.description,
          url: item.url,
        });
      }
    }
    console.log(`[Business/Timeline] Added product launch results, total: ${newsItems.length}`);
  }

  if (newsItems.length === 0) {
    console.log(`[Business/Timeline] No timeline events found for ${companyName}`);
    return null;
  }

  return { newsItems };
}
