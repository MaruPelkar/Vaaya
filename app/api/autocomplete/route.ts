import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Using Exa to search for companies as an alternative to Clearbit
    const exaKey = process.env.EXA_API_KEY;

    if (exaKey) {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': exaKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${query} company`,
          numResults: 8,
          type: 'auto',
          contents: {
            text: { maxCharacters: 200 },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).map((r: { url: string; title?: string }) => {
          let domain = '';
          try {
            domain = new URL(r.url).hostname.replace('www.', '');
          } catch {
            domain = r.url;
          }
          return {
            name: r.title?.split(' - ')[0]?.split(' | ')[0] || domain,
            domain: domain,
            logo: `https://logo.clearbit.com/${domain}`,
          };
        });

        // Deduplicate by domain
        const seen = new Set();
        const unique = results.filter((r: { domain: string }) => {
          if (seen.has(r.domain)) return false;
          seen.add(r.domain);
          return true;
        });

        return NextResponse.json(unique.slice(0, 8));
      }
    }

    // Fallback: Try Clearbit autocomplete (works without API key)
    const clearbitResponse = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (clearbitResponse.ok) {
      const data = await clearbitResponse.json();
      return NextResponse.json(data.slice(0, 8));
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json([]);
  }
}
