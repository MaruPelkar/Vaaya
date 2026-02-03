import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectForumSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const signals: RawSignal[] = [];

  try {
    // Reddit posts
    if (exaKey) {
      const redditResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:reddit.com "${productName}" (using OR love OR "switched to" OR recommend)`,
          numResults: 30,
          type: 'auto',
          contents: { text: { maxCharacters: 1500 } },
        }),
      });

      const redditData = await redditResponse.json();

      for (const result of (redditData.results || []).slice(0, 20)) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'reddit_post',
          tier: SIGNAL_TIERS.reddit_post,
          source_url: result.url,
          extracted_name: null, // Reddit is pseudonymous
          extracted_company: null,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: result.text?.substring(0, 300) || '',
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.reddit_post,
        });
      }

      // Stack Overflow
      const soResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:stackoverflow.com "${productName}"`,
          numResults: 20,
          type: 'auto',
          contents: { text: { maxCharacters: 1000 } },
        }),
      });

      const soData = await soResponse.json();

      for (const result of (soData.results || []).slice(0, 15)) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'stackoverflow',
          tier: SIGNAL_TIERS.stackoverflow,
          source_url: result.url,
          extracted_name: null,
          extracted_company: null,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: result.text?.substring(0, 300) || '',
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.stackoverflow,
        });
      }
    }

    // Hacker News via Algolia (free API)
    const hnResponse = await fetch(
      `https://hn.algolia.com/api/v1/search?query="${encodeURIComponent(productName)}"&tags=comment&hitsPerPage=30`
    );

    if (hnResponse.ok) {
      const hnData = await hnResponse.json();

      for (const hit of (hnData.hits || []).slice(0, 20)) {
        if (!hit.author || !hit.comment_text) continue;

        // Check if it's a usage signal
        const text = hit.comment_text.toLowerCase();
        const isUsageSignal = ['i use', 'we use', 'been using', 'switched to', 'love using', 'recommend'].some(
          p => text.includes(p)
        );

        if (isUsageSignal) {
          signals.push({
            id: crypto.randomUUID(),
            source: 'hn_comment',
            tier: SIGNAL_TIERS.hn_comment,
            source_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            extracted_name: null,
            extracted_company: null,
            extracted_role: null,
            extracted_linkedin: null,
            extracted_twitter: null,
            extracted_github: null,
            extracted_email: null,
            signal_text: hit.comment_text.substring(0, 300),
            signal_date: hit.created_at?.substring(0, 10) || null,
            base_confidence: SIGNAL_WEIGHTS.hn_comment,
            metadata: { hn_user: hit.author },
          });
        }
      }
    }
  } catch (error) {
    console.error('Forum signals collection error:', error);
  }

  return signals;
}
