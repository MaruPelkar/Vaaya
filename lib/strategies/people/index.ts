import { PersonData, DiscoveredPerson, getEmptyPersonData } from '@/lib/types';
import { scrapeUrl, buildCommonUrls, ScrapeResult } from '@/lib/firecrawl';
import { searchGoogle, searchLinkedInProfiles, LinkedInPerson } from '@/lib/serpapi';
import { structureContent } from '@/lib/openai';
import {
  CUSTOMER_EXTRACTION_SCHEMA,
  CUSTOMER_EXTRACTION_PROMPT,
} from './schemas';

interface PeopleStrategyResult {
  data: PersonData;
  sources: string[];
}

interface ExtractedCustomer {
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
  source_url: string | null;
}

interface ExtractedPersona {
  title: string;
  persona_type: 'user' | 'buyer' | 'evaluator';
  rationale: string;
}

interface CustomerExtractionResult {
  customers: ExtractedCustomer[];
  target_personas: ExtractedPersona[];
}

/**
 * Execute People tab strategies - discovers customers and finds relevant personas
 */
export async function executePeopleStrategies(
  domain: string,
  companyName: string
): Promise<PeopleStrategyResult> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[People] Starting data collection for ${companyName} (${domain})`);

  // Phase 1: Collect customer content from website and search
  const aggregatedContent = await collectCustomerContent(domain, companyName, sources);

  console.log(`[People] Scraped ${sources.length} sources, extracting customers with AI...`);

  // If no sources, return empty data
  if (sources.length === 0) {
    console.log(`[People] No sources available - returning empty data`);
    const elapsed = Date.now() - startTime;
    console.log(`[People] Completed in ${elapsed}ms`);
    return { data: getEmptyPersonData(), sources };
  }

  // Phase 2: Extract customers and personas using OpenAI
  const extractedData = await structureContent<CustomerExtractionResult>(
    aggregatedContent,
    CUSTOMER_EXTRACTION_PROMPT,
    CUSTOMER_EXTRACTION_SCHEMA,
    { maxTokens: 4000 }
  );

  if (!extractedData || extractedData.customers.length === 0) {
    console.log(`[People] No customers found - returning empty data`);
    const elapsed = Date.now() - startTime;
    console.log(`[People] Completed in ${elapsed}ms`);
    return { data: getEmptyPersonData(), sources };
  }

  console.log(`[People] Found ${extractedData.customers.length} customers, ${extractedData.target_personas.length} target personas`);

  // Phase 3: Lookup people at top customer companies via LinkedIn search
  const people = await lookupPeopleAtCustomers(
    extractedData.customers,
    extractedData.target_personas,
    sources
  );

  console.log(`[People] Found ${people.length} people via LinkedIn search`);

  // Phase 4: Build final PersonData
  const personData: PersonData = {
    users: people.filter(p => p.type === 'user'),
    buyers: people.filter(p => p.type === 'buyer' || p.type === 'evaluator'),
    companies_using: extractedData.customers.map(c => ({
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      size: c.size,
      confidence: c.confidence,
    })),
    generated_at: new Date().toISOString(),
  };

  const elapsed = Date.now() - startTime;
  console.log(`[People] Completed in ${elapsed}ms - Found ${personData.companies_using.length} customers, ${personData.users.length + personData.buyers.length} people`);

  return { data: personData, sources };
}

/**
 * Collect customer content from website pages and web search
 */
async function collectCustomerContent(
  domain: string,
  companyName: string,
  sources: string[]
): Promise<string> {
  const urls = buildCommonUrls(domain);
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const cleanBase = baseUrl.replace(/\/$/, '');

  // Additional customer-focused URLs
  const customerUrls = [
    `${cleanBase}/customers`,
    `${cleanBase}/case-studies`,
    `${cleanBase}/case-study`,
    `${cleanBase}/press`,
    `${cleanBase}/news`,
    `${cleanBase}/newsroom`,
  ];

  // Run all scrapers and searches in parallel
  const [
    homepageResult,
    customersPageResult,
    caseStudiesResult,
    pressResult,
    newsResult,
    newsroomResult,
    // Web searches
    customerSearchResult,
    caseStudySearchResult,
    pressSearchResult,
  ] = await Promise.allSettled([
    scrapeUrl(urls.homepage),
    scrapeUrl(customerUrls[0]),
    scrapeUrl(customerUrls[1]),
    scrapeUrl(customerUrls[3]),
    scrapeUrl(customerUrls[4]),
    scrapeUrl(customerUrls[5]),
    // Use SerpAPI for customer searches if available, fallback to Firecrawl searchWeb
    searchGoogle(`"${companyName}" customers case study`, { num: 10 }),
    searchGoogle(`"${companyName}" "powered by" OR "built with" OR "using"`, { num: 10 }),
    searchGoogle(`"${companyName}" partnership announcement press release`, { num: 10 }),
  ]);

  // Build aggregated content
  const sections: string[] = [];
  sections.push(`# Customer Discovery: ${companyName}`);
  sections.push(`Domain: ${domain}`);
  sections.push(`Analysis Date: ${new Date().toISOString().split('T')[0]}`);
  sections.push('');

  // Homepage - often has "Trusted by" section
  const homepage = extractScrapeResult(homepageResult);
  if (homepage?.markdown) {
    sources.push('homepage');
    sections.push('## Homepage Content');
    sections.push(truncateContent(homepage.markdown, 4000));
    sections.push('');
  }

  // Customers page
  const customersPage = extractScrapeResult(customersPageResult);
  if (customersPage?.markdown) {
    sources.push('customers_page');
    sections.push('## Customers Page');
    sections.push(truncateContent(customersPage.markdown, 6000));
    sections.push('');
  }

  // Case studies page
  const caseStudies = extractScrapeResult(caseStudiesResult);
  if (caseStudies?.markdown) {
    sources.push('case_studies');
    sections.push('## Case Studies Page');
    sections.push(truncateContent(caseStudies.markdown, 6000));
    sections.push('');
  }

  // Press page
  const press = extractScrapeResult(pressResult);
  if (press?.markdown) {
    sources.push('press');
    sections.push('## Press Page');
    sections.push(truncateContent(press.markdown, 4000));
    sections.push('');
  }

  // News page
  const news = extractScrapeResult(newsResult);
  if (news?.markdown) {
    sources.push('news');
    sections.push('## News Page');
    sections.push(truncateContent(news.markdown, 4000));
    sections.push('');
  }

  // Newsroom page
  const newsroom = extractScrapeResult(newsroomResult);
  if (newsroom?.markdown) {
    sources.push('newsroom');
    sections.push('## Newsroom Page');
    sections.push(truncateContent(newsroom.markdown, 4000));
    sections.push('');
  }

  // Google search results for customers
  const customerSearch = extractSerpResult(customerSearchResult);
  if (customerSearch?.results && customerSearch.results.length > 0) {
    sources.push('customer_search');
    sections.push('## Customer Search Results');
    for (const item of customerSearch.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  // Google search results for "powered by" mentions
  const poweredBySearch = extractSerpResult(caseStudySearchResult);
  if (poweredBySearch?.results && poweredBySearch.results.length > 0) {
    sources.push('powered_by_search');
    sections.push('## "Powered By" / Usage Mentions');
    for (const item of poweredBySearch.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  // Google search results for press releases
  const pressSearch = extractSerpResult(pressSearchResult);
  if (pressSearch?.results && pressSearch.results.length > 0) {
    sources.push('press_search');
    sections.push('## Press Release Search Results');
    for (const item of pressSearch.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Lookup people at customer companies using LinkedIn search via SerpAPI
 */
async function lookupPeopleAtCustomers(
  customers: ExtractedCustomer[],
  targetPersonas: ExtractedPersona[],
  sources: string[]
): Promise<DiscoveredPerson[]> {
  // Only lookup for high/medium confidence customers
  const qualifiedCustomers = customers
    .filter(c => c.confidence !== 'low')
    .slice(0, 5); // Limit to top 5 to conserve API calls

  if (qualifiedCustomers.length === 0) {
    console.log('[People] No qualified customers for LinkedIn lookup');
    return [];
  }

  // Get target titles from personas
  const targetTitles = targetPersonas.map(p => p.title);

  if (targetTitles.length === 0) {
    console.log('[People] No target personas defined');
    return [];
  }

  console.log(`[People] Looking up LinkedIn profiles for ${qualifiedCustomers.length} customers with titles: ${targetTitles.join(', ')}`);

  const allPeople: DiscoveredPerson[] = [];
  let personIndex = 0;

  // Lookup people at each customer company
  const lookupPromises = qualifiedCustomers.map(async (customer) => {
    const result = await searchLinkedInProfiles(customer.name, targetTitles, { limit: 3 });

    if (result.success && result.people && result.people.length > 0) {
      sources.push(`linkedin_${customer.name.toLowerCase().replace(/\s+/g, '_')}`);

      return result.people.map((person: LinkedInPerson) => {
        // Determine persona type based on title
        const matchedPersona = targetPersonas.find(p =>
          person.title?.toLowerCase().includes(p.title.toLowerCase().split(' ')[0]) ||
          p.title.toLowerCase().includes(person.title?.toLowerCase().split(' ')[0] || '')
        );

        const personType = matchedPersona?.persona_type || 'user';

        return {
          id: `person_${personIndex++}`,
          name: person.name,
          company: person.company || customer.name,
          role: person.title,
          type: personType,
          linkedin_url: person.linkedin_url,
          confidence_score: 0.7,
          signals: [{
            source: 'linkedin_search',
            text: `Found via LinkedIn search at ${customer.name}`,
            url: person.linkedin_url,
            date: new Date().toISOString().split('T')[0],
          }],
        } as DiscoveredPerson;
      });
    }
    return [];
  });

  const results = await Promise.allSettled(lookupPromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPeople.push(...result.value);
    }
  }

  return allPeople;
}

function extractScrapeResult(
  result: PromiseSettledResult<ScrapeResult>
): ScrapeResult | null {
  if (result.status === 'fulfilled' && result.value.success) {
    return result.value;
  }
  return null;
}

function extractSerpResult(
  result: PromiseSettledResult<{ success: boolean; results?: Array<{ title: string; link: string; snippet: string; displayed_link: string }>; error?: string }>
): { success: boolean; results?: Array<{ title: string; link: string; snippet: string; displayed_link: string }> } | null {
  if (result.status === 'fulfilled' && result.value.success) {
    return result.value;
  }
  return null;
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... [truncated]';
}
