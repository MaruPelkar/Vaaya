import { RawUserSignal } from './types';

export async function searchTestimonials(
  domain: string,
  companyName: string
): Promise<RawUserSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawUserSignal[] = [];

  try {
    // Search for testimonial pages on the company's website
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `(testimonials OR "customer stories" OR "case studies") site:${domain}`,
        numResults: 5,
        type: 'auto',
        contents: {
          text: { maxCharacters: 5000 },
        },
      }),
    });

    if (!response.ok) return signals;

    const data = await response.json();

    // Extract testimonial authors from each page
    for (const result of (data.results || []).slice(0, 3)) {
      if (!perplexityKey || !result.text) continue;

      const extracted = await extractTestimonialAuthors(result.text, result.url, perplexityKey);
      signals.push(...extracted.map(e => ({
        ...e,
        signalType: 'testimonial' as const,
        confidence: 0.85,
        url: result.url,
      })));
    }
  } catch (error) {
    console.error('Testimonials search error:', error);
  }

  return signals;
}

async function extractTestimonialAuthors(
  pageText: string,
  url: string,
  apiKey: string
): Promise<Array<{ name: string; title?: string; company?: string; snippet: string }>> {
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
            content: `Extract testimonial authors from this webpage text. Return JSON array only:

TEXT:
${pageText.slice(0, 4000)}

Return format:
[{"name": "Full Name", "title": "Job Title or null", "company": "Company Name or null", "snippet": "their quote (max 100 chars)"}]

Max 5 people. If no testimonials with names found, return [].
Only return the JSON array, nothing else.`,
          },
        ],
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.filter((p: { name?: string }) => p.name);
      }
    }

    return [];
  } catch (error) {
    console.error('Extract testimonials error:', error);
    return [];
  }
}
