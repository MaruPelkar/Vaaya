import { Tab2Data } from '@/lib/types';

export async function synthesizeIntelligence(
  companyName: string,
  mentions: Tab2Data['raw_mentions']
): Promise<{
  summary: string;
  loved_features: string[];
  common_complaints: string[];
  sentiment_score: number;
  recent_releases: Tab2Data['recent_releases'];
} | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  // Prepare context from mentions
  const mentionsSummary = mentions
    .slice(0, 30)
    .map(m => `[${m.source}] ${m.text}`)
    .join('\n\n');

  if (!mentionsSummary.trim()) {
    return {
      summary: `Limited public information found about ${companyName}.`,
      loved_features: [],
      common_complaints: [],
      sentiment_score: 0.5,
      recent_releases: [],
    };
  }

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
            content: 'You are a market intelligence analyst. Analyze company mentions and extract key insights. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze these mentions about "${companyName}" and return a JSON object:

MENTIONS:
${mentionsSummary}

Return this exact JSON structure:
{
  "summary": "2-3 sentence overall summary of what people are saying",
  "loved_features": ["feature 1", "feature 2", ...] (max 5),
  "common_complaints": ["complaint 1", "complaint 2", ...] (max 5),
  "sentiment_score": 0.0 to 1.0 (0=very negative, 1=very positive),
  "recent_releases": [{"title": "feature/product name", "date": "YYYY-MM or empty string", "source_url": ""}] (max 3)
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          loved_features: parsed.loved_features || [],
          common_complaints: parsed.common_complaints || [],
          sentiment_score: typeof parsed.sentiment_score === 'number' ? parsed.sentiment_score : 0.5,
          recent_releases: parsed.recent_releases || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Synthesis error:', error);
    return null;
  }
}
