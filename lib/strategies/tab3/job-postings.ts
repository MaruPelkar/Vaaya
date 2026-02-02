import { RawUserSignal } from './types';

export async function searchJobPostings(companyName: string): Promise<RawUserSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const signals: RawUserSignal[] = [];

  try {
    // Find job postings that require experience with the product
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"experience with ${companyName}" OR "${companyName} required" OR "${companyName} preferred" job`,
        numResults: 15,
        type: 'auto',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (!response.ok) return signals;

    const data = await response.json();

    // For job postings, we infer the company uses the product
    for (const result of (data.results || []).slice(0, 10)) {
      const hiringCompany = extractHiringCompany(result.text || '', result.title || '');
      if (hiringCompany) {
        signals.push({
          name: `[${hiringCompany} Team]`,
          title: 'Team Member',
          company: hiringCompany,
          signalType: 'job_posting_inference',
          confidence: 0.50,
          snippet: `Job posting requires ${companyName} experience`,
          url: result.url,
          date: result.publishedDate,
        });
      }
    }
  } catch (error) {
    console.error('Job postings search error:', error);
  }

  return signals;
}

function extractHiringCompany(text: string, title: string): string | null {
  const patterns = [
    /at\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+is|\s+-|\s+\||\s+•|,|$)/,
    /([A-Z][a-zA-Z0-9\s&]+?)\s+is\s+hiring/,
    /Join\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+as|\s+-|\s+\||$)/,
    /([A-Z][a-zA-Z0-9\s&]+?)\s+(?:seeks|looking for)/i,
  ];

  const combined = `${title} ${text}`;

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      return match[1].trim();
    }
  }

  return null;
}
