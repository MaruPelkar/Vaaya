import { Tab1Data } from '@/lib/types';

export async function getPerplexitySummary(
  companyName: string,
  domain: string
): Promise<Partial<Tab1Data> | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

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
            role: 'system',
            content: 'You are a business intelligence analyst. Research companies thoroughly and provide accurate, structured data. Return valid JSON only. For unknown fields, use null. Do not make up data.',
          },
          {
            role: 'user',
            content: `Research "${companyName}" (${domain}) comprehensively. Return this exact JSON structure:

{
  "description": "2-3 sentence company description",
  "founded": year as number or null,
  "headquarters": "City, State/Country" or null,
  "employee_range": "e.g. 100-500" or null,
  "employee_count": estimated number or null,
  "employee_growth_rate": "e.g. +25% YoY" or null,
  "industry": "primary industry" or null,

  "status": "active" | "acquired" | "ipo" | "shut_down",
  "acquired_by": "acquirer company name" or null,
  "acquisition_date": "YYYY-MM" or null,
  "ipo_date": "YYYY-MM" or null,
  "stock_symbol": "e.g. NASDAQ:AAPL" or null,

  "funding": {
    "total": "e.g. $100M" or null,
    "last_round": "e.g. Series B" or null,
    "last_round_date": "YYYY-MM" or null,
    "investors": ["notable investor names"]
  },

  "funding_rounds": [
    {
      "round_type": "e.g. Seed, Series A",
      "amount": "e.g. $5M" or null,
      "date": "YYYY-MM" or null,
      "valuation": "e.g. $50M" or null,
      "lead_investors": ["lead investor names"]
    }
  ],

  "employee_trend": [
    {"date": "YYYY-MM", "count": number}
  ],

  "acquisitions": [
    {
      "company_name": "acquired company",
      "date": "YYYY-MM" or null,
      "amount": "e.g. $10M" or null,
      "description": "brief description" or null
    }
  ],

  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitor.com" or null,
      "description": "how they compete" or null
    }
  ],

  "leadership": [
    {"name": "Full Name", "title": "Job Title", "linkedin_url": null}
  ],

  "socials": {
    "twitter": "full URL or null",
    "linkedin": "full URL or null",
    "github": "full URL or null"
  }
}

Include up to 5 funding rounds (most recent first), 3 acquisitions, 5 competitors, 5 leaders.
Only return the JSON, no other text.`,
          },
        ],
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Normalize status value
        if (parsed.status) {
          const statusMap: Record<string, Tab1Data['status']> = {
            'active': 'active',
            'acquired': 'acquired',
            'ipo': 'ipo',
            'public': 'ipo',
            'shut_down': 'shut_down',
            'shutdown': 'shut_down',
            'closed': 'shut_down',
          };
          parsed.status = statusMap[parsed.status.toLowerCase()] || 'active';
        }

        return parsed;
      }
    }

    return null;
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
  }
}
