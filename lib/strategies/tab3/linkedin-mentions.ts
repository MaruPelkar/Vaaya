import { RawUserSignal } from './types';

export async function searchLinkedInMentions(companyName: string): Promise<RawUserSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawUserSignal[] = [];

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" ("I use" OR "we use" OR "love using" OR "switched to" OR "been using") site:linkedin.com/posts`,
        numResults: 20,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1500 },
        },
      }),
    });

    if (!response.ok) return signals;

    const data = await response.json();

    for (const result of (data.results || []).slice(0, 10)) {
      if (!perplexityKey || !result.text) continue;

      const extracted = await extractLinkedInAuthor(result.text, perplexityKey);
      if (extracted) {
        signals.push({
          ...extracted,
          signalType: 'linkedin_post',
          confidence: 0.85,
          url: result.url,
          date: result.publishedDate,
          linkedin_url: extractLinkedInProfileUrl(result.url) || undefined,
        });
      }
    }
  } catch (error) {
    console.error('LinkedIn mentions search error:', error);
  }

  return signals;
}

async function extractLinkedInAuthor(
  postText: string,
  apiKey: string
): Promise<{ name: string; title?: string; company?: string; snippet: string } | null> {
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
            content: `Extract the LinkedIn post author's information:

POST TEXT:
${postText.slice(0, 1200)}

Return JSON:
{"name": "Full Name", "title": "Job Title or null", "company": "Current Company or null", "snippet": "relevant quote about the product (max 100 chars)"}

If cannot determine author name, return {"name": null}.
Only return JSON, nothing else.`,
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name && parsed.name !== 'null') return parsed;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function extractLinkedInProfileUrl(postUrl: string): string | null {
  // LinkedIn post URLs often contain the author's profile
  // Format: linkedin.com/posts/username_...
  const match = postUrl.match(/linkedin\.com\/posts\/([^_]+)/);
  if (match) {
    return `https://linkedin.com/in/${match[1]}`;
  }
  return null;
}
