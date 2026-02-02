import { RawUserSignal } from './types';

export async function searchForumUsers(companyName: string): Promise<RawUserSignal[]> {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return [];

  const signals: RawUserSignal[] = [];

  try {
    // Search Stack Overflow
    const soResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" site:stackoverflow.com`,
        numResults: 10,
        type: 'auto',
        contents: {
          text: { maxCharacters: 800 },
        },
      }),
    });

    if (soResponse.ok) {
      const soData = await soResponse.json();
      for (const result of (soData.results || []).slice(0, 5)) {
        if (!result.text) continue;
        // Extract username from URL or content
        const username = extractStackOverflowUser(result.url, result.text);
        if (username) {
          signals.push({
            name: username,
            signalType: 'stackoverflow',
            confidence: 0.70,
            snippet: result.text.slice(0, 100),
            url: result.url,
            date: result.publishedDate,
          });
        }
      }
    }

    // Search GitHub Issues/Discussions
    const ghResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': exaKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" (issue OR discussion) site:github.com`,
        numResults: 10,
        type: 'auto',
        contents: {
          text: { maxCharacters: 800 },
        },
      }),
    });

    if (ghResponse.ok) {
      const ghData = await ghResponse.json();
      for (const result of (ghData.results || []).slice(0, 5)) {
        if (!result.text) continue;
        const username = extractGitHubUser(result.url);
        if (username) {
          signals.push({
            name: username,
            signalType: 'github_issue',
            confidence: 0.75,
            snippet: result.text.slice(0, 100),
            url: result.url,
            date: result.publishedDate,
          });
        }
      }
    }
  } catch (error) {
    console.error('Forums search error:', error);
  }

  return signals;
}

function extractStackOverflowUser(url: string, text: string): string | null {
  // Try to extract from URL pattern like /users/123456/username
  const urlMatch = url.match(/\/users\/\d+\/([^\/\?]+)/);
  if (urlMatch) {
    return urlMatch[1].replace(/-/g, ' ');
  }

  // Try to extract "asked by" or "answered by" from text
  const textMatch = text.match(/(?:asked|answered)\s+by\s+([A-Za-z0-9_-]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return null;
}

function extractGitHubUser(url: string): string | null {
  // GitHub URLs: github.com/user/repo/issues/123
  // or github.com/user/repo/discussions/123
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match && match[1] !== 'orgs') {
    return match[1];
  }
  return null;
}
