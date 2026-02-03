'use client';

import { useState } from 'react';
import { Tab2Data } from '@/lib/types';

interface Tab2IntelligenceProps {
  data: Tab2Data;
}

type DetailTab = 'official' | 'community' | 'product';

export function Tab2Intelligence({ data }: Tab2IntelligenceProps) {
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('official');
  const { executive_brief, tier1, tier2, tier3 } = data;

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSentimentLabel = (label: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      very_positive: { text: 'Very Positive', color: 'text-green-700 bg-green-100' },
      positive: { text: 'Positive', color: 'text-green-600 bg-green-50' },
      mixed: { text: 'Mixed', color: 'text-yellow-700 bg-yellow-100' },
      negative: { text: 'Negative', color: 'text-red-600 bg-red-50' },
      very_negative: { text: 'Very Negative', color: 'text-red-700 bg-red-100' },
    };
    return labels[label] || { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
  };

  return (
    <div className="space-y-12">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EXECUTIVE BRIEF */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Executive Brief</h2>

        {/* What's New Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🚀</span>
            <h3 className="text-xl font-semibold text-gray-900">What's New</h3>
            <span className="text-xs text-slate-500 ml-auto">{executive_brief.whats_new.time_period}</span>
          </div>
          <p className="text-slate-600 text-sm mb-4">{executive_brief.whats_new.summary}</p>

          {executive_brief.whats_new.releases.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {executive_brief.whats_new.releases.slice(0, 4).map((release, i) => (
                <div key={i} className="flex-shrink-0 w-40 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="font-medium text-slate-800 text-sm truncate">{release.title}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                    release.type === 'major_feature' ? 'bg-blue-100 text-blue-700' :
                    release.type === 'integration' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {release.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">{release.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Reaction Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="text-xl font-semibold text-gray-900">Market Reaction</h3>
            <div className="ml-auto flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-xs font-medium ${getSentimentLabel(executive_brief.market_reaction.sentiment.label).color}`}>
                {getSentimentLabel(executive_brief.market_reaction.sentiment.label).text}
              </span>
              <span className="text-xl font-bold text-gray-900">{executive_brief.market_reaction.sentiment.score}</span>
            </div>
          </div>
          <p className="text-gray-700 text-base mb-6 leading-relaxed">{executive_brief.market_reaction.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Themes */}
            <div className="bg-white rounded-lg p-6 border border-green-300 shadow-sm">
              <h4 className="text-base font-bold text-green-700 mb-3">What People Love</h4>
              <ul className="space-y-2">
                {executive_brief.market_reaction.positive_themes.slice(0, 4).map((theme, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 font-bold">+</span>
                    <span>{theme.theme}</span>
                  </li>
                ))}
                {executive_brief.market_reaction.positive_themes.length === 0 && (
                  <li className="text-sm text-gray-500">No data available</li>
                )}
              </ul>
            </div>

            {/* Negative Themes */}
            <div className="bg-white rounded-lg p-6 border border-red-300 shadow-sm">
              <h4 className="text-base font-bold text-red-700 mb-3">Concerns Raised</h4>
              <ul className="space-y-2">
                {executive_brief.market_reaction.negative_themes.slice(0, 4).map((theme, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5 font-bold">-</span>
                    <span>{theme.theme}</span>
                  </li>
                ))}
                {executive_brief.market_reaction.negative_themes.length === 0 && (
                  <li className="text-sm text-gray-500">No data available</li>
                )}
              </ul>
            </div>
          </div>

          {/* Notable Reactions */}
          {executive_brief.market_reaction.notable_reactions.length > 0 && (
            <div className="mt-6 p-6 bg-white rounded-lg border border-gray-300 shadow-sm">
              <div className="text-base text-gray-900 italic">
                "{executive_brief.market_reaction.notable_reactions[0].quote}"
              </div>
              <div className="text-sm text-gray-600 mt-3 font-medium">
                — {executive_brief.market_reaction.notable_reactions[0].source}
                {executive_brief.market_reaction.notable_reactions[0].author_context &&
                  ` (${executive_brief.market_reaction.notable_reactions[0].author_context})`}
              </div>
            </div>
          )}
        </div>

        {/* Product Direction Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔮</span>
            <h3 className="text-xl font-semibold text-gray-900">Product Direction</h3>
          </div>
          <p className="text-gray-700 text-base mb-6 leading-relaxed">{executive_brief.product_direction.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confirmed Roadmap */}
            {executive_brief.product_direction.confirmed_roadmap.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-3">Confirmed Roadmap</h4>
                <ul className="space-y-2">
                  {executive_brief.product_direction.confirmed_roadmap.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      <span>{item.feature}</span>
                      {item.expected_timeline && (
                        <span className="text-xs text-blue-600 font-medium ml-2">({item.expected_timeline})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Requested Features */}
            {executive_brief.product_direction.top_requested_features.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-3">Top Requested</h4>
                <ul className="space-y-2">
                  {executive_brief.product_direction.top_requested_features.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span>{item.feature}</span>
                      {item.vote_count && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {item.vote_count} votes
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Strategic Signals */}
          {executive_brief.product_direction.strategic_signals.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {executive_brief.product_direction.strategic_signals.slice(0, 3).map((signal, i) => (
                <div key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                  signal.confidence === 'high' ? 'bg-green-100 text-green-700' :
                  signal.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {signal.signal}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DETAIL TABS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <div className="border-b border-gray-300 mb-8">
        <nav className="flex gap-6">
          {[
            { id: 'official', label: 'Official Sources', icon: '📋' },
            { id: 'community', label: 'Community & Social', icon: '💬' },
            { id: 'product', label: 'Product Signals', icon: '🔬' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id as DetailTab)}
              className={`px-4 py-3 text-base font-semibold border-b-2 transition-colors ${
                activeDetailTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Official Sources Tab */}
      {activeDetailTab === 'official' && (
        <div className="space-y-8">
          {/* Review Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* G2 */}
            {tier1.g2 && (
              <a href={tier1.g2.url} target="_blank" rel="noopener noreferrer" className="p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">G2</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900">{tier1.g2.overall_rating.toFixed(1)}</span>
                    <span className="text-yellow-500 text-lg">★</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">{tier1.g2.total_reviews} reviews</div>
                {tier1.g2.categories[0]?.badge && (
                  <div className="mt-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium inline-block">
                    {tier1.g2.categories[0].badge}
                  </div>
                )}
              </a>
            )}

            {/* Capterra */}
            {tier1.capterra && (
              <a href={tier1.capterra.url} target="_blank" rel="noopener noreferrer" className="p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">Capterra</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900">{tier1.capterra.overall_rating.toFixed(1)}</span>
                    <span className="text-yellow-500 text-lg">★</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">{tier1.capterra.total_reviews} reviews</div>
              </a>
            )}

            {/* TrustRadius */}
            {tier1.trustradius && (
              <a href={tier1.trustradius.url} target="_blank" rel="noopener noreferrer" className="p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">TrustRadius</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900">{tier1.trustradius.tr_score.toFixed(1)}</span>
                    <span className="text-sm text-gray-600 font-medium">/10</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">{tier1.trustradius.total_reviews} reviews</div>
              </a>
            )}
          </div>

          {/* LinkedIn Posts */}
          {tier1.linkedin && tier1.linkedin.company_posts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">LinkedIn Activity</h3>
              <div className="space-y-4">
                {tier1.linkedin.company_posts.slice(0, 3).map((post, i) => (
                  <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-base text-gray-700">{post.content_snippet}</div>
                    <div className="flex items-center gap-4 mt-3 text-xs font-medium text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{post.post_type.replace('_', ' ')}</span>
                      <span>{post.engagement.likes} likes</span>
                      <span>{post.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Press Releases */}
          {tier1.press_releases.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Press & News</h3>
              <div className="space-y-4">
                {tier1.press_releases.slice(0, 5).map((press, i) => (
                  <a key={i} href={press.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-gray-900">{press.title}</div>
                    <div className="text-sm text-gray-700 mt-2">{press.snippet}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium text-gray-600">
                      <span>{press.source}</span>
                      <span>{press.date}</span>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">{press.category}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Community Tab */}
      {activeDetailTab === 'community' && (
        <div className="space-y-8">
          {/* Aggregate Sentiment */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-700">Overall Community Sentiment</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-3 bg-gray-300 rounded-full overflow-hidden">
                  <div className={`h-full ${getSentimentColor(tier2.aggregate_sentiment.score)}`} style={{ width: `${tier2.aggregate_sentiment.score}%` }} />
                </div>
                <span className="font-bold text-lg text-gray-900">{tier2.aggregate_sentiment.score}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-3 font-medium">
              Based on {tier2.aggregate_sentiment.total_mentions} mentions • Most active on {tier2.aggregate_sentiment.most_active_platform}
            </div>
          </div>

          {/* Reddit */}
          {tier2.reddit && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reddit Discussions</h3>
              <div className="space-y-4">
                {tier2.reddit.top_threads.slice(0, 4).map((thread, i) => (
                  <a key={i} href={thread.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{thread.title}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-gray-600">
                          <span className="text-orange-600">{thread.subreddit}</span>
                          <span>{thread.score} pts</span>
                          <span>{thread.num_comments} comments</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        thread.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        thread.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {thread.sentiment}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hacker News */}
          {tier2.hacker_news && tier2.hacker_news.top_stories.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hacker News</h3>
              <div className="text-sm font-medium text-gray-600 mb-4">
                {tier2.hacker_news.total_stories} stories • {tier2.hacker_news.total_comments} comments
              </div>
              <div className="space-y-4">
                {tier2.hacker_news.top_stories.slice(0, 3).map((story, i) => (
                  <a key={i} href={story.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-gray-900">{story.title}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium text-gray-600">
                      <span className="text-orange-600">{story.points} points</span>
                      <span>{story.num_comments} comments</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Twitter */}
          {tier2.twitter && tier2.twitter.notable_tweets.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Twitter/X Mentions</h3>
              <div className="space-y-4">
                {tier2.twitter.notable_tweets.slice(0, 3).map((tweet, i) => (
                  <a key={i} href={tweet.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-base text-gray-700">{tweet.content}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium text-gray-600">
                      <span className="text-blue-600">@{tweet.author_handle}</span>
                      <span>{tweet.likes} likes</span>
                      <span>{tweet.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Product Hunt */}
          {tier2.product_hunt?.latest_launch && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Product Hunt</h3>
              <a href={tier2.product_hunt.latest_launch.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border border-orange-300 shadow-sm hover:shadow-md transition-shadow">
                <div className="font-bold text-gray-900">{tier2.product_hunt.latest_launch.name}</div>
                <div className="text-sm text-gray-700 mt-2">{tier2.product_hunt.latest_launch.tagline}</div>
                <div className="flex items-center gap-3 mt-3 text-sm font-medium">
                  <span className="text-orange-600">▲ {tier2.product_hunt.latest_launch.upvotes}</span>
                  <span className="text-gray-600">{tier2.product_hunt.latest_launch.date}</span>
                </div>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Product Signals Tab */}
      {activeDetailTab === 'product' && (
        <div className="space-y-8">
          {/* Changelog */}
          {tier3.changelog && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Release Activity</h3>
                <div className="text-sm font-medium text-gray-600">
                  {tier3.changelog.velocity.releases_last_30_days} releases (30d) •
                  Trend: <span className={tier3.changelog.velocity.trend === 'accelerating' ? 'text-green-600 font-bold' : tier3.changelog.velocity.trend === 'slowing' ? 'text-red-600 font-bold' : 'text-gray-600'}>
                    {tier3.changelog.velocity.trend}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {tier3.changelog.releases.slice(0, 5).map((release, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{release.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          release.type === 'major' ? 'bg-blue-100 text-blue-700' :
                          release.type === 'minor' ? 'bg-green-100 text-green-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {release.type}
                        </span>
                        <span className="text-xs font-medium text-gray-600">{release.date}</span>
                      </div>
                    </div>
                    {release.highlights.length > 0 && (
                      <ul className="mt-3 text-sm text-gray-700">
                        {release.highlights.slice(0, 2).map((h, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub */}
          {tier3.github && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">GitHub Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-900">{tier3.github.metrics?.stars.toLocaleString()}</div>
                  <div className="text-xs font-medium text-gray-600 mt-1">Stars</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-900">{tier3.github.metrics?.forks.toLocaleString()}</div>
                  <div className="text-xs font-medium text-gray-600 mt-1">Forks</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-900">{tier3.github.metrics?.open_issues}</div>
                  <div className="text-xs font-medium text-gray-600 mt-1">Open Issues</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm text-center">
                  <div className={`text-base font-bold ${
                    tier3.github.metrics?.activity_level === 'very_active' ? 'text-green-600' :
                    tier3.github.metrics?.activity_level === 'active' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {tier3.github.metrics?.activity_level.replace('_', ' ')}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">Activity</div>
                </div>
              </div>

              {tier3.github.feature_requests.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Top Feature Requests</h4>
                  <div className="space-y-2">
                    {tier3.github.feature_requests.slice(0, 3).map((fr, i) => (
                      <a key={i} href={fr.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                        <div className="text-sm text-slate-700">{fr.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>👍 {fr.reactions}</span>
                          <span>💬 {fr.comments}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job Signals */}
          {tier3.job_signals.total_open_roles > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Hiring Signals</h3>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">{tier3.job_signals.total_open_roles}</div>
                <div className="text-sm text-slate-500 mb-4">Open roles</div>

                {tier3.job_signals.product_signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Product Focus Areas (from hiring)</h4>
                    <div className="flex flex-wrap gap-2">
                      {tier3.job_signals.product_signals.slice(0, 5).map((signal, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {signal.inferred_focus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tier3.job_signals.team_signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Team Signals</h4>
                    <ul className="space-y-1">
                      {tier3.job_signals.team_signals.slice(0, 3).map((signal, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="text-green-500">→</span>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public Roadmap */}
          {tier3.public_roadmap && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Public Roadmap</h3>
              <a href={tier3.public_roadmap.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                <div className="text-sm text-slate-500 mb-3">Platform: {tier3.public_roadmap.platform}</div>
                {tier3.public_roadmap.most_voted.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Most Voted</h4>
                    <ul className="space-y-2">
                      {tier3.public_roadmap.most_voted.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{item.title}</span>
                          <span className="text-slate-500">{item.votes} votes</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </a>
            </div>
          )}

          {/* Status Page */}
          {tier3.status_page && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Status & Reliability</h3>
              <a href={tier3.status_page.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    tier3.status_page.current_status === 'operational' ? 'bg-green-500' :
                    tier3.status_page.current_status === 'degraded' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium text-slate-800 capitalize">{tier3.status_page.current_status}</span>
                  {tier3.status_page.uptime_90d && (
                    <span className="text-sm text-slate-500 ml-auto">{tier3.status_page.uptime_90d}% uptime (90d)</span>
                  )}
                </div>
                {tier3.status_page.recent_incidents.length > 0 && (
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="text-slate-500">Last incident:</span> {tier3.status_page.recent_incidents[0].title}
                  </div>
                )}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
