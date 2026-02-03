import { Tier1OfficialSources } from '@/lib/types';

export async function collectCapterraData(
  companyName: string,
  domain: string
): Promise<Tier1OfficialSources['capterra']> {
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
        query: `site:capterra.com/p/ "${companyName}" reviews`,
        numResults: 5,
        type: 'auto',
        contents: {
          text: { maxCharacters: 6000 },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const productPage = results.find((r: { url: string }) =>
      r.url.includes('capterra.com/p/') && r.url.includes('/reviews')
    );

    if (!productPage) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: productPage.url,
        overall_rating: 0,
        total_reviews: 0,
        scores: {
          ease_of_use: null,
          customer_service: null,
          features: null,
          value_for_money: null,
        },
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
            content: 'You extract structured data from Capterra review content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract Capterra review data for ${companyName} from this content:

${productPage.text}

Return JSON:
{
  "overall_rating": number (out of 5),
  "total_reviews": number,
  "scores": {"ease_of_use": number or null, "customer_service": number or null, "features": number or null, "value_for_money": number or null},
  "recent_reviews": [{"rating": number, "title": string, "snippet": string, "date": string, "url": string}]
}

Only return JSON, no other text.`,
          },
        ],
        max_tokens: 1500,
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
          overall_rating: parsed.overall_rating || 0,
          total_reviews: parsed.total_reviews || 0,
          scores: parsed.scores || {
            ease_of_use: null,
            customer_service: null,
            features: null,
            value_for_money: null,
          },
          recent_reviews: parsed.recent_reviews || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Capterra collection error:', error);
    return null;
  }
}
