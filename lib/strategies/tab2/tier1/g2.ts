import { Tier1OfficialSources } from '@/lib/types';

export async function collectG2Data(
  companyName: string,
  domain: string
): Promise<Tier1OfficialSources['g2']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for G2 product page
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:g2.com/products "${companyName}" reviews`,
        numResults: 5,
        type: 'auto',
        contents: {
          text: { maxCharacters: 8000 },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    // Find the main product page
    const productPage = results.find((r: { url: string }) =>
      r.url.includes('g2.com/products/') && !r.url.includes('/compare')
    );

    if (!productPage) return null;

    // Extract data using Perplexity
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: productPage.url,
        overall_rating: 0,
        total_reviews: 0,
        review_trend: 'stable',
        categories: [],
        scores: {
          ease_of_use: null,
          quality_of_support: null,
          ease_of_setup: null,
          ease_of_admin: null,
        },
        top_pros: [],
        top_cons: [],
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
            content: 'You extract structured data from G2 review content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract G2 review data for ${companyName} from this content:

${productPage.text}

Return JSON:
{
  "overall_rating": number (out of 5),
  "total_reviews": number,
  "review_trend": "up" | "down" | "stable",
  "categories": [{"category": string, "rank": number or null, "total_in_category": number or null, "badge": string or null}],
  "scores": {"ease_of_use": number or null, "quality_of_support": number or null, "ease_of_setup": number or null, "ease_of_admin": number or null},
  "top_pros": [top 5 positive themes],
  "top_cons": [top 5 negative themes],
  "recent_reviews": [{"rating": number, "title": string, "snippet": string, "reviewer_role": string or null, "reviewer_company_size": string or null, "date": string, "url": string}]
}

Only return JSON, no other text.`,
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
          url: productPage.url,
          overall_rating: parsed.overall_rating || 0,
          total_reviews: parsed.total_reviews || 0,
          review_trend: parsed.review_trend || 'stable',
          categories: parsed.categories || [],
          scores: parsed.scores || {
            ease_of_use: null,
            quality_of_support: null,
            ease_of_setup: null,
            ease_of_admin: null,
          },
          top_pros: parsed.top_pros || [],
          top_cons: parsed.top_cons || [],
          recent_reviews: parsed.recent_reviews || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('G2 collection error:', error);
    return null;
  }
}
