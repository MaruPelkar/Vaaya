import { RawSignal, SignalSource } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectReviewSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];

  try {
    // Search all review platforms in parallel
    const [g2Response, capterraResponse, trustRadiusResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:g2.com/products "${productName}" reviews`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:capterra.com "${productName}" reviews`,
          numResults: 15,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:trustradius.com "${productName}" review`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      }),
    ]);

    const [g2Data, capterraData, trustRadiusData] = await Promise.all([
      g2Response.json(),
      capterraResponse.json(),
      trustRadiusResponse.json(),
    ]);

    const allResults: Array<{ url: string; text: string; source: SignalSource }> = [
      ...(g2Data.results || []).map((r: { url: string; text: string }) => ({ ...r, source: 'g2_review' as const })),
      ...(capterraData.results || []).map((r: { url: string; text: string }) => ({ ...r, source: 'capterra_review' as const })),
      ...(trustRadiusData.results || []).map((r: { url: string; text: string }) => ({ ...r, source: 'trustradius_review' as const })),
    ];

    if (!perplexityKey || allResults.length === 0) return signals;

    // Process in batches to extract reviewers
    const batchSize = 5;
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      const batchText = batch.map((r, idx) => `[${idx}] URL: ${r.url}\n${r.text?.substring(0, 1500) || ''}`).join('\n---\n');

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
              content: 'You extract reviewer information from review pages. Return valid JSON only.',
            },
            {
              role: 'user',
              content: `Extract reviewer information from these ${productName} reviews.

${batchText}

Return JSON array of reviewers found:
[{
  "index": number (which review 0-${batch.length - 1}),
  "name": "Full Name",
  "role": "Job Title" or null,
  "company": "Company Name" or null,
  "quote": "Key quote from their review (1-2 sentences)",
  "date": "YYYY-MM" or null
}]

Only include reviewers where you can extract at least a name. Return [] if none found.`,
            },
          ],
          max_tokens: 2000,
        }),
      });

      const extractData = await extractResponse.json();
      const content = extractData.choices?.[0]?.message?.content;

      if (content) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const reviewers = JSON.parse(jsonMatch[0]);
            for (const reviewer of reviewers) {
              const result = batch[reviewer.index];
              if (!result) continue;

              signals.push({
                id: crypto.randomUUID(),
                source: result.source,
                tier: SIGNAL_TIERS[result.source],
                source_url: result.url,
                extracted_name: reviewer.name || null,
                extracted_company: reviewer.company || null,
                extracted_role: reviewer.role || null,
                extracted_linkedin: null,
                extracted_twitter: null,
                extracted_github: null,
                extracted_email: null,
                signal_text: reviewer.quote || '',
                signal_date: reviewer.date || null,
                base_confidence: SIGNAL_WEIGHTS[result.source],
              });
            }
          }
        } catch {
          // Skip parsing errors
        }
      }
    }
  } catch (error) {
    console.error('Review signals collection error:', error);
  }

  return signals;
}
