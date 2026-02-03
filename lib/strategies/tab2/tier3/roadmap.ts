import { Tier3ProductIntelligence } from '@/lib/types';

const ROADMAP_PATHS = [
  '/roadmap',
  '/product-roadmap',
  '/public-roadmap',
  '/feature-requests',
  '/feedback',
];

const ROADMAP_PLATFORMS = [
  'canny.io',
  'productboard.com',
  'feedbackfish.com',
  'nolt.io',
  'upvoty.com',
  'fider.io',
];

export async function collectRoadmapData(
  domain: string,
  companyName: string
): Promise<Tier3ProductIntelligence['public_roadmap']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for roadmap pages
    const platformQueries = ROADMAP_PLATFORMS.map(p => `site:${p} "${companyName}"`).join(' OR ');
    const domainQueries = ROADMAP_PATHS.map(p => `site:${domain}${p}`).join(' OR ');

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `(${platformQueries}) OR (${domainQueries}) OR ("${companyName}" roadmap feature request)`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 5000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    // Find the best roadmap URL
    const roadmapResult = results.find((r: { url: string }) =>
      ROADMAP_PLATFORMS.some(p => r.url.includes(p)) ||
      ROADMAP_PATHS.some(p => r.url.includes(p))
    );

    if (!roadmapResult) return null;

    // Detect platform
    let platform = 'Custom';
    for (const p of ROADMAP_PLATFORMS) {
      if (roadmapResult.url.includes(p)) {
        platform = p.split('.')[0].charAt(0).toUpperCase() + p.split('.')[0].slice(1);
        break;
      }
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: roadmapResult.url,
        platform,
        items: [],
        most_voted: [],
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
            content: 'You extract roadmap and feature request data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract roadmap data for ${companyName}:

${results.slice(0, 5).map((r: { url: string; text: string }) => `URL: ${r.url}\n${r.text?.substring(0, 1500) || ''}`).join('\n---\n')}

Return JSON:
{
  "items": [
    {"title": string, "status": "under_review"|"planned"|"in_progress"|"completed", "votes": number or null, "category": string or null, "expected_date": string or null}
  ],
  "most_voted": [
    {"title": string, "votes": number, "status": string}
  ]
}

Include up to 15 roadmap items and top 5 most voted. Only return JSON.`,
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
          url: roadmapResult.url,
          platform,
          items: parsed.items || [],
          most_voted: parsed.most_voted || [],
        };
      }
    }

    return {
      url: roadmapResult.url,
      platform,
      items: [],
      most_voted: [],
    };
  } catch (error) {
    console.error('Roadmap collection error:', error);
    return null;
  }
}

export async function collectStatusPageData(
  domain: string
): Promise<Tier3ProductIntelligence['status_page']> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const exaKey = process.env.EXA_API_KEY;

  const statusUrls = [
    `https://status.${domain}`,
    `https://${domain}/status`,
    `https://${domain.split('.')[0]}.statuspage.io`,
  ];

  try {
    let statusContent = '';
    let statusUrl = '';

    // Try Firecrawl first
    if (firecrawlKey) {
      for (const url of statusUrls) {
        try {
          const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              pageOptions: { onlyMainContent: true },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.markdown?.length > 200) {
              statusContent = data.data.markdown.substring(0, 8000);
              statusUrl = url;
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Fallback to Exa
    if (!statusContent && exaKey) {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:status.${domain} OR site:${domain}/status OR site:statuspage.io "${domain.split('.')[0]}"`,
          numResults: 3,
          type: 'auto',
          contents: { text: { maxCharacters: 5000 } },
        }),
      });

      const data = await response.json();
      if (data.results?.length > 0) {
        statusUrl = data.results[0].url;
        statusContent = data.results[0].text || '';
      }
    }

    if (!statusContent) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: statusUrl,
        current_status: 'operational',
        uptime_90d: null,
        recent_incidents: [],
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
            content: 'You extract status page data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract status page data:

${statusContent}

Return JSON:
{
  "current_status": "operational"|"degraded"|"outage",
  "uptime_90d": number or null,
  "recent_incidents": [
    {"title": string, "date": "YYYY-MM-DD", "severity": "minor"|"major"|"critical", "duration_minutes": number or null, "affected": [services]}
  ]
}

Include up to 5 recent incidents. Only return JSON.`,
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
          url: statusUrl,
          current_status: parsed.current_status || 'operational',
          uptime_90d: parsed.uptime_90d || null,
          recent_incidents: parsed.recent_incidents || [],
        };
      }
    }

    return {
      url: statusUrl,
      current_status: 'operational',
      uptime_90d: null,
      recent_incidents: [],
    };
  } catch (error) {
    console.error('Status page collection error:', error);
    return null;
  }
}
