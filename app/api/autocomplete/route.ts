import { NextRequest, NextResponse } from 'next/server';

// Domains to exclude from results (platforms, directories, research sites - not company websites)
const EXCLUDED_DOMAINS = [
  // Social media
  'linkedin.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  // Research & data platforms
  'crunchbase.com',
  'tracxn.com',
  'pitchbook.com',
  'cbinsights.com',
  'ventureradar.com',
  'owler.com',
  'zoominfo.com',
  'apollo.io',
  'leadiq.com',
  // Review sites
  'g2.com',
  'capterra.com',
  'trustradius.com',
  'glassdoor.com',
  'trustpilot.com',
  // Job sites
  'indeed.com',
  'lever.co',
  'greenhouse.io',
  'workable.com',
  'jobs.lever.co',
  // Developer platforms
  'github.com',
  'gitlab.com',
  'stackoverflow.com',
  // News & media
  'medium.com',
  'techcrunch.com',
  'forbes.com',
  'bloomberg.com',
  'reuters.com',
  'businessinsider.com',
  'venturebeat.com',
  'theverge.com',
  'wired.com',
  // Reference sites
  'wikipedia.org',
  'ycombinator.com',
  'producthunt.com',
  'angel.co',
  'wellfound.com',
  // Business directories
  'gaebler.com',
  'dnb.com',
  'manta.com',
  'yellowpages.com',
  'bbb.org',
  'chamberofcommerce.com',
  // VC / Investment sites
  'parsers.vc',
  'dealroom.co',
  'signal.nfx.com',
  'f6s.com',
];

// Check if a name/domain is relevant to the search query
function isRelevantToQuery(name: string, domain: string, query: string): boolean {
  const queryLower = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domainLower = domain.toLowerCase().replace(/[^a-z0-9]/g, '');

  // The domain or name should contain the query (or vice versa for short queries)
  return (
    domainLower.includes(queryLower) ||
    nameLower.includes(queryLower) ||
    queryLower.includes(domainLower.split('.')[0]) ||
    queryLower.includes(nameLower)
  );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Primary: Use Clearbit autocomplete (free, designed for company lookup)
    const clearbitResponse = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (clearbitResponse.ok) {
      const data = await clearbitResponse.json();
      if (data && data.length > 0) {
        // Clearbit returns: { name, domain, logo }
        return NextResponse.json(data.slice(0, 8));
      }
    }

    // Fallback: Use Exa with strict filtering
    const exaKey = process.env.EXA_API_KEY;
    if (exaKey) {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': exaKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${query} official website`,
          numResults: 30,
          type: 'auto',
          contents: {
            text: { maxCharacters: 100 },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const results: Array<{ name: string; domain: string; logo: string }> = [];
        const seenDomains = new Set<string>();

        for (const r of data.results || []) {
          let domain = '';
          try {
            const url = new URL(r.url);
            domain = url.hostname.replace('www.', '');
          } catch {
            continue;
          }

          // Skip excluded domains
          if (EXCLUDED_DOMAINS.some(excluded => domain.includes(excluded))) {
            continue;
          }

          // Skip if we've seen this domain
          if (seenDomains.has(domain)) {
            continue;
          }

          // Extract clean company name from title
          let name = r.title || domain;
          name = name.split(' - ')[0].split(' | ')[0].split(' — ')[0].trim();

          if (name.length > 40 || name.toLowerCase().includes('home') || name.toLowerCase().includes('welcome')) {
            name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
          }

          // Only include if relevant to the query
          if (!isRelevantToQuery(name, domain, query)) {
            continue;
          }

          seenDomains.add(domain);

          results.push({
            name,
            domain,
            logo: `https://logo.clearbit.com/${domain}`,
          });

          if (results.length >= 8) break;
        }

        return NextResponse.json(results);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json([]);
  }
}
