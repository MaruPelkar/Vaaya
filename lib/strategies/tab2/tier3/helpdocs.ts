import { Tier3ProductIntelligence } from '@/lib/types';

const HELP_PATHS = [
  '/help',
  '/docs',
  '/documentation',
  '/support',
  '/knowledge-base',
  '/kb',
  '/guide',
  '/learn',
];

export async function collectHelpDocsData(
  domain: string,
  companyName: string
): Promise<Tier3ProductIntelligence['help_docs']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for help/docs pages
    const pathQueries = HELP_PATHS.map(p => `site:${domain}${p}`).join(' OR ');
    const subdomainQueries = `site:help.${domain} OR site:docs.${domain} OR site:support.${domain}`;

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `(${pathQueries}) OR (${subdomainQueries})`,
        numResults: 15,
        type: 'auto',
        contents: { text: { maxCharacters: 3000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    // Find main help URL
    const helpUrl = results[0]?.url || null;

    // Check for API docs
    const hasApiDocs = results.some((r: { url: string; text: string }) =>
      r.url.includes('/api') || r.url.includes('/developer') || r.text?.toLowerCase().includes('api reference')
    );

    const hasDeveloperPortal = results.some((r: { url: string; text: string }) =>
      r.url.includes('/developer') || r.text?.toLowerCase().includes('developer portal')
    );

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: helpUrl,
        recent_additions: [],
        main_categories: [],
        signals: {
          has_api_docs: hasApiDocs,
          has_developer_portal: hasDeveloperPortal,
          documentation_quality: 'unknown',
        },
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
            content: 'You analyze documentation and help content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze help documentation for ${companyName}:

${results.slice(0, 10).map((r: { url: string; title: string; text: string }) =>
  `URL: ${r.url}\nTitle: ${r.title || ''}\n${r.text?.substring(0, 400) || ''}`
).join('\n---\n')}

Return JSON:
{
  "recent_additions": [
    {"title": string, "category": string, "date_detected": "YYYY-MM-DD", "url": string, "inferred_feature": string or null}
  ],
  "main_categories": [main help categories],
  "documentation_quality": "comprehensive"|"adequate"|"limited"
}

Recent additions should be docs that seem newly added or updated (look for new features, recent dates). Include up to 5 recent additions. Only return JSON.`,
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
          url: helpUrl,
          recent_additions: parsed.recent_additions || [],
          main_categories: parsed.main_categories || [],
          signals: {
            has_api_docs: hasApiDocs,
            has_developer_portal: hasDeveloperPortal,
            documentation_quality: parsed.documentation_quality || 'unknown',
          },
        };
      }
    }

    return {
      url: helpUrl,
      recent_additions: [],
      main_categories: [],
      signals: {
        has_api_docs: hasApiDocs,
        has_developer_portal: hasDeveloperPortal,
        documentation_quality: 'unknown',
      },
    };
  } catch (error) {
    console.error('Help docs collection error:', error);
    return null;
  }
}

export async function collectApiDocsData(
  domain: string,
  companyName: string
): Promise<Tier3ProductIntelligence['api_docs']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `site:${domain} (api OR developer) (documentation OR reference OR endpoints)`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 3000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    const hasPublicApi = results.some((r: { text: string }) =>
      r.text?.toLowerCase().includes('api') && r.text?.toLowerCase().includes('endpoint')
    );

    if (!hasPublicApi) {
      return {
        url: null,
        has_public_api: false,
        recent_changes: [],
        integrations: {
          native_count: null,
          zapier: false,
          make: false,
          api_quality: 'unknown',
        },
      };
    }

    // Check for integrations
    const [zapierResponse, makeResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:zapier.com/apps "${companyName}"`,
          numResults: 2,
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:make.com/en/integrations "${companyName}"`,
          numResults: 2,
        }),
      }),
    ]);

    const zapierData = await zapierResponse.json();
    const makeData = await makeResponse.json();

    const hasZapier = (zapierData.results || []).length > 0;
    const hasMake = (makeData.results || []).length > 0;

    const apiUrl = results.find((r: { url: string }) =>
      r.url.includes('/api') || r.url.includes('/developer')
    )?.url || null;

    return {
      url: apiUrl,
      has_public_api: true,
      recent_changes: [],
      integrations: {
        native_count: null,
        zapier: hasZapier,
        make: hasMake,
        api_quality: 'unknown',
      },
    };
  } catch (error) {
    console.error('API docs collection error:', error);
    return null;
  }
}

export async function collectSupportData(
  domain: string,
  companyName: string,
  g2SupportRating: number | null
): Promise<Tier3ProductIntelligence['support']> {
  const exaKey = process.env.EXA_API_KEY;

  const defaultResult: Tier3ProductIntelligence['support'] = {
    help_center_url: null,
    common_issues: [],
    support_signals: {
      g2_support_rating: g2SupportRating,
      response_time_claim: null,
      community_sentiment: 'mixed',
    },
    pain_points: [],
  };

  if (!exaKey) return defaultResult;

  try {
    // Search for support complaints
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${companyName}" (support OR customer service) (issue OR problem OR slow OR unhelpful OR terrible)`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 1500 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey || results.length === 0) {
      return defaultResult;
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
            content: 'You analyze support feedback. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze support feedback for ${companyName}:

${results.slice(0, 8).map((r: { url: string; text: string }) =>
  `${r.url}\n${r.text?.substring(0, 400) || ''}`
).join('\n---\n')}

Return JSON:
{
  "common_issues": [{"issue": string, "frequency": "high"|"medium"|"low", "category": string}],
  "community_sentiment": "positive"|"mixed"|"negative",
  "pain_points": [{"issue": string, "severity": "critical"|"major"|"minor", "source": string}]
}

Include up to 5 common issues and 5 pain points. Only return JSON.`,
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
          help_center_url: `https://${domain}/help`,
          common_issues: parsed.common_issues || [],
          support_signals: {
            g2_support_rating: g2SupportRating,
            response_time_claim: null,
            community_sentiment: parsed.community_sentiment || 'mixed',
          },
          pain_points: parsed.pain_points || [],
        };
      }
    }

    return defaultResult;
  } catch (error) {
    console.error('Support data collection error:', error);
    return defaultResult;
  }
}
