import { Tier2CommunitySources } from '@/lib/types';

export async function collectTwitterData(
  companyName: string,
  productName: string
): Promise<Tier2CommunitySources['twitter']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for Twitter/X mentions
    const [generalSearch, influencerSearch] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:twitter.com OR site:x.com "${productName}"`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:twitter.com OR site:x.com "${productName}" (recommend OR review OR "game changer" OR launched)`,
          numResults: 15,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
    ]);

    const [general, influencer] = await Promise.all([
      generalSearch.json(),
      influencerSearch.json(),
    ]);

    const allResults = [...(general.results || []), ...(influencer.results || [])];

    if (allResults.length === 0) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        mention_volume_30d: null,
        sentiment_score: null,
        notable_tweets: [],
        influencer_mentions: [],
        trending_topics: [],
      };
    }

    const extractResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You analyze Twitter/X mentions of products. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze Twitter/X mentions of ${productName}:

${allResults.slice(0, 15).map((r: { url: string; text: string }) => `${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

Return JSON:
{
  "sentiment_score": number 0-100,
  "notable_tweets": [
    {"author_handle": string, "author_followers": number or null, "content": string, "likes": number, "retweets": number, "date": "YYYY-MM-DD", "sentiment": "positive"|"negative"|"neutral", "url": string}
  ],
  "influencer_mentions": [
    {"author": string, "followers": number or null, "content_snippet": string, "sentiment": "positive"|"negative"|"neutral", "url": string}
  ],
  "trending_topics": [topics being discussed about the product]
}

Include up to 5 notable tweets and 3 influencer mentions. Only return JSON.`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mention_volume_30d: null, // Can't determine from search
          sentiment_score: parsed.sentiment_score || null,
          notable_tweets: parsed.notable_tweets || [],
          influencer_mentions: parsed.influencer_mentions || [],
          trending_topics: parsed.trending_topics || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Twitter collection error:', error);
    return null;
  }
}
