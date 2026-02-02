import { Tab1Data } from '@/lib/types';

export async function getPerplexitySummary(
  companyName: string,
  domain: string
): Promise<Partial<Tab1Data> | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

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
            role: 'system',
            content: 'You are a business research assistant. Provide factual, structured information about companies. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Research the company "${companyName}" (${domain}). Return a JSON object with these fields:
{
  "description": "2-3 sentence company description",
  "founded": year as number or null,
  "headquarters": "City, State/Country" or null,
  "employee_range": "e.g. 100-500" or null,
  "industry": "primary industry" or null,
  "funding": {
    "total": "e.g. $100M" or null,
    "last_round": "e.g. Series B" or null,
    "last_round_date": "YYYY-MM" or null,
    "investors": ["investor names"]
  },
  "leadership": [{"name": "Full Name", "title": "Job Title", "linkedin_url": null}],
  "socials": {
    "twitter": "full URL or null",
    "linkedin": "full URL or null",
    "github": "full URL or null"
  }
}
Only return the JSON, no other text.`,
          },
        ],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
  }
}
