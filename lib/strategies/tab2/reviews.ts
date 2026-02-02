import { Tab2Data } from '@/lib/types';

export async function searchReviews(
  companyName: string
): Promise<Tab2Data['raw_mentions']> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const mentions: Tab2Data['raw_mentions'] = [];

  try {
    // Search G2 reviews
    const g2Response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" review site:g2.com`,
        numResults: 20,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });

    if (g2Response.ok) {
      const g2Data = await g2Response.json();
      g2Data.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'g2',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }

    // Search Capterra reviews
    const capterraResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" review site:capterra.com`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });

    if (capterraResponse.ok) {
      const capterraData = await capterraResponse.json();
      capterraData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'other',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }

    // Search TrustRadius
    const trustResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" review site:trustradius.com`,
        numResults: 10,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });

    if (trustResponse.ok) {
      const trustData = await trustResponse.json();
      trustData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'other',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }
  } catch (error) {
    console.error('Reviews search error:', error);
  }

  return mentions;
}

function inferSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'recommend', 'best', 'easy', 'helpful'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'disappointed', 'frustrating', 'difficult'];

  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
