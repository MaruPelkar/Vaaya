import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectCustomerSignals(
  productName: string,
  productDomain: string
): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];

  try {
    // Search for customer pages
    const customerResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `site:${productDomain} (customers OR pricing) "trusted by"`,
        numResults: 5,
        type: 'auto',
        contents: { text: { maxCharacters: 5000 } },
      }),
    });

    const customerData = await customerResponse.json();
    const results = customerData.results || [];

    if (!perplexityKey || results.length === 0) return signals;

    for (const result of results) {
      const companies = await extractCustomerLogos(result.text, perplexityKey);
      for (const company of companies) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'logo_wall',
          tier: SIGNAL_TIERS.logo_wall,
          source_url: result.url,
          extracted_name: null,
          extracted_company: company,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: `${company} is a customer of ${productName}`,
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.logo_wall,
          metadata: { inferred_company: company },
        });
      }
    }

    // Also search for press mentions
    const pressResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${productName}" ("partners with" OR "selects" OR "adopts" OR "chooses") company`,
        numResults: 10,
        type: 'auto',
        contents: { text: { maxCharacters: 2000 } },
      }),
    });

    const pressData = await pressResponse.json();

    for (const result of (pressData.results || []).slice(0, 8)) {
      const companies = await extractMentionedCompanies(result.text, productName, perplexityKey);
      for (const company of companies) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'press_mention',
          tier: SIGNAL_TIERS.press_mention,
          source_url: result.url,
          extracted_name: null,
          extracted_company: company,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: `${company} mentioned as ${productName} user`,
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.press_mention,
          metadata: { inferred_company: company },
        });
      }
    }
  } catch (error) {
    console.error('Customer signals collection error:', error);
  }

  return signals;
}

async function extractCustomerLogos(text: string, perplexityKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You extract company names from customer/logo pages. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract company names from this customer/logo page.

TEXT: ${text?.substring(0, 4000) || ''}

Return JSON array of company names: ["Company A", "Company B"]
Return [] if none found.`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) || [];
      }
    }
  } catch {
    // Skip errors
  }

  return [];
}

async function extractMentionedCompanies(
  text: string,
  productName: string,
  perplexityKey: string
): Promise<string[]> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You extract company names mentioned as product users. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract companies mentioned as using ${productName} in this text.

TEXT: ${text?.substring(0, 2000) || ''}

Return JSON array of company names: ["Company A", "Company B"]
Only include companies clearly identified as users/customers. Return [] if none found.`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) || [];
      }
    }
  } catch {
    // Skip errors
  }

  return [];
}
