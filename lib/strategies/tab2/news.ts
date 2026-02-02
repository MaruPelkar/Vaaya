import { Tab2Data } from '@/lib/types';

interface NewsItem {
  press: Tab2Data['press_mentions'][0];
  mention?: Tab2Data['raw_mentions'][0];
}

export async function searchNews(companyName: string): Promise<NewsItem[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const items: NewsItem[] = [];

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (announces OR launches OR raises OR partners OR releases OR funding)`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();

    data.results?.forEach((result: { url: string; title?: string; publishedDate?: string; text?: string }) => {
      // Extract source domain
      let source = 'unknown';
      try {
        const url = new URL(result.url);
        source = url.hostname.replace('www.', '');
      } catch {
        // Keep default
      }

      items.push({
        press: {
          title: result.title || '',
          date: result.publishedDate || '',
          source: source,
          snippet: result.text?.slice(0, 200) || '',
          url: result.url,
        },
        mention: {
          source: 'other',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: 'neutral',
        },
      });
    });
  } catch (error) {
    console.error('News search error:', error);
  }

  return items;
}
