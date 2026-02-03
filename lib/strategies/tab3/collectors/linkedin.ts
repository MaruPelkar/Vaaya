import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectLinkedInSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];

  try {
    // Search for LinkedIn posts mentioning the product
    const [postsResponse, articlesResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:linkedin.com/posts "${productName}" (love OR using OR "switched to" OR "game changer" OR recommend OR built)`,
          numResults: 40,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:linkedin.com/pulse "${productName}"`,
          numResults: 15,
          type: 'auto',
          contents: { text: { maxCharacters: 2000 } },
        }),
      }),
    ]);

    const [postsData, articlesData] = await Promise.all([
      postsResponse.json(),
      articlesResponse.json(),
    ]);

    const allResults = [
      ...(postsData.results || []),
      ...(articlesData.results || []),
    ];

    if (!perplexityKey || allResults.length === 0) return signals;

    // Process each result
    for (const result of allResults.slice(0, 30)) {
      // Try to extract profile URL from post URL
      const profileMatch = result.url.match(/linkedin\.com\/in\/([^\/]+)/);
      const linkedinUrl = profileMatch ? `https://linkedin.com/in/${profileMatch[1]}` : null;

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
              content: 'You extract LinkedIn post author information. Return valid JSON only.',
            },
            {
              role: 'user',
              content: `Extract the author of this LinkedIn post about ${productName}.

URL: ${result.url}
TEXT: ${result.text?.substring(0, 2000) || ''}

Return JSON (or null if cannot extract):
{
  "name": "Full Name",
  "role": "Job Title" or null,
  "company": "Company Name" or null,
  "linkedin_url": "${linkedinUrl || 'null'}",
  "quote": "Key part where they mention ${productName}",
  "date": "YYYY-MM" or null
}

Only return if person clearly USES the product, not just mentions it. Skip company official accounts.`,
            },
          ],
          max_tokens: 500,
        }),
      });

      const extractData = await extractResponse.json();
      const content = extractData.choices?.[0]?.message?.content;

      if (content && content !== 'null') {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const author = JSON.parse(jsonMatch[0]);
            if (author && author.name) {
              signals.push({
                id: crypto.randomUUID(),
                source: 'linkedin_post',
                tier: SIGNAL_TIERS.linkedin_post,
                source_url: result.url,
                extracted_name: author.name,
                extracted_company: author.company || null,
                extracted_role: author.role || null,
                extracted_linkedin: author.linkedin_url || linkedinUrl,
                extracted_twitter: null,
                extracted_github: null,
                extracted_email: null,
                signal_text: author.quote || '',
                signal_date: author.date || null,
                base_confidence: SIGNAL_WEIGHTS.linkedin_post,
              });
            }
          }
        } catch {
          // Skip parsing errors
        }
      }
    }
  } catch (error) {
    console.error('LinkedIn signals collection error:', error);
  }

  return signals;
}
