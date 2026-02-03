import { Tier3ProductIntelligence } from '@/lib/types';

const CHANGELOG_PATHS = [
  '/changelog',
  '/releases',
  '/whats-new',
  '/updates',
  '/release-notes',
  '/blog/changelog',
  '/blog/releases',
  '/product-updates',
];

export async function collectChangelogData(
  domain: string,
  companyName: string
): Promise<Tier3ProductIntelligence['changelog']> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  try {
    let changelogContent = '';
    let changelogUrl = '';

    // Try Firecrawl first
    if (firecrawlKey) {
      for (const path of CHANGELOG_PATHS) {
        const testUrl = `https://${domain}${path}`;
        try {
          const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: testUrl,
              pageOptions: { onlyMainContent: true },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.markdown?.length > 500) {
              changelogContent = data.data.markdown.substring(0, 15000);
              changelogUrl = testUrl;
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Fallback to Exa search
    if (!changelogContent) {
      const exaKey = process.env.EXA_API_KEY;
      if (exaKey) {
        const response = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `site:${domain} (changelog OR "release notes" OR "what's new" OR updates)`,
            numResults: 5,
            type: 'auto',
            contents: { text: { maxCharacters: 10000 } },
          }),
        });

        const data = await response.json();
        if (data.results?.length > 0) {
          changelogUrl = data.results[0].url;
          changelogContent = data.results.map((r: { text: string }) => r.text || '').join('\n\n');
        }
      }
    }

    if (!changelogContent) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        url: changelogUrl,
        releases: [],
        velocity: {
          releases_last_30_days: 0,
          releases_last_90_days: 0,
          average_days_between_releases: 0,
          trend: 'stable',
        },
        active_areas: [],
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
            content: 'You extract changelog/release data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract changelog data for ${companyName} from:

${changelogContent.substring(0, 12000)}

Return JSON:
{
  "releases": [
    {"version": string or null, "date": "YYYY-MM-DD", "title": string, "type": "major"|"minor"|"patch"|"announcement", "highlights": [key changes], "url": string}
  ],
  "velocity": {
    "releases_last_30_days": number,
    "releases_last_90_days": number,
    "average_days_between_releases": number,
    "trend": "accelerating"|"stable"|"slowing"
  },
  "active_areas": [
    {"area": "feature area", "update_count": number, "recent_examples": [strings]}
  ]
}

Include up to 15 most recent releases. Identify top 5 active development areas. Only return JSON.`,
          },
        ],
        max_tokens: 3000,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          url: changelogUrl,
          releases: parsed.releases || [],
          velocity: parsed.velocity || {
            releases_last_30_days: 0,
            releases_last_90_days: 0,
            average_days_between_releases: 0,
            trend: 'stable',
          },
          active_areas: parsed.active_areas || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Changelog collection error:', error);
    return null;
  }
}
