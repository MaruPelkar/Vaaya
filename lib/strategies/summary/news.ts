import { searchWeb } from '@/lib/firecrawl';
import { searchAndAnalyze, structureContent } from '@/lib/openai';

export interface NewsItem {
  title: string;
  snippet: string;
  date: string;
  url: string;
}

/**
 * Search for recent news and updates about the company
 */
export async function searchRecentNews(
  companyName: string,
  domain: string
): Promise<NewsItem[] | null> {
  console.log(`[Summary/News] Searching for recent news about ${companyName}`);

  // Try Firecrawl search first
  const searchQuery = `"${companyName}" OR site:${domain} news announcement launch funding`;
  const searchResult = await searchWeb(searchQuery, {
    limit: 10,
    scrapeResults: false,
  });

  if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
    console.log(`[Summary/News] Found ${searchResult.data.length} results via Firecrawl`);

    // Structure the results
    const newsItems: NewsItem[] = searchResult.data.map((item) => ({
      title: item.title,
      snippet: item.description,
      date: extractDateFromContent(item.title + ' ' + item.description) || 'Recent',
      url: item.url,
    }));

    return newsItems;
  }

  // Fallback to OpenAI web search
  console.log(`[Summary/News] Trying OpenAI web search for ${companyName}`);

  try {
    const analysisPrompt = `Search for recent news about ${companyName} (${domain}) from the last 90 days.
    Look for:
    - Product launches and updates
    - Funding announcements
    - Partnerships and integrations
    - Pricing changes
    - Leadership changes
    - Acquisitions`;

    const newsSchema = {
      type: 'object',
      properties: {
        news_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              snippet: { type: 'string' },
              date: { type: 'string' },
              url: { type: 'string' },
            },
            required: ['title', 'snippet', 'date', 'url'],
            additionalProperties: false,
          },
        },
      },
      required: ['news_items'],
      additionalProperties: false,
    };

    const result = await searchAndAnalyze<{ news_items: NewsItem[] }>(
      `${companyName} ${domain} recent news updates 2024 2025`,
      analysisPrompt,
      newsSchema
    );

    if (result && result.news_items && result.news_items.length > 0) {
      console.log(`[Summary/News] Found ${result.news_items.length} news items via OpenAI`);
      return result.news_items;
    }
  } catch (error) {
    console.error(`[Summary/News] OpenAI search failed:`, error);
  }

  console.warn(`[Summary/News] No news found for ${companyName}`);
  return null;
}

/**
 * Extract a date from text content using common patterns
 */
function extractDateFromContent(content: string): string | null {
  // Common date patterns
  const patterns = [
    // "January 15, 2024" or "Jan 15, 2024"
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i,
    // "15 January 2024"
    /\b\d{1,2}\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/i,
    // "2024-01-15"
    /\b\d{4}-\d{2}-\d{2}\b/,
    // "01/15/2024"
    /\b\d{2}\/\d{2}\/\d{4}\b/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}
