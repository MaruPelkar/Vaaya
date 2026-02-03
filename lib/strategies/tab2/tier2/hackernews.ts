import { Tier2CommunitySources } from '@/lib/types';

interface HNSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    url: string;
    author: string;
    points: number;
    num_comments: number;
    created_at: string;
    story_text?: string;
  }>;
  nbHits: number;
}

interface HNCommentResult {
  hits: Array<{
    objectID: string;
    comment_text: string;
    author: string;
    points: number;
    story_title: string;
    created_at: string;
  }>;
  nbHits: number;
}

export async function collectHackerNewsData(
  companyName: string,
  productName: string
): Promise<Tier2CommunitySources['hacker_news']> {
  try {
    // Use Algolia HN Search API (free)
    const [storiesResponse, commentsResponse, showHNResponse] = await Promise.all([
      fetch(`https://hn.algolia.com/api/v1/search?query="${encodeURIComponent(productName)}"&tags=story&hitsPerPage=20`),
      fetch(`https://hn.algolia.com/api/v1/search?query="${encodeURIComponent(productName)}"&tags=comment&hitsPerPage=30`),
      fetch(`https://hn.algolia.com/api/v1/search?query="${encodeURIComponent(productName)}"&tags=show_hn&hitsPerPage=10`),
    ]);

    const [stories, comments, showHN] = await Promise.all([
      storiesResponse.json() as Promise<HNSearchResult>,
      commentsResponse.json() as Promise<HNCommentResult>,
      showHNResponse.json() as Promise<HNSearchResult>,
    ]);

    if (stories.nbHits === 0 && comments.nbHits === 0) return null;

    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    // Sort stories by points
    const topStories = stories.hits
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    // Sort comments by points
    const topComments = comments.hits
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);

    if (!perplexityKey) {
      return {
        total_stories: stories.nbHits,
        total_comments: comments.nbHits,
        top_stories: topStories.map(s => ({
          title: s.title,
          points: s.points,
          num_comments: s.num_comments,
          date: s.created_at,
          discussion_sentiment: 'mixed' as const,
          key_discussion_points: [],
          url: `https://news.ycombinator.com/item?id=${s.objectID}`,
        })),
        show_hn_posts: showHN.hits.slice(0, 5).map(s => ({
          title: s.title,
          points: s.points,
          num_comments: s.num_comments,
          date: s.created_at,
          url: `https://news.ycombinator.com/item?id=${s.objectID}`,
        })),
        notable_comments: topComments.slice(0, 5).map(c => ({
          context: c.story_title,
          comment_snippet: c.comment_text?.substring(0, 200) || '',
          points: c.points || 0,
        })),
      };
    }

    // Analyze sentiment and key points with Perplexity
    const extractResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You analyze Hacker News discussions. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze HN discussions about ${productName}:

TOP STORIES:
${topStories.slice(0, 5).map(s => `Title: ${s.title}\nPoints: ${s.points}\nComments: ${s.num_comments}`).join('\n\n')}

NOTABLE COMMENTS:
${topComments.slice(0, 8).map(c => `"${c.comment_text?.substring(0, 300) || ''}"`).join('\n\n')}

For each story, determine sentiment and key discussion points. Return JSON:
{
  "top_stories": [
    {"title": string, "points": number, "num_comments": number, "date": string, "discussion_sentiment": "positive"|"negative"|"mixed", "key_discussion_points": [strings], "url": string}
  ],
  "notable_comments": [
    {"context": string, "comment_snippet": string, "points": number}
  ]
}

Only return JSON.`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData.choices?.[0]?.message?.content;

    let analyzedStories = topStories.map(s => ({
      title: s.title,
      points: s.points,
      num_comments: s.num_comments,
      date: s.created_at,
      discussion_sentiment: 'mixed' as const,
      key_discussion_points: [] as string[],
      url: `https://news.ycombinator.com/item?id=${s.objectID}`,
    }));

    let analyzedComments = topComments.slice(0, 5).map(c => ({
      context: c.story_title,
      comment_snippet: c.comment_text?.substring(0, 200) || '',
      points: c.points || 0,
    }));

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.top_stories) analyzedStories = parsed.top_stories;
        if (parsed.notable_comments) analyzedComments = parsed.notable_comments;
      }
    }

    return {
      total_stories: stories.nbHits,
      total_comments: comments.nbHits,
      top_stories: analyzedStories.slice(0, 5),
      show_hn_posts: showHN.hits.slice(0, 5).map(s => ({
        title: s.title,
        points: s.points,
        num_comments: s.num_comments,
        date: s.created_at,
        url: `https://news.ycombinator.com/item?id=${s.objectID}`,
      })),
      notable_comments: analyzedComments,
    };
  } catch (error) {
    console.error('HackerNews collection error:', error);
    return null;
  }
}
