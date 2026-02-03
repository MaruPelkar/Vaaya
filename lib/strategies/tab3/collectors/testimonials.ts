import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectTestimonialSignals(
  productName: string,
  productDomain: string
): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];

  const signals: RawSignal[] = [];

  try {
    // Search for testimonials and case studies
    const [testimonialResponse, caseStudyResponse, externalResponse] = await Promise.all([
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:${productDomain} (testimonial OR "customer stories" OR "what customers say" OR customers)`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 5000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:${productDomain} ("case study" OR "success story" OR "customer story")`,
          numResults: 10,
          type: 'auto',
          contents: { text: { maxCharacters: 5000 } },
        }),
      }),
      fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${productName}" ("case study" OR testimonial) (CEO OR founder OR "head of" OR director)`,
          numResults: 15,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      }),
    ]);

    const [testimonialData, caseStudyData, externalData] = await Promise.all([
      testimonialResponse.json(),
      caseStudyResponse.json(),
      externalResponse.json(),
    ]);

    if (!perplexityKey) return signals;

    // Process testimonials
    for (const result of (testimonialData.results || []).slice(0, 5)) {
      const people = await extractTestimonialPeople(result.text, productName, perplexityKey);
      for (const person of people) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'testimonial',
          tier: SIGNAL_TIERS.testimonial,
          source_url: result.url,
          extracted_name: person.name || null,
          extracted_company: person.company || null,
          extracted_role: person.role || null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: person.quote || '',
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.testimonial,
        });
      }
    }

    // Process case studies
    const caseStudyResults = [
      ...(caseStudyData.results || []).slice(0, 5),
      ...(externalData.results || []).slice(0, 5),
    ];

    for (const result of caseStudyResults) {
      const people = await extractTestimonialPeople(result.text, productName, perplexityKey);
      for (const person of people) {
        signals.push({
          id: crypto.randomUUID(),
          source: 'case_study',
          tier: SIGNAL_TIERS.case_study,
          source_url: result.url,
          extracted_name: person.name || null,
          extracted_company: person.company || null,
          extracted_role: person.role || null,
          extracted_linkedin: null,
          extracted_twitter: null,
          extracted_github: null,
          extracted_email: null,
          signal_text: person.quote || '',
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.case_study,
        });
      }
    }
  } catch (error) {
    console.error('Testimonial signals collection error:', error);
  }

  return signals;
}

async function extractTestimonialPeople(
  text: string,
  productName: string,
  perplexityKey: string
): Promise<Array<{ name: string; role: string | null; company: string | null; quote: string }>> {
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
            content: 'You extract people from testimonials and case studies. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Extract people quoted or featured in this testimonial/case study for ${productName}.

TEXT: ${text?.substring(0, 4000) || ''}

Return JSON array:
[{
  "name": "Full Name",
  "role": "Job Title" or null,
  "company": "Company" or null,
  "quote": "Their quote (1-2 sentences)"
}]

Only include named individuals. Return [] if none found.`,
          },
        ],
        max_tokens: 1500,
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
