// Nyne.ai API client for person search and enrichment

const nyneApiKey = process.env.NYNE_API_KEY;
const nyneApiSecret = process.env.NYNE_API_KEY_SECRET;

if (!nyneApiKey || !nyneApiSecret) {
  console.warn('NYNE_API_KEY or NYNE_API_KEY_SECRET is not set. Nyne.ai features will be disabled.');
}

const NYNE_BASE_URL = 'https://api.nyne.ai';

/**
 * Build authentication headers for Nyne API
 * Uses X-API-Key and X-API-Secret headers as per documentation
 */
function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': nyneApiKey || '',
    'X-API-Secret': nyneApiSecret || '',
  };
}

// ============================================================================
// Types
// ============================================================================

export interface NynePersonResult {
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
}

export interface NynePersonSearchResult {
  success: boolean;
  people?: NynePersonResult[];
  error?: string;
}

// ============================================================================
// Person Search API
// ============================================================================

/**
 * Search for people at a specific company matching given job titles
 * Uses Nyne.ai Person Search API for accurate, verified results
 */
export async function searchPeopleAtCompany(
  company: string,
  titles: string[],
  options?: {
    limit?: number;
    location?: string;
  }
): Promise<NynePersonSearchResult> {
  if (!nyneApiKey || !nyneApiSecret) {
    return { success: false, error: 'NYNE_API_KEY or NYNE_API_KEY_SECRET not configured' };
  }

  const limit = options?.limit || 5;

  try {
    // Search for each title separately for better results
    const allPeople: NynePersonResult[] = [];
    const seenNames = new Set<string>();

    for (const title of titles.slice(0, 3)) { // Limit to 3 titles to conserve credits
      if (allPeople.length >= limit) break;

      const query = `${title} at ${company}`;
      console.log(`[Nyne] Searching: "${query}"`);

      const response = await fetch(`${NYNE_BASE_URL}/person/search`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query,
          limit: Math.min(limit - allPeople.length, 3),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Nyne] API error for "${company}" + "${title}":`, response.status, errorText);
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.error(`[Nyne] Search failed for "${title}" at "${company}":`, data.error);
        continue;
      }

      // Check if async processing - need to poll for results
      const responseData = data.data as Record<string, unknown>;
      if (responseData?.status === 'processing' && responseData?.request_id) {
        const requestId = String(responseData.request_id);
        console.log(`[Nyne] Polling for results (request_id: ${requestId})...`);

        // Poll for results (max 10 attempts, 1 second apart)
        const results = await pollForResults(requestId);
        if (results) {
          for (const person of results) {
            if (person.name && !seenNames.has(person.name.toLowerCase())) {
              seenNames.add(person.name.toLowerCase());
              allPeople.push(person);
            }
          }
        }
      } else if (responseData?.status === 'completed') {
        // Results returned immediately
        const people = mapNyneResponse(data);
        for (const person of people) {
          if (person.name && !seenNames.has(person.name.toLowerCase())) {
            seenNames.add(person.name.toLowerCase());
            allPeople.push(person);
          }
        }
      }

      // Small delay between requests
      await delay(300);
    }

    console.log(`[Nyne] Found ${allPeople.length} total people at "${company}"`);
    return { success: true, people: allPeople };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Nyne] Person search error for "${company}":`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Poll for async search results
 * Nyne API processes searches asynchronously - we need to poll GET endpoint
 */
async function pollForResults(requestId: string, maxAttempts = 10): Promise<NynePersonResult[] | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await delay(1000); // Wait 1 second between polls

    try {
      const response = await fetch(
        `${NYNE_BASE_URL}/person/search?request_id=${encodeURIComponent(requestId)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        console.error(`[Nyne] Poll error (attempt ${attempt + 1}):`, response.status);
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.error(`[Nyne] Poll failed:`, data.error);
        return null;
      }

      const responseData = data.data as Record<string, unknown>;
      const status = responseData?.status;

      if (status === 'completed') {
        const people = mapNyneResponse(data);
        console.log(`[Nyne] Poll completed: found ${people.length} people`);
        return people;
      } else if (status === 'processing') {
        console.log(`[Nyne] Still processing (attempt ${attempt + 1}/${maxAttempts})...`);
      } else {
        console.log(`[Nyne] Unknown status: ${status}`);
        return null;
      }
    } catch (error) {
      console.error(`[Nyne] Poll error:`, error);
    }
  }

  console.log(`[Nyne] Polling timed out after ${maxAttempts} attempts`);
  return null;
}

// ============================================================================
// Batch Person Search
// ============================================================================

/**
 * Search for people at multiple companies in parallel
 * Useful when we've discovered multiple customer companies
 */
export async function searchPeopleAtCompanies(
  companies: Array<{ name: string; domain?: string }>,
  titles: string[],
  options?: {
    limitPerCompany?: number;
    delayBetweenRequests?: number;
  }
): Promise<NynePersonSearchResult> {
  if (!nyneApiKey || !nyneApiSecret) {
    return { success: false, error: 'NYNE_API_KEY or NYNE_API_KEY_SECRET not configured' };
  }

  const limitPerCompany = options?.limitPerCompany || 3;
  const delayMs = options?.delayBetweenRequests || 200;

  const allPeople: NynePersonResult[] = [];

  for (const company of companies) {
    const result = await searchPeopleAtCompany(company.name, titles, {
      limit: limitPerCompany,
    });

    if (result.success && result.people) {
      allPeople.push(...result.people);
    }

    // Small delay between companies to avoid rate limiting
    if (delayMs > 0 && companies.indexOf(company) < companies.length - 1) {
      await delay(delayMs);
    }
  }

  console.log(`[Nyne] Found ${allPeople.length} total people across ${companies.length} companies`);

  return {
    success: true,
    people: allPeople,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map Nyne API response to our interface
 * Response format: { success: true, data: { results: [...] } }
 */
function mapNyneResponse(data: Record<string, unknown>): NynePersonResult[] {
  // Navigate to results array: data.data.results
  const responseData = data.data as Record<string, unknown> | undefined;
  if (!responseData) return [];

  const results = responseData.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(results)) return [];

  return results.map(mapNynePerson).filter(p => p.name); // Filter out empty names
}

/**
 * Map a single Nyne person record to our interface
 * Based on Nyne API response format
 */
function mapNynePerson(data: Record<string, unknown>): NynePersonResult {
  // Extract LinkedIn URL from social_profiles
  let linkedinUrl: string | null = null;
  const socialProfiles = data.social_profiles as Record<string, { url?: string }> | undefined;
  if (socialProfiles?.linkedin?.url) {
    linkedinUrl = socialProfiles.linkedin.url;
  }

  // Extract current company/title from organizations
  let company: string | null = null;
  let title: string | null = null;
  const organizations = data.organizations as Array<{ name?: string; title?: string }> | undefined;
  if (organizations && organizations.length > 0) {
    company = organizations[0].name || null;
    title = organizations[0].title || null;
  }

  // Extract phone from fullphone array
  let phone: string | null = null;
  const phoneArray = data.fullphone as Array<{ fullphone?: string }> | undefined;
  if (phoneArray && phoneArray.length > 0) {
    phone = phoneArray[0].fullphone || null;
  }

  // Use headline as fallback for title
  if (!title && data.headline) {
    title = String(data.headline);
  }

  return {
    name: String(data.displayname || data.name || ''),
    title,
    company,
    linkedin_url: linkedinUrl,
    email: data.best_business_email ? String(data.best_business_email) : null,
    phone,
  };
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { nyneApiKey };
