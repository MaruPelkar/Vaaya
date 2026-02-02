export async function scrapeWebsite(domain: string): Promise<{
  leadership?: Array<{ name: string; title: string; linkedin_url: string | null }>;
} | null> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!firecrawlKey) return null;

  try {
    // Try to scrape the about/team page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://${domain}/about`,
        formats: ['markdown'],
      }),
    });

    if (!response.ok) {
      // Try team page as fallback
      const teamResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://${domain}/team`,
          formats: ['markdown'],
        }),
      });

      if (!teamResponse.ok) return null;

      const teamData = await teamResponse.json();
      if (!teamData.data?.markdown || !perplexityKey) return null;

      return extractLeadership(teamData.data.markdown, perplexityKey);
    }

    const data = await response.json();

    if (!data.data?.markdown || !perplexityKey) return null;

    return extractLeadership(data.data.markdown, perplexityKey);
  } catch (error) {
    console.error('Website scrape error:', error);
    return null;
  }
}

async function extractLeadership(
  pageContent: string,
  apiKey: string
): Promise<{ leadership: Array<{ name: string; title: string; linkedin_url: string | null }> } | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: `Extract leadership/executive team members from this page content. Return JSON only:

PAGE CONTENT:
${pageContent.slice(0, 4000)}

Return format:
{"leadership": [{"name": "Full Name", "title": "Job Title", "linkedin_url": null}]}

Only include C-level executives, founders, and VPs. Max 10 people.
If no leadership found, return {"leadership": []}.
Only return JSON, nothing else.`,
          },
        ],
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;
  } catch (error) {
    console.error('Leadership extraction error:', error);
    return null;
  }
}
