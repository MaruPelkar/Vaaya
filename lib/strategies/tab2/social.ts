import { Tab2Data } from '@/lib/types';

export async function searchSocialMentions(
  companyName: string
): Promise<Tab2Data['raw_mentions']> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const mentions: Tab2Data['raw_mentions'] = [];

  try {
    // Search LinkedIn posts
    const linkedinResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (love OR recommend OR switched OR using) site:linkedin.com/posts`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (linkedinResponse.ok) {
      const linkedinData = await linkedinResponse.json();
      linkedinData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'linkedin',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }

    // Search Twitter/X
    const twitterResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (love OR great OR recommend OR using) site:twitter.com OR site:x.com`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (twitterResponse.ok) {
      const twitterData = await twitterResponse.json();
      twitterData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'twitter',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }

    // Search Reddit
    const redditResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (review OR experience OR switched OR alternative) site:reddit.com`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (redditResponse.ok) {
      const redditData = await redditResponse.json();
      redditData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'reddit',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }

    // Search Hacker News
    const hnResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" site:news.ycombinator.com`,
        numResults: 10,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (hnResponse.ok) {
      const hnData = await hnResponse.json();
      hnData.results?.forEach((result: { text?: string; title?: string; publishedDate?: string; url: string }) => {
        mentions.push({
          source: 'hackernews',
          text: result.text || result.title || '',
          date: result.publishedDate || null,
          url: result.url,
          sentiment: inferSentiment(result.text || ''),
        });
      });
    }
  } catch (error) {
    console.error('Social search error:', error);
  }

  return mentions;
}

function inferSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();

  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'recommend', 'best', 'awesome', 'fantastic', 'helpful', 'easy'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'disappointed', 'frustrating', 'horrible', 'sucks', 'bad', 'broken'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
