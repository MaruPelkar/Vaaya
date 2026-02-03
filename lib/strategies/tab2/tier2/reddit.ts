import { Tier2CommunitySources } from '@/lib/types';

export async function collectRedditData(
  companyName: string,
  productName: string
): Promise<Tier2CommunitySources['reddit']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Run multiple searches in parallel
    const [generalSearch, comparisonSearch, complaintsSearch, praiseSearch] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:reddit.com "${productName}"`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 2000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:reddit.com "${productName}" (vs OR alternative OR "compared to" OR "switched from" OR "better than")`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 2000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:reddit.com "${productName}" (issue OR problem OR bug OR hate OR frustrating OR terrible)`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:reddit.com "${productName}" (love OR amazing OR "game changer" OR recommend OR "best tool")`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
    ]);

    const [general, comparisons, complaints, praise] = await Promise.all([
      generalSearch.json(),
      comparisonSearch.json(),
      complaintsSearch.json(),
      praiseSearch.json(),
    ]);

    // Check for dedicated subreddit
    const hasDedicatedSubreddit = (general.results || []).some((r: { url: string }) =>
      r.url.match(/reddit\.com\/r\/[^/]+\/?$/) &&
      r.url.toLowerCase().includes(productName.toLowerCase().replace(/\s+/g, ''))
    );

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        subreddits_active: [],
        has_dedicated_subreddit: hasDedicatedSubreddit,
        dedicated_subreddit_members: null,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        top_threads: [],
        common_praise: [],
        common_complaints: [],
        competitor_mentions: [],
      };
    }

    // Analyze all results
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
            content: 'You analyze Reddit discussions about products. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze Reddit discussions about ${productName}.

GENERAL MENTIONS:
${(general.results || []).slice(0, 8).map((r: { url: string; text: string }) => `${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

COMPARISONS:
${(comparisons.results || []).slice(0, 5).map((r: { url: string; text: string }) => `${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

COMPLAINTS:
${(complaints.results || []).slice(0, 5).map((r: { url: string; text: string }) => `${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

PRAISE:
${(praise.results || []).slice(0, 5).map((r: { url: string; text: string }) => `${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

Return JSON:
{
  "subreddits_active": ["r/saas", "r/startups", etc],
  "sentiment": {"positive": percentage, "neutral": percentage, "negative": percentage},
  "top_threads": [
    {"subreddit": string, "title": string, "score": number, "num_comments": number, "date": "YYYY-MM-DD", "sentiment": "positive"|"negative"|"neutral"|"mixed", "key_points": [strings], "url": string}
  ],
  "common_praise": [top 5 positive themes],
  "common_complaints": [top 5 negative themes],
  "competitor_mentions": [
    {"competitor": string, "context": string, "comparison_sentiment": "favorable"|"unfavorable"|"neutral"}
  ]
}

Include up to 5 top threads and 3 competitor mentions. Only return JSON.`,
          },
        ],
        max_tokens: 2500,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subreddits_active: parsed.subreddits_active || [],
          has_dedicated_subreddit: hasDedicatedSubreddit,
          dedicated_subreddit_members: null,
          sentiment: parsed.sentiment || { positive: 0, neutral: 0, negative: 0 },
          top_threads: parsed.top_threads || [],
          common_praise: parsed.common_praise || [],
          common_complaints: parsed.common_complaints || [],
          competitor_mentions: parsed.competitor_mentions || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Reddit collection error:', error);
    return null;
  }
}
