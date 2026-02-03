import { Tier3ProductIntelligence } from '@/lib/types';

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  private: boolean;
}

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string }>;
  comments: number;
  reactions?: { total_count: number };
  created_at: string;
}

interface GitHubPR {
  title: string;
  html_url: string;
  merged_at: string | null;
  labels: Array<{ name: string }>;
}

export async function collectGitHubData(
  companyName: string,
  domain: string
): Promise<Tier3ProductIntelligence['github']> {
  try {
    // Try to find GitHub org
    const exaKey = process.env.EXA_API_KEY;
    let orgName = '';

    if (exaKey) {
      const searchResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `site:github.com "${companyName}" (organization OR org)`,
          numResults: 5,
        }),
      });

      const searchData = await searchResponse.json();
      for (const result of searchData.results || []) {
        const match = result.url.match(/github\.com\/([^/]+)/);
        if (match && !['topics', 'search', 'explore'].includes(match[1])) {
          orgName = match[1];
          break;
        }
      }
    }

    // Try company name variations
    if (!orgName) {
      const variations = [
        companyName.toLowerCase().replace(/\s+/g, ''),
        companyName.toLowerCase().replace(/\s+/g, '-'),
        domain.split('.')[0],
      ];

      for (const name of variations) {
        const response = await fetch(`https://api.github.com/orgs/${name}/repos?sort=stars&per_page=1`);
        if (response.ok) {
          orgName = name;
          break;
        }
      }
    }

    if (!orgName) return null;

    // Fetch org repos
    const reposResponse = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?sort=stars&per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}),
        },
      }
    );

    if (!reposResponse.ok) return null;

    const repos: GitHubRepo[] = await reposResponse.json();
    if (repos.length === 0) return null;

    const mainRepo = repos[0];

    // Fetch issues and PRs in parallel
    const [issuesResponse, prsResponse, contributorsResponse] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${orgName}/${mainRepo.name}/issues?state=all&sort=comments&per_page=50`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}),
          },
        }
      ),
      fetch(
        `https://api.github.com/repos/${orgName}/${mainRepo.name}/pulls?state=closed&sort=updated&per_page=20`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}),
          },
        }
      ),
      fetch(
        `https://api.github.com/repos/${orgName}/${mainRepo.name}/contributors?per_page=1`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}),
          },
        }
      ),
    ]);

    const issues: GitHubIssue[] = issuesResponse.ok ? await issuesResponse.json() : [];
    const prs: GitHubPR[] = prsResponse.ok ? await prsResponse.json() : [];
    const contributorCount = contributorsResponse.ok
      ? parseInt(contributorsResponse.headers.get('Link')?.match(/page=(\d+)>; rel="last"/)?.[1] || '0') || 1
      : 0;

    // Categorize issues
    const featureRequests = issues.filter(i =>
      i.labels.some(l =>
        l.name.toLowerCase().includes('feature') ||
        l.name.toLowerCase().includes('enhancement') ||
        l.name.toLowerCase().includes('request')
      )
    );

    const bugs = issues.filter(i =>
      i.labels.some(l => l.name.toLowerCase().includes('bug'))
    );

    // Hot issues (most engagement)
    const hotIssues = [...issues]
      .sort((a, b) => (b.comments + (b.reactions?.total_count || 0)) - (a.comments + (a.reactions?.total_count || 0)))
      .slice(0, 10);

    // Calculate activity level
    const lastCommit = new Date(mainRepo.pushed_at);
    const daysSinceCommit = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
    let activityLevel: 'very_active' | 'active' | 'moderate' | 'low' = 'low';
    if (daysSinceCommit < 3) activityLevel = 'very_active';
    else if (daysSinceCommit < 14) activityLevel = 'active';
    else if (daysSinceCommit < 60) activityLevel = 'moderate';

    // Infer priorities from labels and recent activity
    const labelCounts: Record<string, number> = {};
    issues.forEach(i => {
      i.labels.forEach(l => {
        labelCounts[l.name] = (labelCounts[l.name] || 0) + 1;
      });
    });

    const inferredPriorities = Object.entries(labelCounts)
      .filter(([name]) => !['bug', 'enhancement', 'feature', 'help wanted', 'good first issue'].includes(name.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Extract bug patterns
    const bugPatterns = bugs.slice(0, 10).map(b => b.title);

    return {
      org_name: orgName,
      main_repo: mainRepo.name,
      is_open_source: !mainRepo.private,
      metrics: {
        stars: mainRepo.stargazers_count,
        forks: mainRepo.forks_count,
        open_issues: mainRepo.open_issues_count,
        open_prs: prs.filter(p => !p.merged_at).length,
        contributors: contributorCount,
        last_commit: mainRepo.pushed_at,
        activity_level: activityLevel,
      },
      recent_issues: issues.slice(0, 15).map(i => ({
        title: i.title,
        number: i.number,
        state: i.state,
        labels: i.labels.map(l => l.name),
        comments: i.comments,
        reactions: i.reactions?.total_count || 0,
        date: i.created_at,
        issue_type: i.labels.some(l => l.name.toLowerCase().includes('bug'))
          ? 'bug'
          : i.labels.some(l => l.name.toLowerCase().includes('feature') || l.name.toLowerCase().includes('enhancement'))
            ? 'feature_request'
            : i.labels.some(l => l.name.toLowerCase().includes('question'))
              ? 'question'
              : 'other',
        url: i.html_url,
      })),
      hot_issues: hotIssues.slice(0, 5).map(i => ({
        title: i.title,
        comments: i.comments,
        reactions: i.reactions?.total_count || 0,
        url: i.html_url,
      })),
      feature_requests: featureRequests.slice(0, 10).map(i => ({
        title: i.title,
        reactions: i.reactions?.total_count || 0,
        comments: i.comments,
        status: i.state,
        url: i.html_url,
      })),
      bug_patterns: bugPatterns,
      recent_prs: prs.filter(p => p.merged_at).slice(0, 10).map(p => ({
        title: p.title,
        merged_at: p.merged_at!,
        labels: p.labels.map(l => l.name),
        url: p.html_url,
      })),
      inferred_priorities: inferredPriorities,
    };
  } catch (error) {
    console.error('GitHub collection error:', error);
    return null;
  }
}
