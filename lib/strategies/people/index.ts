import { PersonData, DiscoveredPerson, getEmptyPersonData } from '@/lib/types';
import { scrapeUrl, buildCommonUrls, ScrapeResult } from '@/lib/firecrawl';
import {
  searchGoogle,
  searchG2Reviews,
  searchCapterraReviews,
  searchProductHunt,
  searchJobPostings,
  searchLinkedInPosts,
  searchYouTubeVideos,
  searchWebinars,
  SerpSearchResult,
} from '@/lib/serpapi';
import { searchPeopleAtCompany, NynePersonResult } from '@/lib/nyne';
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
 * Uses multiple high-intent discovery paths and Nyne.ai for accurate person lookup
 */
export async function executePeopleStrategies(
  domain: string,
  companyName: string
): Promise<PeopleStrategyResult> {
  const sources: string[] = [];
  const startTime = Date.now();

  console.log(`[People] Starting data collection for ${companyName} (${domain})`);

  // Phase 1: Collect content from multiple discovery sources (sequential with delays)
  const contentSections: string[] = [];

  // Group 1: Website content (existing strategy)
  console.log('[People] Phase 1.1: Collecting website content...');
  const websiteContent = await collectCustomerContent(domain, companyName, sources);
  contentSections.push(websiteContent);
  await delay(500);

  // Group 2: Review platforms (G2, Capterra, Product Hunt)
  console.log('[People] Phase 1.2: Collecting review content...');
  const reviewContent = await collectReviewContent(companyName, sources);
  contentSections.push(reviewContent);
  await delay(500);

  // Group 3: Job postings mentioning the product
  console.log('[People] Phase 1.3: Collecting job posting content...');
  const jobContent = await collectJobPostingContent(companyName, sources);
  contentSections.push(jobContent);
  await delay(500);

  // Group 4: LinkedIn posts about the product
  console.log('[People] Phase 1.4: Collecting LinkedIn post content...');
  const linkedInContent = await collectLinkedInPostContent(companyName, sources);
  contentSections.push(linkedInContent);
  await delay(500);

  // Group 5: Webinars and YouTube content
  console.log('[People] Phase 1.5: Collecting webinar/video content...');
  const webinarContent = await collectWebinarContent(companyName, sources);
  contentSections.push(webinarContent);

  // Aggregate all content
  const aggregatedContent = contentSections.filter(c => c.trim()).join('\n\n---\n\n');

  console.log(`[People] Collected from ${sources.length} sources, extracting customers with AI...`);

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
    { maxTokens: 6000 }
  );

  if (!extractedData || extractedData.customers.length === 0) {
    console.log(`[People] No customers found - returning empty data`);
    const elapsed = Date.now() - startTime;
    console.log(`[People] Completed in ${elapsed}ms`);
    return { data: getEmptyPersonData(), sources };
  }

  console.log(`[People] Found ${extractedData.customers.length} customers, ${extractedData.target_personas.length} target personas`);

  // Phase 3: Lookup people at top customer companies via Nyne.ai API
  const people = await lookupPeopleAtCustomers(
    extractedData.customers,
    extractedData.target_personas,
    sources
  );

  console.log(`[People] Found ${people.length} people via Nyne.ai search`);

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
 * Helper to add delay between API call groups
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * Collect content from review platforms (G2, Capterra, Product Hunt)
 * High-intent signal: reviewers have directly used the product
 */
async function collectReviewContent(
  companyName: string,
  sources: string[]
): Promise<string> {
  const sections: string[] = [];
  sections.push('# Review Platform Discovery');
  sections.push('');

  const [g2Result, capterraResult, phResult] = await Promise.allSettled([
    searchG2Reviews(companyName, { limit: 10 }),
    searchCapterraReviews(companyName, { limit: 10 }),
    searchProductHunt(companyName, { limit: 5 }),
  ]);

  // G2 Reviews
  const g2 = extractSerpResult(g2Result);
  if (g2?.results && g2.results.length > 0) {
    sources.push('g2_reviews');
    sections.push('## G2 Reviews');
    for (const item of g2.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  // Capterra Reviews
  const capterra = extractSerpResult(capterraResult);
  if (capterra?.results && capterra.results.length > 0) {
    sources.push('capterra_reviews');
    sections.push('## Capterra Reviews');
    for (const item of capterra.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  // Product Hunt
  const ph = extractSerpResult(phResult);
  if (ph?.results && ph.results.length > 0) {
    sources.push('producthunt');
    sections.push('## Product Hunt');
    for (const item of ph.results.slice(0, 5)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Collect content from job postings mentioning the product
 * High-intent signal: companies actively hiring people with product experience
 */
async function collectJobPostingContent(
  companyName: string,
  sources: string[]
): Promise<string> {
  const sections: string[] = [];
  sections.push('# Job Posting Discovery');
  sections.push('');

  const jobResult = await searchJobPostings(companyName, { limit: 15 });

  if (jobResult.success && jobResult.results && jobResult.results.length > 0) {
    sources.push('job_postings');
    sections.push('## Job Postings Requiring Product Experience');
    sections.push(`Found ${jobResult.results.length} job postings mentioning "${companyName}"`);
    sections.push('');

    for (const item of jobResult.results.slice(0, 15)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Collect content from LinkedIn posts about the product
 * High-intent signal: users publicly sharing their experience
 */
async function collectLinkedInPostContent(
  companyName: string,
  sources: string[]
): Promise<string> {
  const sections: string[] = [];
  sections.push('# LinkedIn Post Discovery');
  sections.push('');

  const linkedInResult = await searchLinkedInPosts(companyName, { limit: 10 });

  if (linkedInResult.success && linkedInResult.results && linkedInResult.results.length > 0) {
    sources.push('linkedin_posts');
    sections.push('## LinkedIn Posts About Product');
    sections.push(`Found ${linkedInResult.results.length} LinkedIn posts mentioning "${companyName}"`);
    sections.push('');

    for (const item of linkedInResult.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Collect content from YouTube videos and webinars about the product
 * High-intent signal: speakers and presenters are often customers or partners
 */
async function collectWebinarContent(
  companyName: string,
  sources: string[]
): Promise<string> {
  const sections: string[] = [];
  sections.push('# Video & Webinar Discovery');
  sections.push('');

  const [youtubeResult, webinarResult] = await Promise.allSettled([
    searchYouTubeVideos(companyName, { limit: 10 }),
    searchWebinars(companyName, { limit: 10 }),
  ]);

  // YouTube Videos
  const youtube = extractSerpResult(youtubeResult);
  if (youtube?.results && youtube.results.length > 0) {
    sources.push('youtube_videos');
    sections.push('## YouTube Videos');
    for (const item of youtube.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  // Webinars
  const webinar = extractSerpResult(webinarResult);
  if (webinar?.results && webinar.results.length > 0) {
    sources.push('webinars');
    sections.push('## Webinars & Conferences');
    for (const item of webinar.results.slice(0, 10)) {
      sections.push(`### ${item.title}`);
      sections.push(`URL: ${item.link}`);
      sections.push(item.snippet);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Lookup people at customer companies using Nyne.ai API for verified results
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
    console.log('[People] No qualified customers for person lookup');
    return [];
  }

  // Get target titles from personas
  const targetTitles = targetPersonas.map(p => p.title);

  if (targetTitles.length === 0) {
    console.log('[People] No target personas defined');
    return [];
  }

  console.log(`[People] Looking up people at ${qualifiedCustomers.length} customers with titles: ${targetTitles.join(', ')}`);

  const allPeople: DiscoveredPerson[] = [];
  let personIndex = 0;

  // Lookup people at each customer company using Nyne.ai
  for (const customer of qualifiedCustomers) {
    const result = await searchPeopleAtCompany(customer.name, targetTitles, { limit: 3 });

    if (result.success && result.people && result.people.length > 0) {
      sources.push(`nyne_${customer.name.toLowerCase().replace(/\s+/g, '_')}`);

      for (const person of result.people) {
        // Determine persona type based on title
        const matchedPersona = targetPersonas.find(p =>
          person.title?.toLowerCase().includes(p.title.toLowerCase().split(' ')[0]) ||
          p.title.toLowerCase().includes(person.title?.toLowerCase().split(' ')[0] || '')
        );

        const personType = matchedPersona?.persona_type || 'user';

        allPeople.push({
          id: `person_${personIndex++}`,
          name: person.name,
          company: person.company || customer.name,
          role: person.title,
          type: personType,
          linkedin_url: person.linkedin_url,
          email: person.email,
          phone: person.phone,
          confidence_score: 0.85, // Higher confidence from Nyne API
          signals: [{
            source: 'nyne_search',
            text: `Found via Nyne.ai search at ${customer.name}`,
            url: person.linkedin_url,
            date: new Date().toISOString().split('T')[0],
          }],
        } as DiscoveredPerson);
      }
    }

    // Small delay between companies to avoid rate limiting
    if (qualifiedCustomers.indexOf(customer) < qualifiedCustomers.length - 1) {
      await delay(200);
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
