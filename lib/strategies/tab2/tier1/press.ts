import { Tier1OfficialSources } from '@/lib/types';

export async function collectPressData(
  companyName: string,
  domain: string
): Promise<{
  crunchbase_news: Tier1OfficialSources['crunchbase_news'];
  press_releases: Tier1OfficialSources['press_releases'];
  analyst_coverage: Tier1OfficialSources['analyst_coverage'];
}> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) {
    return {
      crunchbase_news: [],
      press_releases: [],
      analyst_coverage: [],
    };
  }

  try {
    // Search for press releases and news
    const [newsResponse, analystResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': exaKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `"${companyName}" (press release OR announcement OR launch OR funding) -site:linkedin.com -site:twitter.com`,
          numResults: 20,
          type: 'auto',
          contents: {
            text: { maxCharacters: 1500 },
          },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': exaKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `"${companyName}" (Gartner OR Forrester OR IDC OR "Magic Quadrant" OR "Wave Report")`,
          numResults: 10,
          type: 'auto',
          contents: {
            text: { maxCharacters: 1500 },
          },
        }),
      }),
    ]);

    const newsData = await newsResponse.json();
    const analystData = await analystResponse.json();

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        crunchbase_news: [],
        press_releases: [],
        analyst_coverage: [],
      };
    }

    // Extract structured press data
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
            content: 'You extract and categorize press releases and news. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Categorize news and press for ${companyName}:

NEWS RESULTS:
${(newsData.results || []).slice(0, 12).map((r: { url: string; title: string; text: string; publishedDate?: string }) =>
  `Title: ${r.title || 'N/A'}\nURL: ${r.url}\nDate: ${r.publishedDate || 'unknown'}\nSnippet: ${r.text?.substring(0, 400) || ''}`
).join('\n\n')}

ANALYST RESULTS:
${(analystData.results || []).slice(0, 8).map((r: { url: string; title: string; text: string; publishedDate?: string }) =>
  `Title: ${r.title || 'N/A'}\nURL: ${r.url}\nDate: ${r.publishedDate || 'unknown'}\nSnippet: ${r.text?.substring(0, 400) || ''}`
).join('\n\n')}

Return JSON:
{
  "crunchbase_news": [
    {"title": string, "date": "YYYY-MM-DD", "category": "funding" | "acquisition" | "product" | "partnership" | "leadership" | "other", "url": string}
  ],
  "press_releases": [
    {"title": string, "date": "YYYY-MM-DD", "source": string, "category": "product" | "partnership" | "funding" | "expansion" | "award" | "other", "snippet": string, "url": string, "key_announcement": string}
  ],
  "analyst_coverage": [
    {"analyst_firm": string, "report_type": string, "mention_context": string, "date": "YYYY-MM-DD", "url": string or null}
  ]
}

Include up to 5 items in each array. Only return JSON.`,
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
          crunchbase_news: parsed.crunchbase_news || [],
          press_releases: parsed.press_releases || [],
          analyst_coverage: parsed.analyst_coverage || [],
        };
      }
    }

    return {
      crunchbase_news: [],
      press_releases: [],
      analyst_coverage: [],
    };
  } catch (error) {
    console.error('Press collection error:', error);
    return {
      crunchbase_news: [],
      press_releases: [],
      analyst_coverage: [],
    };
  }
}

export async function collectGartnerForresterData(
  companyName: string
): Promise<{
  gartner: Tier1OfficialSources['gartner'];
  forrester: Tier1OfficialSources['forrester'];
}> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityKey) {
    return { gartner: null, forrester: null };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You research analyst coverage of companies. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Research Gartner and Forrester coverage for ${companyName}.

Return JSON:
{
  "gartner": {
    "peer_insights_rating": number or null,
    "magic_quadrant": {
      "position": "Leader" | "Challenger" | "Visionary" | "Niche Player" | null,
      "year": number,
      "report_url": string or null
    } or null,
    "key_strengths": [strings],
    "cautions": [strings]
  } or null,
  "forrester": {
    "wave_position": string or null,
    "wave_year": number or null
  } or null
}

Only return JSON, no other text.`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          gartner: parsed.gartner || null,
          forrester: parsed.forrester || null,
        };
      }
    }

    return { gartner: null, forrester: null };
  } catch (error) {
    console.error('Gartner/Forrester collection error:', error);
    return { gartner: null, forrester: null };
  }
}
