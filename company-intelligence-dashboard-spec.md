# Company Intelligence Dashboard - Technical Specification

## Project Overview

Build a web application that allows users to research any B2B company by entering its name. The app displays three tabs of intelligence:

1. **Tab 1 - Company Overview**: Basic company information (funding, employees, description, leadership)
2. **Tab 2 - Market Intelligence**: Aggregated social mentions, reviews, sentiment, feature feedback, and news
3. **Tab 3 - User Discovery**: List of identified users of the company's product with confidence scores and source signals

### Core Behaviors

- **First search**: Execute all data collection strategies, store results in database
- **Subsequent searches**: Return cached data immediately
- **Refresh button**: Each tab has a refresh button that re-executes only that tab's strategies and updates the cache
- **Autocomplete**: Company search bar with autocomplete powered by Clearbit

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Autocomplete API | Clearbit Company Autocomplete |
| Search/Crawl APIs | Exa, Perplexity, Firecrawl |
| Enrichment APIs | Clearbit (company data) |

---

## Project Structure

```
/app
  /page.tsx                    # Main search page
  /company/[domain]/page.tsx   # Company dashboard with 3 tabs
  /api
    /autocomplete/route.ts     # Clearbit autocomplete proxy
    /company/[domain]/route.ts # Get or create company data
    /company/[domain]/refresh/route.ts # Refresh specific tab
    
/lib
  /db.ts                       # Supabase client
  /types.ts                    # TypeScript interfaces
  /strategies
    /tab1/index.ts             # Tab 1 orchestrator
    /tab1/perplexity.ts        # Perplexity company summary
    /tab1/clearbit.ts          # Clearbit enrichment
    /tab1/website.ts           # Website scraping
    /tab2/index.ts             # Tab 2 orchestrator
    /tab2/social.ts            # Social mentions (Exa)
    /tab2/reviews.ts           # G2/Capterra reviews (Exa)
    /tab2/news.ts              # News/press (Exa)
    /tab2/synthesis.ts         # Perplexity synthesis
    /tab3/index.ts             # Tab 3 orchestrator
    /tab3/review-authors.ts    # Extract reviewers from G2/Capterra
    /tab3/testimonials.ts      # Scrape company testimonials
    /tab3/linkedin-mentions.ts # Find LinkedIn posts mentioning product
    /tab3/forums.ts            # Community/forum users
    /tab3/job-postings.ts      # Infer from job requirements
    
/components
  /search-bar.tsx              # Autocomplete search input
  /company-tabs.tsx            # Tab container component
  /tab1-overview.tsx           # Company overview display
  /tab2-intelligence.tsx       # Market intelligence display
  /tab3-users.tsx              # User discovery display
  /refresh-button.tsx          # Refresh button with loading state
  /signal-badge.tsx            # Confidence signal indicator
```

---

## Database Schema

### Supabase SQL Migration

```sql
-- Create the companies table
CREATE TABLE companies (
  -- Primary identifier
  domain TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  
  -- Tab 1: Company Overview
  tab1_data JSONB DEFAULT '{}'::jsonb,
  tab1_updated_at TIMESTAMP WITH TIME ZONE,
  tab1_sources TEXT[] DEFAULT '{}',
  
  -- Tab 2: Market Intelligence  
  tab2_data JSONB DEFAULT '{}'::jsonb,
  tab2_updated_at TIMESTAMP WITH TIME ZONE,
  tab2_sources TEXT[] DEFAULT '{}',
  
  -- Tab 3: User Discovery
  tab3_data JSONB DEFAULT '{}'::jsonb,
  tab3_updated_at TIMESTAMP WITH TIME ZONE,
  tab3_sources TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_companies_name ON companies(name);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## TypeScript Interfaces

```typescript
// /lib/types.ts

// Database record
export interface Company {
  domain: string;
  name: string;
  logo_url: string | null;
  tab1_data: Tab1Data;
  tab1_updated_at: string | null;
  tab1_sources: string[];
  tab2_data: Tab2Data;
  tab2_updated_at: string | null;
  tab2_sources: string[];
  tab3_data: Tab3Data;
  tab3_updated_at: string | null;
  tab3_sources: string[];
  created_at: string;
  updated_at: string;
}

// Tab 1: Company Overview
export interface Tab1Data {
  description: string;
  founded: number | null;
  headquarters: string | null;
  employee_range: string | null;
  industry: string | null;
  funding: {
    total: string | null;
    last_round: string | null;
    last_round_date: string | null;
    investors: string[];
  };
  leadership: Array<{
    name: string;
    title: string;
    linkedin_url: string | null;
  }>;
  socials: {
    twitter: string | null;
    linkedin: string | null;
    github: string | null;
  };
  website: string;
}

// Tab 2: Market Intelligence
export interface Tab2Data {
  summary: string;
  sentiment_score: number; // 0-1
  loved_features: string[];
  common_complaints: string[];
  recent_releases: Array<{
    title: string;
    date: string;
    source_url: string;
  }>;
  press_mentions: Array<{
    title: string;
    date: string;
    source: string;
    snippet: string;
    url: string;
  }>;
  raw_mentions: Array<{
    source: 'twitter' | 'linkedin' | 'reddit' | 'g2' | 'hackernews' | 'other';
    text: string;
    date: string | null;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

// Tab 3: User Discovery
export interface Tab3Data {
  users: Array<{
    id: string; // Generated UUID
    name: string;
    title: string | null;
    company: string | null;
    confidence_score: number; // 0-1
    signals: Array<{
      type: SignalType;
      confidence: number;
      snippet: string;
      url: string;
      date: string | null;
    }>;
    linkedin_url: string | null;
    email: string | null;
  }>;
  companies_using: string[];
  total_signals_found: number;
}

export type SignalType = 
  | 'g2_review'
  | 'capterra_review'
  | 'trustradius_review'
  | 'testimonial'
  | 'linkedin_post'
  | 'twitter_mention'
  | 'reddit_post'
  | 'forum_post'
  | 'github_issue'
  | 'stackoverflow'
  | 'job_posting_inference';

// Autocomplete response from Clearbit
export interface AutocompleteResult {
  name: string;
  domain: string;
  logo: string;
}

// API response types
export interface CompanyResponse {
  company: {
    domain: string;
    name: string;
    logo_url: string | null;
  };
  tab1: {
    data: Tab1Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
  tab2: {
    data: Tab2Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
  tab3: {
    data: Tab3Data;
    updated_at: string | null;
    sources: string[];
    loading?: boolean;
  };
}

// Streaming event types
export type StreamEvent = 
  | { type: 'tab_started'; tab: 1 | 2 | 3 }
  | { type: 'tab_complete'; tab: 1 | 2 | 3; data: Tab1Data | Tab2Data | Tab3Data; sources: string[] }
  | { type: 'tab_error'; tab: 1 | 2 | 3; error: string }
  | { type: 'all_complete' };
```

---

## API Endpoints

### 1. Autocomplete Endpoint

**GET /api/autocomplete?q={query}**

Proxies to Clearbit's autocomplete API.

```typescript
// /app/api/autocomplete/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  
  try {
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    const data = await response.json();
    
    // Return top 8 results
    return NextResponse.json(data.slice(0, 8));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json([]);
  }
}
```

### 2. Get/Create Company Endpoint

**GET /api/company/[domain]**

Returns cached data if exists, otherwise triggers full crawl with streaming response.

```typescript
// /app/api/company/[domain]/route.ts

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db';
import { executeTab1Strategies } from '@/lib/strategies/tab1';
import { executeTab2Strategies } from '@/lib/strategies/tab2';
import { executeTab3Strategies } from '@/lib/strategies/tab3';

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;
  const supabase = createClient();
  
  // Check if company exists in cache
  const { data: existing } = await supabase
    .from('companies')
    .select('*')
    .eq('domain', domain)
    .single();
  
  if (existing && existing.tab1_updated_at) {
    // Return cached data
    return Response.json({
      company: {
        domain: existing.domain,
        name: existing.name,
        logo_url: existing.logo_url,
      },
      tab1: {
        data: existing.tab1_data,
        updated_at: existing.tab1_updated_at,
        sources: existing.tab1_sources,
      },
      tab2: {
        data: existing.tab2_data,
        updated_at: existing.tab2_updated_at,
        sources: existing.tab2_sources,
      },
      tab3: {
        data: existing.tab3_data,
        updated_at: existing.tab3_updated_at,
        sources: existing.tab3_sources,
      },
    });
  }
  
  // No cache - stream results as tabs complete
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Helper to send SSE events
  const sendEvent = async (event: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };
  
  // Execute all tabs in parallel
  (async () => {
    try {
      // Get company name from Clearbit first
      const clearbitRes = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${domain}`
      );
      const clearbitData = await clearbitRes.json();
      const companyInfo = clearbitData[0] || { name: domain, domain, logo: null };
      
      // Create initial record
      await supabase.from('companies').upsert({
        domain: domain,
        name: companyInfo.name,
        logo_url: companyInfo.logo,
      });
      
      // Execute tabs in parallel
      const [tab1Result, tab2Result, tab3Result] = await Promise.allSettled([
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 1 });
          const result = await executeTab1Strategies(domain, companyInfo.name);
          await supabase.from('companies').update({
            tab1_data: result.data,
            tab1_updated_at: new Date().toISOString(),
            tab1_sources: result.sources,
          }).eq('domain', domain);
          await sendEvent({ type: 'tab_complete', tab: 1, data: result.data, sources: result.sources });
          return result;
        })(),
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 2 });
          const result = await executeTab2Strategies(domain, companyInfo.name);
          await supabase.from('companies').update({
            tab2_data: result.data,
            tab2_updated_at: new Date().toISOString(),
            tab2_sources: result.sources,
          }).eq('domain', domain);
          await sendEvent({ type: 'tab_complete', tab: 2, data: result.data, sources: result.sources });
          return result;
        })(),
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 3 });
          const result = await executeTab3Strategies(domain, companyInfo.name);
          await supabase.from('companies').update({
            tab3_data: result.data,
            tab3_updated_at: new Date().toISOString(),
            tab3_sources: result.sources,
          }).eq('domain', domain);
          await sendEvent({ type: 'tab_complete', tab: 3, data: result.data, sources: result.sources });
          return result;
        })(),
      ]);
      
      await sendEvent({ type: 'all_complete' });
    } catch (error) {
      console.error('Crawl error:', error);
      await sendEvent({ type: 'error', message: 'Failed to fetch company data' });
    } finally {
      await writer.close();
    }
  })();
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 3. Refresh Tab Endpoint

**POST /api/company/[domain]/refresh**

Re-executes strategies for a specific tab.

```typescript
// /app/api/company/[domain]/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';
import { executeTab1Strategies } from '@/lib/strategies/tab1';
import { executeTab2Strategies } from '@/lib/strategies/tab2';
import { executeTab3Strategies } from '@/lib/strategies/tab3';

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;
  const { tab } = await request.json();
  
  if (![1, 2, 3].includes(tab)) {
    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
  }
  
  const supabase = createClient();
  
  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('domain', domain)
    .single();
  
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }
  
  // Execute the appropriate strategy
  let result;
  let updateData: Record<string, any> = {};
  
  switch (tab) {
    case 1:
      result = await executeTab1Strategies(domain, company.name);
      updateData = {
        tab1_data: result.data,
        tab1_updated_at: new Date().toISOString(),
        tab1_sources: result.sources,
      };
      break;
    case 2:
      result = await executeTab2Strategies(domain, company.name);
      updateData = {
        tab2_data: result.data,
        tab2_updated_at: new Date().toISOString(),
        tab2_sources: result.sources,
      };
      break;
    case 3:
      result = await executeTab3Strategies(domain, company.name);
      updateData = {
        tab3_data: result.data,
        tab3_updated_at: new Date().toISOString(),
        tab3_sources: result.sources,
      };
      break;
  }
  
  // Update database
  await supabase
    .from('companies')
    .update(updateData)
    .eq('domain', domain);
  
  return NextResponse.json({
    data: result.data,
    updated_at: updateData[`tab${tab}_updated_at`],
    sources: result.sources,
  });
}
```

---

## Strategy Implementations

### Tab 1 Strategies (Company Overview)

```typescript
// /lib/strategies/tab1/index.ts

import { Tab1Data } from '@/lib/types';
import { getPerplexitySummary } from './perplexity';
import { getClearbitData } from './clearbit';
import { scrapeWebsite } from './website';

export async function executeTab1Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab1Data; sources: string[] }> {
  const sources: string[] = [];
  
  // Run strategies in parallel
  const [perplexityResult, clearbitResult, websiteResult] = await Promise.allSettled([
    getPerplexitySummary(companyName, domain),
    getClearbitData(domain),
    scrapeWebsite(domain),
  ]);
  
  // Merge results (later sources override earlier ones for conflicts)
  let data: Tab1Data = {
    description: '',
    founded: null,
    headquarters: null,
    employee_range: null,
    industry: null,
    funding: {
      total: null,
      last_round: null,
      last_round_date: null,
      investors: [],
    },
    leadership: [],
    socials: {
      twitter: null,
      linkedin: null,
      github: null,
    },
    website: `https://${domain}`,
  };
  
  // Merge Perplexity data
  if (perplexityResult.status === 'fulfilled' && perplexityResult.value) {
    sources.push('perplexity');
    data = { ...data, ...perplexityResult.value };
  }
  
  // Merge Clearbit data (more authoritative for structured fields)
  if (clearbitResult.status === 'fulfilled' && clearbitResult.value) {
    sources.push('clearbit');
    const cb = clearbitResult.value;
    if (cb.description) data.description = cb.description;
    if (cb.founded) data.founded = cb.founded;
    if (cb.headquarters) data.headquarters = cb.headquarters;
    if (cb.employee_range) data.employee_range = cb.employee_range;
    if (cb.industry) data.industry = cb.industry;
    if (cb.socials) data.socials = { ...data.socials, ...cb.socials };
  }
  
  // Merge website scrape data (leadership, additional info)
  if (websiteResult.status === 'fulfilled' && websiteResult.value) {
    sources.push('website');
    const ws = websiteResult.value;
    if (ws.leadership?.length) data.leadership = ws.leadership;
  }
  
  return { data, sources };
}
```

```typescript
// /lib/strategies/tab1/perplexity.ts

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
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a business research assistant. Provide factual, structured information about companies. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Research the company "${companyName}" (${domain}). Return a JSON object with these fields:
{
  "description": "2-3 sentence company description",
  "founded": year as number or null,
  "headquarters": "City, State/Country" or null,
  "employee_range": "e.g. 100-500" or null,
  "industry": "primary industry" or null,
  "funding": {
    "total": "e.g. $100M" or null,
    "last_round": "e.g. Series B" or null,
    "last_round_date": "YYYY-MM" or null,
    "investors": ["investor names"]
  }
}
Only return the JSON, no other text.`,
          },
        ],
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
  }
}
```

```typescript
// /lib/strategies/tab1/clearbit.ts

export async function getClearbitData(domain: string): Promise<{
  description?: string;
  founded?: number;
  headquarters?: string;
  employee_range?: string;
  industry?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
} | null> {
  const apiKey = process.env.CLEARBIT_API_KEY;
  if (!apiKey) return null;
  
  try {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      description: data.description,
      founded: data.foundedYear,
      headquarters: data.location ? `${data.geo?.city}, ${data.geo?.country}` : null,
      employee_range: data.metrics?.employeesRange,
      industry: data.category?.industry,
      socials: {
        twitter: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : null,
        linkedin: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : null,
        github: data.github?.handle ? `https://github.com/${data.github.handle}` : null,
      },
    };
  } catch (error) {
    console.error('Clearbit error:', error);
    return null;
  }
}
```

```typescript
// /lib/strategies/tab1/website.ts

export async function scrapeWebsite(domain: string): Promise<{
  leadership?: Array<{ name: string; title: string; linkedin_url: string | null }>;
} | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  
  try {
    // Try to scrape the about/team page
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://${domain}/about`,
        pageOptions: {
          onlyMainContent: true,
        },
      }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Use an LLM to extract leadership from the scraped content
    // For now, return null - implement LLM extraction as needed
    return null;
  } catch (error) {
    console.error('Website scrape error:', error);
    return null;
  }
}
```

### Tab 2 Strategies (Market Intelligence)

```typescript
// /lib/strategies/tab2/index.ts

import { Tab2Data } from '@/lib/types';
import { searchSocialMentions } from './social';
import { searchReviews } from './reviews';
import { searchNews } from './news';
import { synthesizeIntelligence } from './synthesis';

export async function executeTab2Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab2Data; sources: string[] }> {
  const sources: string[] = [];
  
  // Gather raw data in parallel
  const [socialResult, reviewsResult, newsResult] = await Promise.allSettled([
    searchSocialMentions(companyName),
    searchReviews(companyName),
    searchNews(companyName),
  ]);
  
  // Collect all mentions
  const allMentions: Tab2Data['raw_mentions'] = [];
  const pressItems: Tab2Data['press_mentions'] = [];
  
  if (socialResult.status === 'fulfilled' && socialResult.value) {
    sources.push('exa_social');
    allMentions.push(...socialResult.value);
  }
  
  if (reviewsResult.status === 'fulfilled' && reviewsResult.value) {
    sources.push('exa_reviews');
    allMentions.push(...reviewsResult.value);
  }
  
  if (newsResult.status === 'fulfilled' && newsResult.value) {
    sources.push('exa_news');
    newsResult.value.forEach(item => {
      pressItems.push(item.press);
      if (item.mention) allMentions.push(item.mention);
    });
  }
  
  // Synthesize with Perplexity
  let synthesis = {
    summary: '',
    loved_features: [] as string[],
    common_complaints: [] as string[],
    sentiment_score: 0.5,
    recent_releases: [] as Tab2Data['recent_releases'],
  };
  
  try {
    const synthResult = await synthesizeIntelligence(companyName, allMentions);
    if (synthResult) {
      sources.push('perplexity_synthesis');
      synthesis = synthResult;
    }
  } catch (error) {
    console.error('Synthesis error:', error);
  }
  
  return {
    data: {
      summary: synthesis.summary,
      sentiment_score: synthesis.sentiment_score,
      loved_features: synthesis.loved_features,
      common_complaints: synthesis.common_complaints,
      recent_releases: synthesis.recent_releases,
      press_mentions: pressItems.slice(0, 10),
      raw_mentions: allMentions.slice(0, 50),
    },
    sources,
  };
}
```

```typescript
// /lib/strategies/tab2/social.ts

import { Tab2Data } from '@/lib/types';

export async function searchSocialMentions(
  companyName: string
): Promise<Tab2Data['raw_mentions']> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const mentions: Tab2Data['raw_mentions'] = [];
  
  try {
    // Search LinkedIn posts
    const linkedinResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:linkedin.com/posts "${companyName}" (love OR recommend OR switched OR using)`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const linkedinData = await linkedinResponse.json();
    
    linkedinData.results?.forEach((result: any) => {
      mentions.push({
        source: 'linkedin',
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
    // Search Twitter
    const twitterResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:twitter.com "${companyName}" -from:${companyName.toLowerCase().replace(/\s/g, '')}`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const twitterData = await twitterResponse.json();
    
    twitterData.results?.forEach((result: any) => {
      mentions.push({
        source: 'twitter',
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
    // Search Reddit
    const redditResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:reddit.com "${companyName}" (review OR experience OR switched OR alternative)`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const redditData = await redditResponse.json();
    
    redditData.results?.forEach((result: any) => {
      mentions.push({
        source: 'reddit',
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
    // Search Hacker News
    const hnResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:news.ycombinator.com "${companyName}"`,
        numResults: 10,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const hnData = await hnResponse.json();
    
    hnData.results?.forEach((result: any) => {
      mentions.push({
        source: 'hackernews',
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
  } catch (error) {
    console.error('Social search error:', error);
  }
  
  return mentions;
}

// Simple sentiment inference - can be enhanced with an LLM
function inferSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'recommend', 'best', 'awesome', 'fantastic'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'disappointed', 'frustrating', 'horrible', 'sucks'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
```

```typescript
// /lib/strategies/tab2/reviews.ts

import { Tab2Data } from '@/lib/types';

export async function searchReviews(
  companyName: string
): Promise<Tab2Data['raw_mentions']> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const mentions: Tab2Data['raw_mentions'] = [];
  
  try {
    // Search G2 reviews
    const g2Response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:g2.com "${companyName}" review`,
        numResults: 20,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });
    
    const g2Data = await g2Response.json();
    
    g2Data.results?.forEach((result: any) => {
      mentions.push({
        source: 'g2',
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
    // Search Capterra reviews
    const capterraResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:capterra.com "${companyName}" review`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });
    
    const capterraData = await capterraResponse.json();
    
    capterraData.results?.forEach((result: any) => {
      mentions.push({
        source: 'other', // capterra
        text: result.text || result.title,
        date: result.publishedDate || null,
        url: result.url,
        sentiment: inferSentiment(result.text || ''),
      });
    });
    
  } catch (error) {
    console.error('Reviews search error:', error);
  }
  
  return mentions;
}

function inferSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'recommend', 'best'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'disappointed', 'frustrating'];
  
  let positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  let negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
```

```typescript
// /lib/strategies/tab2/news.ts

import { Tab2Data } from '@/lib/types';

interface NewsItem {
  press: Tab2Data['press_mentions'][0];
  mention?: Tab2Data['raw_mentions'][0];
}

export async function searchNews(companyName: string): Promise<NewsItem[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const items: NewsItem[] = [];
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (announces OR launches OR raises OR partners OR releases)`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const data = await response.json();
    
    data.results?.forEach((result: any) => {
      // Extract source domain
      const url = new URL(result.url);
      const source = url.hostname.replace('www.', '');
      
      items.push({
        press: {
          title: result.title || '',
          date: result.publishedDate || '',
          source: source,
          snippet: result.text?.slice(0, 200) || '',
          url: result.url,
        },
        mention: {
          source: 'other',
          text: result.text || result.title,
          date: result.publishedDate || null,
          url: result.url,
          sentiment: 'neutral',
        },
      });
    });
    
  } catch (error) {
    console.error('News search error:', error);
  }
  
  return items;
}
```

```typescript
// /lib/strategies/tab2/synthesis.ts

import { Tab2Data } from '@/lib/types';

export async function synthesizeIntelligence(
  companyName: string,
  mentions: Tab2Data['raw_mentions']
): Promise<{
  summary: string;
  loved_features: string[];
  common_complaints: string[];
  sentiment_score: number;
  recent_releases: Tab2Data['recent_releases'];
} | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;
  
  // Prepare context from mentions
  const mentionsSummary = mentions
    .slice(0, 30)
    .map(m => `[${m.source}] ${m.text}`)
    .join('\n\n');
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a market intelligence analyst. Analyze company mentions and extract key insights. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze these mentions about "${companyName}" and return a JSON object:

MENTIONS:
${mentionsSummary}

Return this exact JSON structure:
{
  "summary": "2-3 sentence overall summary of what people are saying",
  "loved_features": ["feature 1", "feature 2", ...] (max 5),
  "common_complaints": ["complaint 1", "complaint 2", ...] (max 5),
  "sentiment_score": 0.0 to 1.0 (0=very negative, 1=very positive),
  "recent_releases": [{"title": "feature/product name", "date": "YYYY-MM or null", "source_url": "url or null"}] (max 3)
}

Only return the JSON, no other text.`,
          },
        ],
        max_tokens: 1500,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Synthesis error:', error);
    return null;
  }
}
```

### Tab 3 Strategies (User Discovery)

```typescript
// /lib/strategies/tab3/index.ts

import { Tab3Data, SignalType } from '@/lib/types';
import { searchReviewAuthors } from './review-authors';
import { searchTestimonials } from './testimonials';
import { searchLinkedInMentions } from './linkedin-mentions';
import { searchForumUsers } from './forums';
import { searchJobPostings } from './job-postings';
import { v4 as uuidv4 } from 'uuid';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function executeTab3Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab3Data; sources: string[] }> {
  const sources: string[] = [];
  const allSignals: RawUserSignal[] = [];
  
  // Gather signals in parallel
  const [reviewsResult, testimonialsResult, linkedinResult, forumsResult, jobsResult] = 
    await Promise.allSettled([
      searchReviewAuthors(companyName),
      searchTestimonials(domain, companyName),
      searchLinkedInMentions(companyName),
      searchForumUsers(companyName),
      searchJobPostings(companyName),
    ]);
  
  if (reviewsResult.status === 'fulfilled' && reviewsResult.value.length) {
    sources.push('review_sites');
    allSignals.push(...reviewsResult.value);
  }
  
  if (testimonialsResult.status === 'fulfilled' && testimonialsResult.value.length) {
    sources.push('testimonials');
    allSignals.push(...testimonialsResult.value);
  }
  
  if (linkedinResult.status === 'fulfilled' && linkedinResult.value.length) {
    sources.push('linkedin');
    allSignals.push(...linkedinResult.value);
  }
  
  if (forumsResult.status === 'fulfilled' && forumsResult.value.length) {
    sources.push('forums');
    allSignals.push(...forumsResult.value);
  }
  
  if (jobsResult.status === 'fulfilled' && jobsResult.value.length) {
    sources.push('job_postings');
    allSignals.push(...jobsResult.value);
  }
  
  // Deduplicate and merge signals by person
  const userMap = new Map<string, Tab3Data['users'][0]>();
  const companiesUsing = new Set<string>();
  
  allSignals.forEach(signal => {
    // Create a key for deduplication (normalized name + company)
    const key = `${signal.name.toLowerCase().trim()}-${(signal.company || '').toLowerCase().trim()}`;
    
    if (signal.company) {
      companiesUsing.add(signal.company);
    }
    
    if (userMap.has(key)) {
      // Add signal to existing user
      const user = userMap.get(key)!;
      user.signals.push({
        type: signal.signalType,
        confidence: signal.confidence,
        snippet: signal.snippet,
        url: signal.url,
        date: signal.date || null,
      });
      // Update confidence score (diminishing returns formula)
      user.confidence_score = calculateConfidence(user.signals);
      // Update linkedin if found
      if (signal.linkedin_url && !user.linkedin_url) {
        user.linkedin_url = signal.linkedin_url;
      }
    } else {
      // Create new user
      userMap.set(key, {
        id: uuidv4(),
        name: signal.name,
        title: signal.title || null,
        company: signal.company || null,
        confidence_score: signal.confidence,
        signals: [{
          type: signal.signalType,
          confidence: signal.confidence,
          snippet: signal.snippet,
          url: signal.url,
          date: signal.date || null,
        }],
        linkedin_url: signal.linkedin_url || null,
        email: null,
      });
    }
  });
  
  // Convert to array and sort by confidence
  const users = Array.from(userMap.values())
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 100); // Limit to top 100 users
  
  return {
    data: {
      users,
      companies_using: Array.from(companiesUsing).slice(0, 50),
      total_signals_found: allSignals.length,
    },
    sources,
  };
}

// Calculate compound confidence from multiple signals
function calculateConfidence(signals: Tab3Data['users'][0]['signals']): number {
  const SIGNAL_WEIGHTS: Record<SignalType, number> = {
    g2_review: 0.95,
    capterra_review: 0.90,
    trustradius_review: 0.90,
    testimonial: 0.85,
    linkedin_post: 0.85,
    twitter_mention: 0.75,
    reddit_post: 0.70,
    forum_post: 0.70,
    github_issue: 0.75,
    stackoverflow: 0.70,
    job_posting_inference: 0.50,
  };
  
  // Sort by weight descending
  const sortedSignals = [...signals].sort(
    (a, b) => SIGNAL_WEIGHTS[b.type] - SIGNAL_WEIGHTS[a.type]
  );
  
  // Compound with diminishing returns
  let total = 0;
  sortedSignals.forEach((signal, index) => {
    const weight = SIGNAL_WEIGHTS[signal.type];
    const diminishingFactor = Math.pow(0.7, index);
    total = total + (1 - total) * weight * diminishingFactor;
  });
  
  return Math.min(total, 0.99);
}
```

```typescript
// /lib/strategies/tab3/review-authors.ts

import { SignalType } from '@/lib/types';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function searchReviewAuthors(companyName: string): Promise<RawUserSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const signals: RawUserSignal[] = [];
  
  try {
    // Search G2 for reviews with author info
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:g2.com "${companyName}" reviews`,
        numResults: 25,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 2000 },
        },
      }),
    });
    
    const data = await response.json();
    
    // Use LLM to extract reviewer info from the text
    for (const result of data.results || []) {
      const extracted = await extractReviewerInfo(result.text, result.url);
      if (extracted) {
        signals.push({
          ...extracted,
          signalType: 'g2_review',
          confidence: 0.95,
          url: result.url,
          date: result.publishedDate,
        });
      }
    }
    
  } catch (error) {
    console.error('Review authors search error:', error);
  }
  
  return signals;
}

// Extract reviewer info using Perplexity (or could use any LLM)
async function extractReviewerInfo(
  reviewText: string,
  url: string
): Promise<{ name: string; title?: string; company?: string; snippet: string } | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || !reviewText) return null;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Extract the reviewer's information from this G2/Capterra review text. Return JSON only:
            
TEXT:
${reviewText.slice(0, 1500)}

Return format:
{"name": "Full Name", "title": "Job Title or null", "company": "Company Name or null", "snippet": "key quote from review (max 150 chars)"}

If you cannot find a reviewer name, return null.
Only return the JSON, nothing else.`,
          },
        ],
        max_tokens: 300,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content !== 'null') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name) {
          return parsed;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Extract reviewer error:', error);
    return null;
  }
}
```

```typescript
// /lib/strategies/tab3/testimonials.ts

import { SignalType } from '@/lib/types';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function searchTestimonials(
  domain: string,
  companyName: string
): Promise<RawUserSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!exaKey) return [];
  
  const signals: RawUserSignal[] = [];
  
  try {
    // Search for testimonial pages on the company's website
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${exaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:${domain} (testimonials OR "customer stories" OR "case studies" OR "what our customers say")`,
        numResults: 10,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 5000 },
        },
      }),
    });
    
    const data = await response.json();
    
    // Extract testimonial authors from each page
    for (const result of data.results || []) {
      if (!perplexityKey) continue;
      
      const extracted = await extractTestimonialAuthors(result.text, result.url);
      signals.push(...extracted.map(e => ({
        ...e,
        signalType: 'testimonial' as SignalType,
        confidence: 0.85,
        url: result.url,
      })));
    }
    
  } catch (error) {
    console.error('Testimonials search error:', error);
  }
  
  return signals;
}

async function extractTestimonialAuthors(
  pageText: string,
  url: string
): Promise<Array<{ name: string; title?: string; company?: string; snippet: string }>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || !pageText) return [];
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Extract all testimonial authors from this webpage text. Return JSON array:

TEXT:
${pageText.slice(0, 4000)}

Return format:
[{"name": "Full Name", "title": "Job Title or null", "company": "Company Name or null", "snippet": "their testimonial quote (max 150 chars)"}]

If no testimonials with names found, return empty array [].
Only return the JSON array, nothing else.`,
          },
        ],
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.filter((p: any) => p.name);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Extract testimonials error:', error);
    return [];
  }
}
```

```typescript
// /lib/strategies/tab3/linkedin-mentions.ts

import { SignalType } from '@/lib/types';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function searchLinkedInMentions(companyName: string): Promise<RawUserSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const signals: RawUserSignal[] = [];
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:linkedin.com/posts "${companyName}" ("I use" OR "we use" OR "love using" OR "switched to" OR "been using" OR "recommend")`,
        numResults: 30,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 1500 },
        },
      }),
    });
    
    const data = await response.json();
    
    for (const result of data.results || []) {
      const extracted = await extractLinkedInAuthor(result.text, result.url);
      if (extracted) {
        signals.push({
          ...extracted,
          signalType: 'linkedin_post',
          confidence: 0.85,
          url: result.url,
          date: result.publishedDate,
          linkedin_url: extractLinkedInProfileUrl(result.url),
        });
      }
    }
    
  } catch (error) {
    console.error('LinkedIn mentions search error:', error);
  }
  
  return signals;
}

async function extractLinkedInAuthor(
  postText: string,
  url: string
): Promise<{ name: string; title?: string; company?: string; snippet: string } | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || !postText) return null;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Extract the LinkedIn post author's information:

POST TEXT:
${postText.slice(0, 1200)}

Return JSON:
{"name": "Full Name", "title": "Job Title or null", "company": "Current Company or null", "snippet": "relevant quote about the product (max 150 chars)"}

If cannot determine author name, return null.
Only return JSON, nothing else.`,
          },
        ],
        max_tokens: 300,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content !== 'null') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name) return parsed;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function extractLinkedInProfileUrl(postUrl: string): string | null {
  // LinkedIn post URLs often contain the author's profile
  // Format: linkedin.com/posts/username_...
  const match = postUrl.match(/linkedin\.com\/posts\/([^_]+)/);
  if (match) {
    return `https://linkedin.com/in/${match[1]}`;
  }
  return null;
}
```

```typescript
// /lib/strategies/tab3/forums.ts

import { SignalType } from '@/lib/types';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function searchForumUsers(companyName: string): Promise<RawUserSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const signals: RawUserSignal[] = [];
  
  try {
    // Search Stack Overflow
    const soResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:stackoverflow.com "${companyName}" (question OR answer)`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });
    
    const soData = await soResponse.json();
    
    for (const result of soData.results || []) {
      const extracted = await extractForumUser(result.text, 'stackoverflow');
      if (extracted) {
        signals.push({
          ...extracted,
          signalType: 'stackoverflow',
          confidence: 0.70,
          url: result.url,
          date: result.publishedDate,
        });
      }
    }
    
    // Search GitHub Issues/Discussions
    const ghResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:github.com "${companyName}" (issue OR discussion)`,
        numResults: 15,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
    });
    
    const ghData = await ghResponse.json();
    
    for (const result of ghData.results || []) {
      const extracted = await extractForumUser(result.text, 'github');
      if (extracted) {
        signals.push({
          ...extracted,
          signalType: 'github_issue',
          confidence: 0.75,
          url: result.url,
          date: result.publishedDate,
        });
      }
    }
    
  } catch (error) {
    console.error('Forums search error:', error);
  }
  
  return signals;
}

async function extractForumUser(
  text: string,
  source: 'stackoverflow' | 'github'
): Promise<{ name: string; title?: string; company?: string; snippet: string } | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || !text) return null;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Extract the ${source} user's information from this post:

TEXT:
${text.slice(0, 1000)}

Return JSON:
{"name": "Username or Full Name", "title": null, "company": null, "snippet": "what they said about using the product (max 150 chars)"}

If no clear user or product mention, return null.
Only return JSON.`,
          },
        ],
        max_tokens: 300,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content !== 'null') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name) return parsed;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
```

```typescript
// /lib/strategies/tab3/job-postings.ts

import { SignalType } from '@/lib/types';

interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}

export async function searchJobPostings(companyName: string): Promise<RawUserSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];
  
  const signals: RawUserSignal[] = [];
  
  try {
    // Find job postings that require experience with the product
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"experience with ${companyName}" OR "${companyName} required" OR "${companyName} preferred" job`,
        numResults: 20,
        useAutoprompt: false,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });
    
    const data = await response.json();
    
    // For job postings, we infer the company uses the product
    // but we don't have specific users - we flag the company
    for (const result of data.results || []) {
      const companyMatch = extractHiringCompany(result.text, result.title);
      if (companyMatch) {
        signals.push({
          name: `[${companyMatch} Team]`, // Placeholder - company uses product
          title: 'Team Member',
          company: companyMatch,
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
  // Simple extraction - look for "at CompanyName" or "Company Name is hiring"
  const patterns = [
    /at\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+is|\s+-|\s+\||\s+•|$)/,
    /([A-Z][a-zA-Z0-9\s&]+?)\s+is\s+hiring/,
    /Join\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+as|\s+-|\s+\||$)/,
  ];
  
  const combined = `${title} ${text}`;
  
  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match && match[1] && match[1].length < 50) {
      return match[1].trim();
    }
  }
  
  return null;
}
```

---

## Frontend Components

### Main Search Page

```typescript
// /app/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';

export default function HomePage() {
  const router = useRouter();
  
  const handleSelect = (domain: string) => {
    router.push(`/company/${domain}`);
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-32 px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Company Intelligence
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          Research any B2B company in seconds
        </p>
        
        <SearchBar onSelect={handleSelect} />
      </div>
    </main>
  );
}
```

### Search Bar with Autocomplete

```typescript
// /components/search-bar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { AutocompleteResult } from '@/lib/types';

interface SearchBarProps {
  onSelect: (domain: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    // Debounce API calls
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 200);
    
    return () => clearTimeout(debounceRef.current);
  }, [query]);
  
  const handleSelect = (result: AutocompleteResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onSelect(result.domain);
  };
  
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a company..."
          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.domain}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 text-left"
            >
              {result.logo && (
                <img
                  src={result.logo}
                  alt={result.name}
                  className="w-8 h-8 rounded"
                />
              )}
              <div>
                <div className="font-medium text-gray-900">{result.name}</div>
                <div className="text-sm text-gray-500">{result.domain}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Company Dashboard Page

```typescript
// /app/company/[domain]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { CompanyTabs } from '@/components/company-tabs';
import { CompanyResponse, StreamEvent } from '@/lib/types';

export default function CompanyPage({ params }: { params: { domain: string } }) {
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState({ 1: false, 2: false, 3: false });
  
  useEffect(() => {
    fetchCompanyData();
  }, [params.domain]);
  
  const fetchCompanyData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/company/${params.domain}`);
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Streaming response - new company
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        // Initialize with loading states
        setData({
          company: { domain: params.domain, name: params.domain, logo_url: null },
          tab1: { data: {} as any, updated_at: null, sources: [], loading: true },
          tab2: { data: {} as any, updated_at: null, sources: [], loading: true },
          tab3: { data: {} as any, updated_at: null, sources: [], loading: true },
        });
        setLoading(false);
        setTabsLoading({ 1: true, 2: true, 3: true });
        
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const event: StreamEvent = JSON.parse(line.slice(6));
              
              if (event.type === 'tab_complete') {
                setData(prev => prev ? {
                  ...prev,
                  [`tab${event.tab}`]: {
                    data: event.data,
                    updated_at: new Date().toISOString(),
                    sources: event.sources,
                    loading: false,
                  },
                } : null);
                setTabsLoading(prev => ({ ...prev, [event.tab]: false }));
              }
            }
          }
        }
      } else {
        // JSON response - cached data
        const json = await response.json();
        setData(json);
        setLoading(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };
  
  const handleRefresh = async (tab: 1 | 2 | 3) => {
    setTabsLoading(prev => ({ ...prev, [tab]: true }));
    
    try {
      const response = await fetch(`/api/company/${params.domain}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab }),
      });
      
      const result = await response.json();
      
      setData(prev => prev ? {
        ...prev,
        [`tab${tab}`]: {
          data: result.data,
          updated_at: result.updated_at,
          sources: result.sources,
        },
      } : null);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTabsLoading(prev => ({ ...prev, [tab]: false }));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Company not found</p>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Company Header */}
        <div className="flex items-center gap-4 mb-8">
          {data.company.logo_url && (
            <img
              src={data.company.logo_url}
              alt={data.company.name}
              className="w-16 h-16 rounded-lg"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.company.name}</h1>
            <p className="text-gray-500">{data.company.domain}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <CompanyTabs
          data={data}
          tabsLoading={tabsLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </main>
  );
}
```

### Tabs Component

```typescript
// /components/company-tabs.tsx

'use client';

import { useState } from 'react';
import { CompanyResponse } from '@/lib/types';
import { Tab1Overview } from './tab1-overview';
import { Tab2Intelligence } from './tab2-intelligence';
import { Tab3Users } from './tab3-users';
import { RefreshButton } from './refresh-button';

interface CompanyTabsProps {
  data: CompanyResponse;
  tabsLoading: { 1: boolean; 2: boolean; 3: boolean };
  onRefresh: (tab: 1 | 2 | 3) => void;
}

export function CompanyTabs({ data, tabsLoading, onRefresh }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  
  const tabs = [
    { id: 1 as const, label: 'Overview', updated: data.tab1.updated_at },
    { id: 2 as const, label: 'Market Intelligence', updated: data.tab2.updated_at },
    { id: 3 as const, label: 'User Discovery', updated: data.tab3.updated_at },
  ];
  
  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Refresh Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="text-sm text-gray-500">
            {data[`tab${activeTab}`].updated_at ? (
              <>Last updated: {new Date(data[`tab${activeTab}`].updated_at!).toLocaleString()}</>
            ) : (
              <>Loading...</>
            )}
          </div>
          <RefreshButton
            loading={tabsLoading[activeTab]}
            onClick={() => onRefresh(activeTab)}
          />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {tabsLoading[activeTab] ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 1 && <Tab1Overview data={data.tab1.data} />}
              {activeTab === 2 && <Tab2Intelligence data={data.tab2.data} />}
              {activeTab === 3 && <Tab3Users data={data.tab3.data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Tab Content Components

```typescript
// /components/tab1-overview.tsx

import { Tab1Data } from '@/lib/types';

interface Tab1OverviewProps {
  data: Tab1Data;
}

export function Tab1Overview({ data }: Tab1OverviewProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
        <p className="text-gray-600">{data.description || 'No description available'}</p>
      </div>
      
      {/* Key Facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.founded && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Founded</div>
            <div className="text-lg font-semibold">{data.founded}</div>
          </div>
        )}
        {data.headquarters && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Headquarters</div>
            <div className="text-lg font-semibold">{data.headquarters}</div>
          </div>
        )}
        {data.employee_range && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Employees</div>
            <div className="text-lg font-semibold">{data.employee_range}</div>
          </div>
        )}
        {data.industry && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Industry</div>
            <div className="text-lg font-semibold">{data.industry}</div>
          </div>
        )}
      </div>
      
      {/* Funding */}
      {data.funding?.total && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{data.funding.total}</div>
            {data.funding.last_round && (
              <div className="text-sm text-green-600 mt-1">
                Last round: {data.funding.last_round}
                {data.funding.last_round_date && ` (${data.funding.last_round_date})`}
              </div>
            )}
            {data.funding.investors?.length > 0 && (
              <div className="text-sm text-gray-600 mt-2">
                Investors: {data.funding.investors.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Leadership */}
      {data.leadership?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Leadership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.leadership.map((person, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{person.name}</div>
                  <div className="text-sm text-gray-500">{person.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Socials */}
      <div className="flex gap-4">
        {data.socials?.twitter && (
          <a href={data.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Twitter
          </a>
        )}
        {data.socials?.linkedin && (
          <a href={data.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            LinkedIn
          </a>
        )}
        {data.socials?.github && (
          <a href={data.socials.github} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
```

```typescript
// /components/tab2-intelligence.tsx

import { Tab2Data } from '@/lib/types';

interface Tab2IntelligenceProps {
  data: Tab2Data;
}

export function Tab2Intelligence({ data }: Tab2IntelligenceProps) {
  const sentimentColor = data.sentiment_score > 0.6 ? 'green' : data.sentiment_score > 0.4 ? 'yellow' : 'red';
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
        <p className="text-gray-600">{data.summary || 'No summary available'}</p>
      </div>
      
      {/* Sentiment Score */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Sentiment Score:</span>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${sentimentColor}-500`}
            style={{ width: `${data.sentiment_score * 100}%` }}
          />
        </div>
        <span className="font-semibold">{Math.round(data.sentiment_score * 100)}%</span>
      </div>
      
      {/* Features & Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-3">💚 What People Love</h3>
          <ul className="space-y-2">
            {data.loved_features?.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">💔 Common Complaints</h3>
          <ul className="space-y-2">
            {data.common_complaints?.map((complaint, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-500">✗</span>
                {complaint}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Recent Releases */}
      {data.recent_releases?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Recent Releases</h3>
          <div className="space-y-2">
            {data.recent_releases.map((release, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-900">{release.title}</span>
                {release.date && <span className="text-sm text-gray-500">{release.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Press Mentions */}
      {data.press_mentions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📰 Press Mentions</h3>
          <div className="space-y-3">
            {data.press_mentions.slice(0, 5).map((press, i) => (
              <a
                key={i}
                href={press.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{press.title}</div>
                <div className="text-sm text-gray-500 mt-1">{press.source} • {press.date}</div>
                <div className="text-sm text-gray-600 mt-2">{press.snippet}</div>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* Raw Mentions */}
      {data.raw_mentions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Recent Mentions ({data.raw_mentions.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.raw_mentions.slice(0, 20).map((mention, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    mention.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {mention.source}
                  </span>
                  {mention.date && <span className="text-xs text-gray-400">{mention.date}</span>}
                </div>
                <p className="text-sm text-gray-700">{mention.text.slice(0, 200)}...</p>
                <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                  View source →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

```typescript
// /components/tab3-users.tsx

import { Tab3Data } from '@/lib/types';
import { SignalBadge } from './signal-badge';

interface Tab3UsersProps {
  data: Tab3Data;
}

export function Tab3Users({ data }: Tab3UsersProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{data.users?.length || 0}</div>
          <div className="text-sm text-purple-600">Users Found</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.companies_using?.length || 0}</div>
          <div className="text-sm text-blue-600">Companies</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{data.total_signals_found || 0}</div>
          <div className="text-sm text-green-600">Signals</div>
        </div>
      </div>
      
      {/* Users List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Users</h3>
        <div className="space-y-4">
          {data.users?.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    {user.title && <div className="text-sm text-gray-600">{user.title}</div>}
                    {user.company && <div className="text-sm text-gray-500">{user.company}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className={`text-lg font-bold ${
                    user.confidence_score > 0.8 ? 'text-green-600' :
                    user.confidence_score > 0.6 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {Math.round(user.confidence_score * 100)}%
                  </div>
                </div>
              </div>
              
              {/* Signals */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Signals:</div>
                <div className="flex flex-wrap gap-2">
                  {user.signals.map((signal, i) => (
                    <SignalBadge key={i} signal={signal} />
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    LinkedIn
                  </a>
                )}
                {user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Companies Using */}
      {data.companies_using?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Companies Using This Product</h3>
          <div className="flex flex-wrap gap-2">
            {data.companies_using.map((company, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {company}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

```typescript
// /components/signal-badge.tsx

import { SignalType } from '@/lib/types';

interface Signal {
  type: SignalType;
  confidence: number;
  snippet: string;
  url: string;
}

const SIGNAL_LABELS: Record<SignalType, string> = {
  g2_review: 'G2 Review',
  capterra_review: 'Capterra',
  trustradius_review: 'TrustRadius',
  testimonial: 'Testimonial',
  linkedin_post: 'LinkedIn',
  twitter_mention: 'Twitter',
  reddit_post: 'Reddit',
  forum_post: 'Forum',
  github_issue: 'GitHub',
  stackoverflow: 'Stack Overflow',
  job_posting_inference: 'Job Posting',
};

const SIGNAL_COLORS: Record<SignalType, string> = {
  g2_review: 'bg-orange-100 text-orange-700',
  capterra_review: 'bg-orange-100 text-orange-700',
  trustradius_review: 'bg-orange-100 text-orange-700',
  testimonial: 'bg-purple-100 text-purple-700',
  linkedin_post: 'bg-blue-100 text-blue-700',
  twitter_mention: 'bg-sky-100 text-sky-700',
  reddit_post: 'bg-red-100 text-red-700',
  forum_post: 'bg-gray-100 text-gray-700',
  github_issue: 'bg-gray-800 text-white',
  stackoverflow: 'bg-amber-100 text-amber-700',
  job_posting_inference: 'bg-green-100 text-green-700',
};

export function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${SIGNAL_COLORS[signal.type]} hover:opacity-80`}
      title={signal.snippet}
    >
      {SIGNAL_LABELS[signal.type]}
      <span className="opacity-60">({Math.round(signal.confidence * 100)}%)</span>
    </a>
  );
}
```

```typescript
// /components/refresh-button.tsx

interface RefreshButtonProps {
  loading: boolean;
  onClick: () => void;
}

export function RefreshButton({ loading, onClick }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
```

---

## Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External APIs
CLEARBIT_API_KEY=your_clearbit_key  # Optional - autocomplete works without it
EXA_API_KEY=your_exa_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key  # Optional
```

---

## Supabase Client Setup

```typescript
// /lib/db.ts

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function createBrowserClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## Implementation Order

1. **Setup & Database**
   - Initialize Next.js project with TypeScript and Tailwind
   - Set up Supabase project and run migration
   - Create environment variables

2. **Basic UI**
   - Build search page with autocomplete
   - Build company page with tab structure
   - Add refresh button component

3. **Tab 1 Implementation**
   - Implement Perplexity summary strategy
   - Implement Clearbit enrichment (if API key available)
   - Wire up API endpoint

4. **Tab 2 Implementation**
   - Implement Exa social search
   - Implement Exa review search
   - Implement news search
   - Add Perplexity synthesis
   - Wire up API endpoint

5. **Tab 3 Implementation**
   - Implement review author extraction
   - Implement testimonial scraping
   - Implement LinkedIn mention search
   - Implement forum user search
   - Implement job posting inference
   - Add confidence scoring
   - Wire up API endpoint

6. **Polish**
   - Add error handling throughout
   - Add loading states
   - Test refresh functionality
   - Deploy to Vercel

---

## Notes for Implementation

1. **Rate Limiting**: Add rate limiting to API routes to prevent abuse

2. **Error Handling**: Each strategy should fail gracefully and not block others

3. **Caching Strategy**: Consider adding Redis (Upstash) for faster cache reads if Supabase latency is too high

4. **Cost Monitoring**: Track API costs per company lookup - consider adding a cost estimate in the UI

5. **Extensibility**: The strategy pattern makes it easy to add new data sources later

6. **Authentication**: This spec doesn't include auth - add Supabase Auth or Clerk if needed
