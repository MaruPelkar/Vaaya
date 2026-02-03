import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectTwitterSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];
  const productHandle = productName.toLowerCase().replace(/\s/g, '');

  try {
    // Search Twitter (excluding official product account)
    const [twitterResponse, xResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:twitter.com "${productName}" (love OR using OR "switched to" OR recommend) -from:${productHandle}`,
          numResults: 40,
          type: 'auto',
          contents: { text: { maxCharacters: 800 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:x.com "${productName}" (love OR using OR "big fan")`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 800 } },
        }),
      }),
    ]);

    const [twitterData, xData] = await Promise.all([
      twitterResponse.json(),
      xResponse.json(),
    ]);

    const allResults = [
      ...(twitterData.results || []),
      ...(xData.results || []),
    ];

    if (!perplexityKey || allResults.length === 0) return signals;

    // Process results in batches
    const batchSize = 10;
    for (let i = 0; i < Math.min(allResults.length, 30); i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      const batchText = batch.map((r: { url: string; text: string }, idx: number) => {
        const handleMatch = r.url.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
        const handle = handleMatch ? `@${handleMatch[1]}` : 'unknown';
        return `[${idx}] Handle: ${handle}\nURL: ${r.url}\nText: ${r.text?.substring(0, 400) || ''}`;
      }).join('\n---\n');

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
              content: 'You extract Twitter user information. Return valid JSON only.',
            },
            {
              role: 'user',
              content: `Extract Twitter users from these tweets about ${productName}.

${batchText}

Return JSON array:
[{
  "index": number (0-${batch.length - 1}),
  "handle": "@username",
  "name": "Display Name" or null,
  "bio_role": "Role from bio" or null,
  "company": "Company" or null,
  "tweet": "The tweet text snippet"
}]

Skip promotional or affiliate tweets. Only genuine users. Return [] if none found.`,
            },
          ],
          max_tokens: 1500,
        }),
      });

      const extractData = await extractResponse.json();
      const content = extractData.choices?.[0]?.message?.content;

      if (content) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const users = JSON.parse(jsonMatch[0]);
            for (const user of users) {
              const result = batch[user.index];
              if (!result) continue;

              signals.push({
                id: crypto.randomUUID(),
                source: 'twitter_post',
                tier: SIGNAL_TIERS.twitter_post,
                source_url: result.url,
                extracted_name: user.name || null,
                extracted_company: user.company || null,
                extracted_role: user.bio_role || null,
                extracted_linkedin: null,
                extracted_twitter: user.handle || null,
                extracted_github: null,
                extracted_email: null,
                signal_text: user.tweet || '',
                signal_date: null,
                base_confidence: SIGNAL_WEIGHTS.twitter_post,
              });
            }
          }
        } catch {
          // Skip parsing errors
        }
      }
    }
  } catch (error) {
    console.error('Twitter signals collection error:', error);
  }

  return signals;
}
