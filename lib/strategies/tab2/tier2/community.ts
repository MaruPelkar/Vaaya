import { Tier2CommunitySources } from '@/lib/types';

export async function collectDiscordData(
  companyName: string,
  domain: string
): Promise<Tier2CommunitySources['discord']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for Discord server
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${companyName}" discord server (join OR invite OR community)`,
        numResults: 5,
        type: 'auto',
        contents: { text: { maxCharacters: 1000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    // Check if any result mentions an official Discord
    const discordMention = results.find((r: { url: string; text: string }) =>
      r.url.includes('discord.gg') ||
      r.url.includes('discord.com/invite') ||
      r.text?.toLowerCase().includes('discord')
    );

    if (!discordMention) {
      return {
        has_official_server: false,
        server_members: null,
        server_url: null,
        discussion_themes: [],
        activity_level: 'unknown',
      };
    }

    // Extract Discord URL if present
    const discordUrlMatch = discordMention.text?.match(/discord\.(?:gg|com\/invite)\/[\w-]+/);
    const serverUrl = discordUrlMatch ? `https://${discordUrlMatch[0]}` : null;

    return {
      has_official_server: true,
      server_members: null, // Can't get without being in server
      server_url: serverUrl,
      discussion_themes: [],
      activity_level: 'unknown',
    };
  } catch (error) {
    console.error('Discord collection error:', error);
    return null;
  }
}

export async function collectOfficialCommunityData(
  companyName: string,
  domain: string
): Promise<Tier2CommunitySources['official_community']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    // Search for community forums
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `site:${domain} (community OR forum OR discuss OR feedback) OR site:community.${domain} OR site:forum.${domain}`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 3000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    // Find community URL
    const communityPage = results.find((r: { url: string }) =>
      r.url.includes('community') || r.url.includes('forum') || r.url.includes('discuss')
    );

    if (!communityPage) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        platform: 'Unknown',
        url: communityPage.url,
        total_members: null,
        total_topics: null,
        hot_topics: [],
        trending_feature_requests: [],
        common_support_issues: [],
        unanswered_questions: null,
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
            content: 'You analyze community forum content. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze ${companyName} community forum content:

${results.slice(0, 5).map((r: { url: string; text: string }) => `URL: ${r.url}\n${r.text?.substring(0, 600) || ''}`).join('\n---\n')}

Return JSON:
{
  "platform": "Discourse" | "Circle" | "Canny" | "Custom" | "Unknown",
  "hot_topics": [{"title": string, "replies": number, "views": number or null, "category": string, "is_feature_request": boolean, "is_bug_report": boolean, "url": string}],
  "trending_feature_requests": [top requested features as strings],
  "common_support_issues": [common issues as strings]
}

Only return JSON.`,
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
          platform: parsed.platform || 'Unknown',
          url: communityPage.url,
          total_members: null,
          total_topics: null,
          hot_topics: parsed.hot_topics || [],
          trending_feature_requests: parsed.trending_feature_requests || [],
          common_support_issues: parsed.common_support_issues || [],
          unanswered_questions: null,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Community collection error:', error);
    return null;
  }
}

export async function collectProductHuntData(
  companyName: string,
  productName: string
): Promise<Tier2CommunitySources['product_hunt']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `site:producthunt.com/posts "${productName}"`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 1500 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        total_launches: results.length,
        latest_launch: results[0] ? {
          name: productName,
          tagline: '',
          upvotes: 0,
          date: '',
          url: results[0].url,
        } : null,
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
            content: 'You extract Product Hunt launch data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract Product Hunt data for ${productName}:

${results.slice(0, 5).map((r: { url: string; text: string }) => `URL: ${r.url}\n${r.text?.substring(0, 400) || ''}`).join('\n---\n')}

Return JSON:
{
  "total_launches": number,
  "latest_launch": {"name": string, "tagline": string, "upvotes": number, "date": "YYYY-MM-DD", "url": string} or null
}

Only return JSON.`,
          },
        ],
        max_tokens: 800,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;
  } catch (error) {
    console.error('ProductHunt collection error:', error);
    return null;
  }
}

export async function collectYouTubeData(
  companyName: string,
  productName: string
): Promise<Tier2CommunitySources['youtube']> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `site:youtube.com "${productName}" (review OR tutorial OR walkthrough)`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 1000 } },
      }),
    });

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return {
        official_channel_subs: null,
        third_party_reviews: results.slice(0, 5).map((r: { url: string; title: string }) => ({
          channel_name: 'Unknown',
          title: r.title || '',
          views: 0,
          sentiment: 'neutral' as const,
          url: r.url,
        })),
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
            content: 'You extract YouTube video data. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract YouTube review data for ${productName}:

${results.slice(0, 8).map((r: { url: string; title: string; text: string }) => `URL: ${r.url}\nTitle: ${r.title || ''}\n${r.text?.substring(0, 300) || ''}`).join('\n---\n')}

Return JSON:
{
  "third_party_reviews": [{"channel_name": string, "title": string, "views": number, "sentiment": "positive"|"negative"|"neutral", "url": string}]
}

Include up to 5 reviews. Only return JSON.`,
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
          official_channel_subs: null,
          third_party_reviews: parsed.third_party_reviews || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('YouTube collection error:', error);
    return null;
  }
}
