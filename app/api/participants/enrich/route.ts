import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Detect the type of profile URL
function detectProfileType(url: string): 'linkedin' | 'twitter' | 'unknown' {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'unknown';
}

// Extract username from URL
function extractUsername(url: string, type: 'linkedin' | 'twitter' | 'unknown'): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    if (type === 'linkedin') {
      // LinkedIn URLs: /in/username or /in/username/
      const match = pathname.match(/\/in\/([^\/]+)/);
      return match ? match[1] : null;
    }

    if (type === 'twitter') {
      // Twitter URLs: /username or /@username
      const match = pathname.match(/\/@?([^\/]+)/);
      return match ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const profileType = detectProfileType(url);
    const username = extractUsername(url, profileType);

    if (profileType === 'unknown') {
      return NextResponse.json({
        error: 'Unsupported URL. Please use a LinkedIn or Twitter profile URL.'
      }, { status: 400 });
    }

    // Use Firecrawl to scrape the profile page
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

    if (!firecrawlApiKey) {
      // Fallback: Just return the URL and let user fill manually
      return NextResponse.json({
        success: true,
        data: {
          linkedin_url: profileType === 'linkedin' ? url : '',
          source: profileType,
        },
        message: 'Profile URL saved. Please fill in the details manually (API key not configured).'
      });
    }

    // Scrape the profile using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
      }),
    });

    if (!scrapeResponse.ok) {
      // If scraping fails, just return the URL
      return NextResponse.json({
        success: true,
        data: {
          linkedin_url: profileType === 'linkedin' ? url : '',
          source: profileType,
        },
        message: 'Could not fetch profile data. Please fill in the details manually.'
      });
    }

    const scrapeData = await scrapeResponse.json();
    const content = scrapeData.data?.markdown || '';

    if (!content) {
      return NextResponse.json({
        success: true,
        data: {
          linkedin_url: profileType === 'linkedin' ? url : '',
          source: profileType,
        },
        message: 'No content found on profile. Please fill in the details manually.'
      });
    }

    // Use OpenAI to extract structured data from the profile
    const extractionPrompt = `Extract the following information from this ${profileType} profile content. Return a JSON object with these fields (use empty string if not found):

- full_name: The person's full name
- first_name: First name
- last_name: Last name
- job_title: Current job title
- company_name: Current company name
- company_industry: The industry of the company
- city: City location
- country: Country location
- seniority_level: One of: IC, Lead, Manager, Director, VP, C-Suite, Founder (infer from title)
- department: One of: Engineering, Product, Design, Marketing, Sales, Customer Success, Operations, HR, Finance, Other (infer from title)

Profile content:
${content.slice(0, 4000)}

Return ONLY valid JSON, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let extractedData;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch {
      extractedData = {};
    }

    return NextResponse.json({
      success: true,
      data: {
        ...extractedData,
        linkedin_url: profileType === 'linkedin' ? url : '',
        source: profileType,
      },
    });

  } catch (error) {
    console.error('Error enriching profile:', error);
    return NextResponse.json(
      { error: 'Failed to enrich profile' },
      { status: 500 }
    );
  }
}
