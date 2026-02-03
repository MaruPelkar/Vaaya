import {
  ExecutiveBrief,
  Tier1OfficialSources,
  Tier2CommunitySources,
  Tier3ProductIntelligence,
} from '@/lib/types';

export async function generateExecutiveBrief(
  tier1: Tier1OfficialSources,
  tier2: Tier2CommunitySources,
  tier3: Tier3ProductIntelligence,
  companyName: string
): Promise<ExecutiveBrief> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  const defaultBrief: ExecutiveBrief = {
    generated_at: new Date().toISOString(),
    whats_new: {
      summary: 'Unable to generate summary.',
      releases: [],
      time_period: 'Last 3 months',
      total_releases_found: 0,
    },
    market_reaction: {
      summary: 'Unable to generate summary.',
      sentiment: {
        score: 50,
        label: 'mixed',
        trend: 'stable',
        based_on_mentions: 0,
      },
      positive_themes: [],
      negative_themes: [],
      notable_reactions: [],
    },
    product_direction: {
      summary: 'Unable to generate summary.',
      confirmed_roadmap: [],
      likely_priorities: [],
      top_requested_features: [],
      strategic_signals: [],
    },
  };

  if (!perplexityKey) return defaultBrief;

  // Collect all release signals
  const releaseSignals = [
    ...(tier3.changelog?.releases?.slice(0, 10) || []),
    ...(tier1.press_releases?.filter(p => p.category === 'product').slice(0, 5) || []),
  ];

  // Collect reaction signals
  const reactionData = {
    g2_rating: tier1.g2?.overall_rating,
    g2_reviews: tier1.g2?.total_reviews,
    g2_pros: tier1.g2?.top_pros,
    g2_cons: tier1.g2?.top_cons,
    capterra_rating: tier1.capterra?.overall_rating,
    reddit_sentiment: tier2.reddit?.sentiment,
    reddit_praise: tier2.reddit?.common_praise,
    reddit_complaints: tier2.reddit?.common_complaints,
    reddit_threads: tier2.reddit?.top_threads?.slice(0, 3),
    twitter_sentiment: tier2.twitter?.sentiment_score,
    hn_stories: tier2.hacker_news?.top_stories?.slice(0, 3),
    notable_tweets: tier2.twitter?.notable_tweets?.slice(0, 3),
  };

  // Collect direction signals
  const directionData = {
    roadmap_items: tier3.public_roadmap?.items?.slice(0, 10),
    most_voted: tier3.public_roadmap?.most_voted,
    github_features: tier3.github?.feature_requests?.slice(0, 5),
    github_priorities: tier3.github?.inferred_priorities,
    job_signals: tier3.job_signals?.product_signals?.slice(0, 5),
    team_signals: tier3.job_signals?.team_signals,
    expansion_signals: tier3.job_signals?.expansion_signals,
    active_areas: tier3.changelog?.active_areas,
    community_requests: tier2.official_community?.trending_feature_requests,
  };

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: `You are a business intelligence analyst creating executive briefs. Synthesize data into clear, actionable insights. Be specific, cite evidence, and indicate confidence levels. Return valid JSON only.`,
          },
          {
            role: 'user',
            content: `Create an executive intelligence brief for ${companyName}.

RELEASE DATA:
${JSON.stringify(releaseSignals, null, 2)}

REACTION DATA:
${JSON.stringify(reactionData, null, 2)}

DIRECTION DATA:
${JSON.stringify(directionData, null, 2)}

Return JSON matching this structure:
{
  "whats_new": {
    "summary": "2-3 sentence overview of recent releases and their significance",
    "releases": [
      {"title": string, "type": "major_feature"|"minor_feature"|"integration"|"improvement"|"announcement", "date": "YYYY-MM-DD", "description": string, "source": string, "source_url": string, "impact": "high"|"medium"|"low"}
    ],
    "time_period": "Last 3 months",
    "total_releases_found": number
  },
  "market_reaction": {
    "summary": "2-3 sentence overview of market sentiment and key themes",
    "sentiment": {
      "score": 0-100,
      "label": "very_positive"|"positive"|"mixed"|"negative"|"very_negative",
      "trend": "improving"|"stable"|"declining",
      "based_on_mentions": number
    },
    "positive_themes": [
      {"theme": string, "frequency": "very_common"|"common"|"occasional", "example_quote": string or null, "sources": [strings]}
    ],
    "negative_themes": [
      {"theme": string, "frequency": "very_common"|"common"|"occasional", "example_quote": string or null, "sources": [strings]}
    ],
    "notable_reactions": [
      {"quote": string, "source": string, "source_url": string or null, "sentiment": "positive"|"negative"|"neutral", "author_context": string or null}
    ]
  },
  "product_direction": {
    "summary": "2-3 sentence overview of where the company is heading",
    "confirmed_roadmap": [
      {"feature": string, "status": "announced"|"in_beta"|"coming_soon", "expected_timeline": string or null, "source": string, "source_url": string}
    ],
    "likely_priorities": [
      {"area": string, "confidence": "high"|"medium"|"low", "evidence": [strings], "signal_count": number}
    ],
    "top_requested_features": [
      {"feature": string, "demand_level": "high"|"medium"|"low", "sources": [strings], "vote_count": number or null}
    ],
    "strategic_signals": [
      {"signal": string, "evidence": string, "confidence": "high"|"medium"|"low"}
    ]
  }
}

Include up to 5 releases, 5 positive/negative themes, 3 notable reactions, 5 roadmap items, 5 priorities, 5 requested features, and 3 strategic signals.
Only return valid JSON, no other text.`,
          },
        ],
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          generated_at: new Date().toISOString(),
          whats_new: parsed.whats_new || defaultBrief.whats_new,
          market_reaction: parsed.market_reaction || defaultBrief.market_reaction,
          product_direction: parsed.product_direction || defaultBrief.product_direction,
        };
      }
    }

    return defaultBrief;
  } catch (error) {
    console.error('Executive brief generation error:', error);
    return defaultBrief;
  }
}
