import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectJobSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];

  try {
    // Search job boards
    const jobResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${productName}" (experience OR required OR proficiency) site:greenhouse.io OR site:lever.co OR site:linkedin.com/jobs OR site:indeed.com`,
        numResults: 40,
        type: 'auto',
        contents: { text: { maxCharacters: 1500 } },
      }),
    });

    const jobData = await jobResponse.json();
    const results = (jobData.results || []).slice(0, 25);

    if (!perplexityKey || results.length === 0) return signals;

    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const batchText = batch.map((r: { url: string; text: string }, idx: number) =>
        `[${idx}] URL: ${r.url}\n${r.text?.substring(0, 800) || ''}`
      ).join('\n---\n');

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
              content: 'You extract company information from job postings. Return valid JSON only.',
            },
            {
              role: 'user',
              content: `Extract companies from these job postings requiring ${productName}.

${batchText}

Return JSON array:
[{
  "index": number (0-${batch.length - 1}),
  "company": "Company Name",
  "role": "Job Title"
}]

Only include where company can be clearly identified. Return [] if none found.`,
            },
          ],
          max_tokens: 1000,
        }),
      });

      const extractData = await extractResponse.json();
      const content = extractData.choices?.[0]?.message?.content;

      if (content) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const companies = JSON.parse(jsonMatch[0]);
            for (const company of companies) {
              const result = batch[company.index];
              if (!result || !company.company) continue;

              signals.push({
                id: crypto.randomUUID(),
                source: 'job_posting',
                tier: SIGNAL_TIERS.job_posting,
                source_url: result.url,
                extracted_name: null, // Need to find person later
                extracted_company: company.company,
                extracted_role: null,
                extracted_linkedin: null,
                extracted_twitter: null,
                extracted_github: null,
                extracted_email: null,
                signal_text: `${company.company} requires ${productName} experience for ${company.role || 'role'}`,
                signal_date: null,
                base_confidence: SIGNAL_WEIGHTS.job_posting,
                metadata: {
                  inferred_company: company.company,
                  job_role: company.role || null,
                },
              });
            }
          }
        } catch {
          // Skip parsing errors
        }
      }
    }
  } catch (error) {
    console.error('Job signals collection error:', error);
  }

  return signals;
}
