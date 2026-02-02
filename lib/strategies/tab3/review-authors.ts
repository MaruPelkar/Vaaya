import { RawUserSignal } from './types';

export async function searchReviewAuthors(companyName: string): Promise<RawUserSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawUserSignal[] = [];

  try {
    // Search G2 for reviews with author info
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" reviews site:g2.com`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 2000 },
        },
      }),
    });

    if (!response.ok) return signals;

    const data = await response.json();

    // Extract reviewer info from results (batch processing to reduce API calls)
    if (perplexityKey && data.results?.length) {
      const extracted = await extractReviewersFromBatch(
        data.results.slice(0, 10),
        perplexityKey
      );
      signals.push(...extracted.map(e => ({
        ...e,
        signalType: 'g2_review' as const,
        confidence: 0.95,
      })));
    }
  } catch (error) {
    console.error('Review authors search error:', error);
  }

  return signals;
}

async function extractReviewersFromBatch(
  results: Array<{ text?: string; url: string; publishedDate?: string }>,
  apiKey: string
): Promise<Array<{ name: string; title?: string; company?: string; snippet: string; url: string; date?: string }>> {
  const extracted: Array<{ name: string; title?: string; company?: string; snippet: string; url: string; date?: string }> = [];

  // Process in smaller batches to avoid timeout
  for (const result of results.slice(0, 5)) {
    if (!result.text) continue;

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
              content: `Extract reviewer information from this G2 review text. Return JSON only:

TEXT:
${result.text.slice(0, 1500)}

Return format:
{"name": "Full Name", "title": "Job Title or null", "company": "Company Name or null", "snippet": "key quote from review (max 100 chars)"}

If you cannot find a reviewer name, return {"name": null}.
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
          if (parsed.name && parsed.name !== 'null') {
            extracted.push({
              name: parsed.name,
              title: parsed.title,
              company: parsed.company,
              snippet: parsed.snippet || '',
              url: result.url,
              date: result.publishedDate,
            });
          }
        }
      }
    } catch (error) {
      console.error('Extract reviewer error:', error);
    }
  }

  return extracted;
}
