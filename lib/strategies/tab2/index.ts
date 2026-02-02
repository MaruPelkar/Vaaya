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

  if (socialResult.status === 'fulfilled' && socialResult.value.length) {
    sources.push('exa_social');
    allMentions.push(...socialResult.value);
  }

  if (reviewsResult.status === 'fulfilled' && reviewsResult.value.length) {
    sources.push('exa_reviews');
    allMentions.push(...reviewsResult.value);
  }

  if (newsResult.status === 'fulfilled' && newsResult.value.length) {
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
