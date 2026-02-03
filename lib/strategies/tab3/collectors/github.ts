import { RawSignal } from '@/lib/types';
import { SIGNAL_WEIGHTS, SIGNAL_TIERS } from '../scoring';

export async function collectGitHubSignals(productName: string): Promise<RawSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  const signals: RawSignal[] = [];

  try {
    // Find product's GitHub
    let orgRepo: { owner: string; repo: string } | null = null;

    if (exaKey) {
      const repoSearchResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:github.com "${productName}" (repository OR organization)`,
          numResults: 5,
        }),
      });

      const repoSearchData = await repoSearchResponse.json();
      orgRepo = extractGitHubOrgRepo(repoSearchData.results || []);
    }

    if (!orgRepo) return signals;

    const { owner, repo } = orgRepo;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Get issues (people with questions = users)
    const issuesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&sort=created&per_page=50`,
      { headers }
    );

    if (issuesRes.ok) {
      const issues = await issuesRes.json();

      for (const issue of issues.slice(0, 30)) {
        if (!issue.user || issue.user.login.includes('bot') || issue.user.login.includes('[bot]')) continue;

        // Get user profile for more info
        const userRes = await fetch(`https://api.github.com/users/${issue.user.login}`, { headers });
        const user = userRes.ok ? await userRes.json() : {};

        signals.push({
          id: crypto.randomUUID(),
          source: 'github_issue',
          tier: SIGNAL_TIERS.github_issue,
          source_url: issue.html_url,
          extracted_name: user.name || issue.user.login,
          extracted_company: user.company?.replace(/^@/, '') || null,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: user.twitter_username ? `@${user.twitter_username}` : null,
          extracted_github: issue.user.login,
          extracted_email: user.email || null,
          signal_text: issue.title,
          signal_date: issue.created_at?.substring(0, 10),
          base_confidence: SIGNAL_WEIGHTS.github_issue,
        });
      }
    }

    // Get contributors (strong signal - actually contributing)
    const contribRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`,
      { headers }
    );

    if (contribRes.ok) {
      const contributors = await contribRes.json();

      for (const contrib of contributors.slice(0, 20)) {
        if (contrib.login.includes('bot') || contrib.login.includes('[bot]')) continue;

        const userRes = await fetch(`https://api.github.com/users/${contrib.login}`, { headers });
        const user = userRes.ok ? await userRes.json() : {};

        signals.push({
          id: crypto.randomUUID(),
          source: 'github_contributor',
          tier: SIGNAL_TIERS.github_contributor,
          source_url: `https://github.com/${contrib.login}`,
          extracted_name: user.name || contrib.login,
          extracted_company: user.company?.replace(/^@/, '') || null,
          extracted_role: null,
          extracted_linkedin: null,
          extracted_twitter: user.twitter_username ? `@${user.twitter_username}` : null,
          extracted_github: contrib.login,
          extracted_email: user.email || null,
          signal_text: `${contrib.contributions} contributions to ${repo}`,
          signal_date: null,
          base_confidence: SIGNAL_WEIGHTS.github_contributor,
        });
      }
    }
  } catch (error) {
    console.error('GitHub signals collection error:', error);
  }

  return signals;
}

function extractGitHubOrgRepo(
  results: Array<{ url: string }>
): { owner: string; repo: string } | null {
  for (const result of results) {
    const match = result.url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  return null;
}
