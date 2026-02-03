import { Tier3ProductIntelligence } from '@/lib/types';

export async function collectJobSignals(
  companyName: string,
  domain: string
): Promise<Tier3ProductIntelligence['job_signals']> {
  const exaKey = process.env.EXA_API_KEY;

  const defaultResult: Tier3ProductIntelligence['job_signals'] = {
    total_open_roles: 0,
    careers_url: null,
    product_signals: [],
    tech_investments: [],
    team_signals: [],
    expansion_signals: [],
  };

  if (!exaKey) return defaultResult;

  try {
    // Search job boards
    const [jobsResponse, linkedinJobsResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${companyName}" (careers OR jobs OR hiring) site:greenhouse.io OR site:lever.co OR site:ashbyhq.com OR site:${domain}/careers`,
          numResults: 30,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:linkedin.com/jobs "${companyName}"`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 1000 } },
        }),
      }),
    ]);

    const [jobs, linkedinJobs] = await Promise.all([
      jobsResponse.json(),
      linkedinJobsResponse.json(),
    ]);

    const allResults = [...(jobs.results || []), ...(linkedinJobs.results || [])];

    if (allResults.length === 0) return defaultResult;

    // Find careers URL
    const careersUrl = allResults.find((r: { url: string }) =>
      r.url.includes('/careers') || r.url.includes('greenhouse.io') || r.url.includes('lever.co')
    )?.url || null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        ...defaultResult,
        total_open_roles: allResults.length,
        careers_url: careersUrl,
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
            content: 'You analyze job postings for product and strategic signals. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze job postings for ${companyName} to extract product and strategic signals:

${allResults.slice(0, 20).map((r: { url: string; title: string; text: string }) =>
  `Title: ${r.title || ''}\nURL: ${r.url}\n${r.text?.substring(0, 400) || ''}`
).join('\n---\n')}

Return JSON:
{
  "total_open_roles": estimated number,
  "product_signals": [
    {"role_title": string, "inferred_focus": "AI/ML"|"Mobile"|"Enterprise"|"Security"|"Platform"|"Other", "key_requirements": [strings]}
  ],
  "tech_investments": [
    {"technology": string, "role_count": number, "signal": "what this hiring means for product direction"}
  ],
  "team_signals": ["Building first enterprise team", "Hiring first ML engineers", etc],
  "expansion_signals": ["Opening London office", "Hiring remote in APAC", etc]
}

Include up to 5 product signals, 5 tech investments. Only return JSON.`,
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
          total_open_roles: parsed.total_open_roles || allResults.length,
          careers_url: careersUrl,
          product_signals: parsed.product_signals || [],
          tech_investments: parsed.tech_investments || [],
          team_signals: parsed.team_signals || [],
          expansion_signals: parsed.expansion_signals || [],
        };
      }
    }

    return {
      ...defaultResult,
      total_open_roles: allResults.length,
      careers_url: careersUrl,
    };
  } catch (error) {
    console.error('Job signals collection error:', error);
    return defaultResult;
  }
}
