// SerpAPI client for Google search and LinkedIn profile discovery

const serpApiKey = process.env.SERP_API_KEY;

if (!serpApiKey) {
  console.warn('SERP_API_KEY is not set. SerpAPI features will be disabled.');
}

const SERPAPI_BASE_URL = 'https://serpapi.com/search';

export interface SerpSearchResult {
  success: boolean;
  results?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayed_link: string;
  }>;
  error?: string;
}

export interface LinkedInPerson {
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string;
}

export interface LinkedInSearchResult {
  success: boolean;
  people?: LinkedInPerson[];
  error?: string;
}

/**
 * Search Google using SerpAPI
 */
export async function searchGoogle(
  query: string,
  options?: {
    num?: number;
    gl?: string;
  }
): Promise<SerpSearchResult> {
  if (!serpApiKey) {
    return { success: false, error: 'SERP_API_KEY not configured' };
  }

  const params = new URLSearchParams({
    api_key: serpApiKey,
    engine: 'google',
    q: query,
    num: String(options?.num || 10),
    gl: options?.gl || 'us',
  });

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${params}`);

    if (!response.ok) {
      return { success: false, error: `SerpAPI error: ${response.status}` };
    }

    const data = await response.json();

    return {
      success: true,
      results: data.organic_results?.map((r: Record<string, string>) => ({
        title: r.title || '',
        link: r.link || '',
        snippet: r.snippet || '',
        displayed_link: r.displayed_link || '',
      })) || [],
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`SerpAPI search error for "${query}":`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Parse LinkedIn profile info from a Google search result title
 * Typical format: "John Smith - VP Engineering - Acme Corp | LinkedIn"
 */
function parseLinkedInTitle(title: string, link: string): LinkedInPerson | null {
  // Remove " | LinkedIn" suffix
  const cleanTitle = title.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();

  // Split by " - " to get parts
  const parts = cleanTitle.split(/\s+-\s+/).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length === 0) {
    return null;
  }

  // First part is usually the name
  const name = parts[0];

  // Try to find title and company from remaining parts
  let personTitle: string | null = null;
  let company: string | null = null;

  if (parts.length >= 3) {
    // Format: "Name - Title - Company"
    personTitle = parts[1];
    company = parts[2];
  } else if (parts.length === 2) {
    // Format: "Name - Title" or "Name - Company"
    // Heuristic: if it contains common title keywords, it's a title
    const secondPart = parts[1];
    const titleKeywords = [
      'engineer', 'manager', 'director', 'vp', 'vice president', 'head',
      'lead', 'chief', 'cto', 'ceo', 'cfo', 'founder', 'co-founder',
      'developer', 'designer', 'analyst', 'consultant', 'specialist',
      'coordinator', 'associate', 'senior', 'junior', 'principal'
    ];

    const isLikelyTitle = titleKeywords.some(kw =>
      secondPart.toLowerCase().includes(kw)
    );

    if (isLikelyTitle) {
      personTitle = secondPart;
    } else {
      company = secondPart;
    }
  }

  return {
    name,
    title: personTitle,
    company,
    linkedin_url: link,
  };
}

/**
 * Search for LinkedIn profiles at a specific company matching given job titles
 */
export async function searchLinkedInProfiles(
  companyName: string,
  titles: string[],
  options?: {
    limit?: number;
  }
): Promise<LinkedInSearchResult> {
  if (!serpApiKey) {
    return { success: false, error: 'SERP_API_KEY not configured' };
  }

  // Build OR query for titles
  const titleQuery = titles.map(t => `"${t}"`).join(' OR ');

  // Search query: site:linkedin.com/in "company" ("title1" OR "title2")
  const query = `site:linkedin.com/in "${companyName}" (${titleQuery})`;

  const limit = options?.limit || 5;

  try {
    const searchResult = await searchGoogle(query, { num: limit });

    if (!searchResult.success || !searchResult.results) {
      return { success: false, error: searchResult.error || 'Search failed' };
    }

    const people: LinkedInPerson[] = [];

    for (const result of searchResult.results) {
      // Only process actual LinkedIn profile URLs
      if (!result.link.includes('linkedin.com/in/')) {
        continue;
      }

      const person = parseLinkedInTitle(result.title, result.link);
      if (person) {
        // If we couldn't extract company from title, use the search company
        if (!person.company) {
          person.company = companyName;
        }
        people.push(person);
      }
    }

    return {
      success: true,
      people,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`LinkedIn search error for "${companyName}":`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Search for customer mentions of a company
 */
export async function searchCustomerMentions(
  companyName: string,
  options?: {
    limit?: number;
  }
): Promise<SerpSearchResult> {
  // Search for case studies, customer stories, and testimonials
  const query = `"${companyName}" ("case study" OR "customer story" OR "testimonial" OR "powered by" OR "using ${companyName}")`;

  return searchGoogle(query, { num: options?.limit || 10 });
}

// ============================================================================
// High-Intent Discovery Search Functions
// ============================================================================

/**
 * Search for product reviews on G2
 */
export async function searchG2Reviews(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  const query = `site:g2.com/products "${productName}" reviews`;
  return searchGoogle(query, { num: options?.limit || 10 });
}

/**
 * Search for product reviews on Capterra
 */
export async function searchCapterraReviews(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  const query = `site:capterra.com "${productName}" reviews`;
  return searchGoogle(query, { num: options?.limit || 10 });
}

/**
 * Search for product on Product Hunt
 */
export async function searchProductHunt(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  const query = `site:producthunt.com/posts "${productName}"`;
  return searchGoogle(query, { num: options?.limit || 5 });
}

/**
 * Search for job postings that mention experience with a specific product/tool
 */
export async function searchJobPostings(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  // Search across multiple job sites for positions requiring the product
  const query = `("experience with ${productName}" OR "${productName} required" OR "${productName} preferred") (site:linkedin.com/jobs OR site:indeed.com OR site:greenhouse.io OR site:lever.co OR site:jobs.ashbyhq.com)`;
  return searchGoogle(query, { num: options?.limit || 15 });
}

/**
 * Search for LinkedIn posts mentioning the product (user testimonials, implementation stories)
 */
export async function searchLinkedInPosts(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  // Search for LinkedIn posts/articles from actual users
  const query = `site:linkedin.com ("we use ${productName}" OR "switched to ${productName}" OR "implemented ${productName}" OR "love using ${productName}" OR "${productName} has been" OR "our team uses ${productName}")`;
  return searchGoogle(query, { num: options?.limit || 10 });
}

/**
 * Search for YouTube videos about the product (demos, webinars, tutorials, case studies)
 */
export async function searchYouTubeVideos(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  const query = `site:youtube.com "${productName}" (demo OR webinar OR tutorial OR "case study" OR review OR walkthrough)`;
  return searchGoogle(query, { num: options?.limit || 10 });
}

/**
 * Search for webinar and conference content featuring the product
 */
export async function searchWebinars(
  productName: string,
  options?: { limit?: number }
): Promise<SerpSearchResult> {
  const query = `"${productName}" (webinar OR "customer story" OR "case study" OR conference OR summit) (speaker OR presenter OR featuring)`;
  return searchGoogle(query, { num: options?.limit || 10 });
}

export { serpApiKey };
