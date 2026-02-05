import { scrapeUrl } from '@/lib/firecrawl';

export interface DocsResult {
  markdown: string;
  metadata?: Record<string, string>;
  source: string;
  type: 'docs' | 'api' | 'changelog';
}

/**
 * Scrape documentation or API pages
 */
export async function scrapeDocsPage(domain: string): Promise<DocsResult | null> {
  const docsPaths = [
    { path: '/docs', type: 'docs' as const },
    { path: '/documentation', type: 'docs' as const },
    { path: '/api', type: 'api' as const },
    { path: '/developers', type: 'api' as const },
    { path: '/api-reference', type: 'api' as const },
  ];

  for (const { path, type } of docsPaths) {
    const url = `https://${domain}${path}`;
    console.log(`[Product/Docs] Trying docs page: ${url}`);

    const result = await scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (result.success && result.markdown) {
      console.log(`[Product/Docs] Found docs at ${url} (${result.markdown.length} chars)`);
      return {
        markdown: result.markdown,
        metadata: result.metadata as Record<string, string> | undefined,
        source: url,
        type,
      };
    }
  }

  console.log(`[Product/Docs] Could not find docs page for ${domain}`);
  return null;
}

/**
 * Scrape changelog or release notes
 */
export async function scrapeChangelogPage(domain: string): Promise<DocsResult | null> {
  const changelogPaths = [
    '/changelog',
    '/releases',
    '/release-notes',
    '/whats-new',
    '/updates',
    '/news',
  ];

  for (const path of changelogPaths) {
    const url = `https://${domain}${path}`;
    console.log(`[Product/Docs] Trying changelog page: ${url}`);

    const result = await scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (result.success && result.markdown) {
      console.log(`[Product/Docs] Found changelog at ${url} (${result.markdown.length} chars)`);
      return {
        markdown: result.markdown,
        metadata: result.metadata as Record<string, string> | undefined,
        source: url,
        type: 'changelog',
      };
    }
  }

  console.log(`[Product/Docs] Could not find changelog for ${domain}`);
  return null;
}
