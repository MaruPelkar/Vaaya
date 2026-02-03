import { Tier1OfficialSources } from '@/lib/types';

export async function collectLinkedInData(
  companyName: string,
  domain: string
): Promise<Tier1OfficialSources['linkedin']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for company posts
    const postsResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:linkedin.com "${companyName}" (announcement OR launch OR update OR feature)`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 2000 },
        },
      }),
    });

    if (!postsResponse.ok) return null;

    const postsData = await postsResponse.json();
    const results = postsData.results || [];

    // Find company page URL
    const companyUrl = results.find((r: { url: string }) =>
      r.url.includes('linkedin.com/company/')
    )?.url || `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        company_url: companyUrl,
        follower_count: null,
        follower_growth: null,
        company_posts: [],
        employee_posts: [],
      };
    }

    // Analyze posts
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
            content: 'You analyze LinkedIn content and extract structured data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze LinkedIn activity for ${companyName}. Content found:

${results.slice(0, 10).map((r: { url: string; text: string }) => `URL: ${r.url}\n${r.text?.substring(0, 500) || ''}`).join('\n\n---\n\n')}

Return JSON:
{
  "company_posts": [
    {
      "content_snippet": "brief description of post",
      "post_type": "product_update" | "hiring" | "thought_leadership" | "company_news" | "other",
      "engagement": {"likes": number, "comments": number},
      "date": "YYYY-MM-DD",
      "url": "full url"
    }
  ],
  "employee_posts": [
    {
      "author_name": "name",
      "author_title": "title at company",
      "content_snippet": "brief description",
      "is_product_related": boolean,
      "engagement": number,
      "date": "YYYY-MM-DD",
      "url": "full url"
    }
  ]
}

Include up to 5 company posts and 5 employee posts. Only return JSON.`,
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
          company_url: companyUrl,
          follower_count: null, // Can't get from search
          follower_growth: null,
          company_posts: parsed.company_posts || [],
          employee_posts: parsed.employee_posts || [],
        };
      }
    }

    return {
      company_url: companyUrl,
      follower_count: null,
      follower_growth: null,
      company_posts: [],
      employee_posts: [],
    };
  } catch (error) {
    console.error('LinkedIn collection error:', error);
    return null;
  }
}
