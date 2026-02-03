import {
  Tab2Data,
  Tier1OfficialSources,
  Tier2CommunitySources,
  Tier3ProductIntelligence,
} from '@/lib/types';

// Tier 1 imports
import { collectG2Data } from './tier1/g2';
import { collectCapterraData } from './tier1/capterra';
import { collectTrustRadiusData } from './tier1/trustradius';
import { collectLinkedInData } from './tier1/linkedin';
import { collectPressData, collectGartnerForresterData } from './tier1/press';

// Tier 2 imports
import { collectRedditData } from './tier2/reddit';
import { collectTwitterData } from './tier2/twitter';
import { collectHackerNewsData } from './tier2/hackernews';
import {
  collectDiscordData,
  collectOfficialCommunityData,
  collectProductHuntData,
  collectYouTubeData,
} from './tier2/community';

// Tier 3 imports
import { collectChangelogData } from './tier3/changelog';
import { collectGitHubData } from './tier3/github';
import { collectJobSignals } from './tier3/jobs';
import { collectRoadmapData, collectStatusPageData } from './tier3/roadmap';
import { collectHelpDocsData, collectApiDocsData, collectSupportData } from './tier3/helpdocs';

// Brief generator
import { generateExecutiveBrief } from './generate-brief';

export async function executeTab2Strategies(
  domain: string,
  companyName: string
): Promise<{ data: Tab2Data; sources: string[] }> {
  const sources: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1: OFFICIAL SOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[Tab2] Starting Tier 1: Official Sources...');

  const [
    g2Result,
    capterraResult,
    trustRadiusResult,
    linkedInResult,
    pressResult,
    analystResult,
  ] = await Promise.allSettled([
    collectG2Data(companyName, domain),
    collectCapterraData(companyName, domain),
    collectTrustRadiusData(companyName, domain),
    collectLinkedInData(companyName, domain),
    collectPressData(companyName, domain),
    collectGartnerForresterData(companyName),
  ]);

  const tier1: Tier1OfficialSources = {
    g2: g2Result.status === 'fulfilled' ? g2Result.value : null,
    capterra: capterraResult.status === 'fulfilled' ? capterraResult.value : null,
    trustradius: trustRadiusResult.status === 'fulfilled' ? trustRadiusResult.value : null,
    gartner: analystResult.status === 'fulfilled' ? analystResult.value?.gartner ?? null : null,
    forrester: analystResult.status === 'fulfilled' ? analystResult.value?.forrester ?? null : null,
    linkedin: linkedInResult.status === 'fulfilled' ? linkedInResult.value : null,
    crunchbase_news: pressResult.status === 'fulfilled' ? pressResult.value.crunchbase_news : [],
    press_releases: pressResult.status === 'fulfilled' ? pressResult.value.press_releases : [],
    analyst_coverage: pressResult.status === 'fulfilled' ? pressResult.value.analyst_coverage : [],
  };

  if (tier1.g2) sources.push('g2');
  if (tier1.capterra) sources.push('capterra');
  if (tier1.trustradius) sources.push('trustradius');
  if (tier1.linkedin) sources.push('linkedin');
  if (tier1.press_releases.length > 0) sources.push('press');

  console.log('[Tab2] Tier 1 complete. Sources:', sources.filter(s => ['g2', 'capterra', 'trustradius', 'linkedin', 'press'].includes(s)));

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2: COMMUNITY & SOCIAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[Tab2] Starting Tier 2: Community & Social...');

  const [
    redditResult,
    twitterResult,
    hnResult,
    discordResult,
    communityResult,
    productHuntResult,
    youtubeResult,
  ] = await Promise.allSettled([
    collectRedditData(companyName, companyName),
    collectTwitterData(companyName, companyName),
    collectHackerNewsData(companyName, companyName),
    collectDiscordData(companyName, domain),
    collectOfficialCommunityData(companyName, domain),
    collectProductHuntData(companyName, companyName),
    collectYouTubeData(companyName, companyName),
  ]);

  // Calculate aggregate sentiment
  let totalMentions = 0;
  let sentimentSum = 0;
  let mostActivePlatform = 'unknown';
  let maxMentions = 0;

  const reddit = redditResult.status === 'fulfilled' ? redditResult.value : null;
  const twitter = twitterResult.status === 'fulfilled' ? twitterResult.value : null;
  const hn = hnResult.status === 'fulfilled' ? hnResult.value : null;

  if (reddit) {
    const redditMentions = reddit.top_threads?.length || 0;
    totalMentions += redditMentions;
    sentimentSum += reddit.sentiment.positive - reddit.sentiment.negative;
    if (redditMentions > maxMentions) {
      maxMentions = redditMentions;
      mostActivePlatform = 'Reddit';
    }
    sources.push('reddit');
  }

  if (twitter) {
    const twitterMentions = twitter.notable_tweets?.length || 0;
    totalMentions += twitterMentions;
    if (twitter.sentiment_score) sentimentSum += twitter.sentiment_score - 50;
    if (twitterMentions > maxMentions) {
      maxMentions = twitterMentions;
      mostActivePlatform = 'Twitter';
    }
    sources.push('twitter');
  }

  if (hn) {
    const hnMentions = hn.total_stories + hn.total_comments;
    totalMentions += hnMentions;
    if (hnMentions > maxMentions) {
      maxMentions = hnMentions;
      mostActivePlatform = 'Hacker News';
    }
    sources.push('hackernews');
  }

  const aggregateScore = totalMentions > 0 ? Math.min(100, Math.max(0, 50 + sentimentSum)) : 50;

  const tier2: Tier2CommunitySources = {
    aggregate_sentiment: {
      score: aggregateScore,
      label: aggregateScore > 65 ? 'positive' : aggregateScore < 35 ? 'negative' : 'mixed',
      total_mentions: totalMentions,
      most_active_platform: mostActivePlatform,
    },
    reddit,
    twitter,
    hacker_news: hn,
    facebook: null, // Limited access
    discord: discordResult.status === 'fulfilled' ? discordResult.value : null,
    official_community: communityResult.status === 'fulfilled' ? communityResult.value : null,
    youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : null,
    product_hunt: productHuntResult.status === 'fulfilled' ? productHuntResult.value : null,
    quora: null, // Skipping for now
  };

  if (tier2.discord?.has_official_server) sources.push('discord');
  if (tier2.official_community) sources.push('community');
  if (tier2.product_hunt) sources.push('producthunt');
  if (tier2.youtube) sources.push('youtube');

  console.log('[Tab2] Tier 2 complete. Social sources:', sources.filter(s => ['reddit', 'twitter', 'hackernews', 'discord', 'community', 'producthunt', 'youtube'].includes(s)));

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3: PRODUCT INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[Tab2] Starting Tier 3: Product Intelligence...');

  const [
    changelogResult,
    githubResult,
    jobsResult,
    roadmapResult,
    statusResult,
    helpDocsResult,
    apiDocsResult,
  ] = await Promise.allSettled([
    collectChangelogData(domain, companyName),
    collectGitHubData(companyName, domain),
    collectJobSignals(companyName, domain),
    collectRoadmapData(domain, companyName),
    collectStatusPageData(domain),
    collectHelpDocsData(domain, companyName),
    collectApiDocsData(domain, companyName),
  ]);

  const changelog = changelogResult.status === 'fulfilled' ? changelogResult.value : null;
  const github = githubResult.status === 'fulfilled' ? githubResult.value : null;
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : {
    total_open_roles: 0,
    careers_url: null,
    product_signals: [],
    tech_investments: [],
    team_signals: [],
    expansion_signals: [],
  };

  // Get support data with G2 rating
  const g2SupportRating = tier1.g2?.scores?.quality_of_support || null;
  const supportResult = await collectSupportData(domain, companyName, g2SupportRating);

  const tier3: Tier3ProductIntelligence = {
    changelog,
    help_docs: helpDocsResult.status === 'fulfilled' ? helpDocsResult.value : null,
    github,
    support: supportResult,
    api_docs: apiDocsResult.status === 'fulfilled' ? apiDocsResult.value : null,
    public_roadmap: roadmapResult.status === 'fulfilled' ? roadmapResult.value : null,
    status_page: statusResult.status === 'fulfilled' ? statusResult.value : null,
    job_signals: jobs,
  };

  if (tier3.changelog) sources.push('changelog');
  if (tier3.github) sources.push('github');
  if (tier3.public_roadmap) sources.push('roadmap');
  if (tier3.status_page) sources.push('statuspage');
  if (tier3.help_docs) sources.push('helpdocs');
  if (jobs.total_open_roles > 0) sources.push('jobs');

  console.log('[Tab2] Tier 3 complete. Product sources:', sources.filter(s => ['changelog', 'github', 'roadmap', 'statuspage', 'helpdocs', 'jobs'].includes(s)));

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE BRIEF GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[Tab2] Generating Executive Brief...');

  const executiveBrief = await generateExecutiveBrief(tier1, tier2, tier3, companyName);

  console.log('[Tab2] Executive Brief complete.');

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL ASSEMBLY
  // ═══════════════════════════════════════════════════════════════════════════

  const data: Tab2Data = {
    executive_brief: executiveBrief,
    tier1,
    tier2,
    tier3,
  };

  console.log('[Tab2] All data collected. Total sources:', sources.length);

  return { data, sources };
}
