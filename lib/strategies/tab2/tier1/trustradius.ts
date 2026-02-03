import { Tier1OfficialSources } from '@/lib/types';

export async function collectTrustRadiusData(
  companyName: string,
  domain: string
): Promise<Tier1OfficialSources['trustradius']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:trustradius.com/products "${companyName}" reviews`,
        numResults: 5,
        type: 'auto',
        contents: {
          text: { maxCharacters: 5000 },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const productPage = results.find((r: { url: string }) =>
      r.url.includes('trustradius.com/products/')
    );

    if (!productPage) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: productPage.url,
        tr_score: 0,
        total_reviews: 0,
        recent_reviews: [],
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
            content: 'You extract structured data from TrustRadius review content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract TrustRadius review data for ${companyName} from this content:

${productPage.text}

Return JSON:
{
  "tr_score": number (out of 10),
  "total_reviews": number,
  "recent_reviews": [{"rating": number, "snippet": string, "date": string, "url": string}]
}

Only return JSON, no other text.`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          url: productPage.url,
          tr_score: parsed.tr_score || 0,
          total_reviews: parsed.total_reviews || 0,
          recent_reviews: parsed.recent_reviews || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('TrustRadius collection error:', error);
    return null;
  }
}
