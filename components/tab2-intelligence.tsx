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
    if (score >= 70) return 'var(--vaaya-brand)';
    if (score >= 50) return '#EAB308';
    return '#EF4444';
  };

  const getSentimentLabel = (label: string) => {
    const labels: Record<string, { text: string; color: string; bg: string }> = {
      very_positive: { text: 'Very Positive', color: 'var(--vaaya-brand)', bg: 'rgba(7, 59, 57, 0.1)' },
      positive: { text: 'Positive', color: 'var(--vaaya-brand-light)', bg: 'rgba(7, 59, 57, 0.05)' },
      mixed: { text: 'Mixed', color: '#CA8A04', bg: 'rgba(234, 179, 8, 0.1)' },
      negative: { text: 'Negative', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)' },
      very_negative: { text: 'Very Negative', color: '#B91C1C', bg: 'rgba(185, 28, 28, 0.1)' },
    };
    return labels[label] || { text: 'Unknown', color: 'var(--vaaya-text-muted)', bg: 'var(--vaaya-neutral)' };
  };

  return (
    <div className="space-y-12">
      {/* EXECUTIVE BRIEF */}
      <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--vaaya-neutral)', border: '1px solid var(--vaaya-border)' }}>
        <h2 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--vaaya-text)' }}>Executive Brief</h2>

        {/* What's New Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>What's New</h3>
            <span className="text-xs ml-auto" style={{ color: 'var(--vaaya-text-muted)' }}>{executive_brief.whats_new.time_period}</span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>{executive_brief.whats_new.summary}</p>

          {executive_brief.whats_new.releases.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {executive_brief.whats_new.releases.slice(0, 4).map((release, i) => (
                <div key={i} className="flex-shrink-0 w-40 p-3 bento-box rounded-lg">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--vaaya-text)' }}>{release.title}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                    release.type === 'major_feature' ? 'bg-blue-100 text-blue-700' :
                    release.type === 'integration' ? 'bg-purple-100 text-purple-700' :
                    'text-gray-600'
                  }`} style={release.type !== 'major_feature' && release.type !== 'integration' ? { backgroundColor: 'var(--vaaya-border)', color: 'var(--vaaya-text-muted)' } : {}}>
                    {release.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>{release.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Reaction Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>Market Reaction</h3>
            <div className="ml-auto flex items-center gap-3">
              <span
                className="px-3 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: getSentimentLabel(executive_brief.market_reaction.sentiment.label).bg,
                  color: getSentimentLabel(executive_brief.market_reaction.sentiment.label).color,
                }}
              >
                {getSentimentLabel(executive_brief.market_reaction.sentiment.label).text}
              </span>
              <span className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{executive_brief.market_reaction.sentiment.score}</span>
            </div>
          </div>
          <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--vaaya-text-muted)' }}>{executive_brief.market_reaction.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Themes */}
            <div className="bento-box rounded-lg p-6 shadow-sm" style={{ borderColor: 'var(--vaaya-brand)' }}>
              <h4 className="text-base font-bold mb-3" style={{ color: 'var(--vaaya-brand)' }}>What People Love</h4>
              <ul className="space-y-2">
                {executive_brief.market_reaction.positive_themes.slice(0, 4).map((theme, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                    <span className="mt-0.5 font-bold" style={{ color: 'var(--vaaya-brand)' }}>+</span>
                    <span>{theme.theme}</span>
                  </li>
                ))}
                {executive_brief.market_reaction.positive_themes.length === 0 && (
                  <li className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>No data available</li>
                )}
              </ul>
            </div>

            {/* Negative Themes */}
            <div className="bento-box rounded-lg p-6 shadow-sm" style={{ borderColor: '#EF4444' }}>
              <h4 className="text-base font-bold text-red-700 mb-3">Concerns Raised</h4>
              <ul className="space-y-2">
                {executive_brief.market_reaction.negative_themes.slice(0, 4).map((theme, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                    <span className="text-red-600 mt-0.5 font-bold">-</span>
                    <span>{theme.theme}</span>
                  </li>
                ))}
                {executive_brief.market_reaction.negative_themes.length === 0 && (
                  <li className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>No data available</li>
                )}
              </ul>
            </div>
          </div>

          {/* Notable Reactions */}
          {executive_brief.market_reaction.notable_reactions.length > 0 && (
            <div className="mt-6 p-6 bento-box rounded-lg shadow-sm">
              <div className="text-base italic" style={{ color: 'var(--vaaya-text)' }}>
                "{executive_brief.market_reaction.notable_reactions[0].quote}"
              </div>
              <div className="text-sm mt-3 font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
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
            <h3 className="text-xl font-semibold" style={{ color: 'var(--vaaya-text)' }}>Product Direction</h3>
          </div>
          <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--vaaya-text-muted)' }}>{executive_brief.product_direction.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confirmed Roadmap */}
            {executive_brief.product_direction.confirmed_roadmap.length > 0 && (
              <div className="bento-box rounded-lg p-6 shadow-sm">
                <h4 className="text-base font-bold mb-3" style={{ color: 'var(--vaaya-text)' }}>Confirmed Roadmap</h4>
                <ul className="space-y-2">
                  {executive_brief.product_direction.confirmed_roadmap.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
                      <span>{item.feature}</span>
                      {item.expected_timeline && (
                        <span className="text-xs font-medium ml-2" style={{ color: 'var(--vaaya-brand)' }}>({item.expected_timeline})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Requested Features */}
            {executive_brief.product_direction.top_requested_features.length > 0 && (
              <div className="bento-box rounded-lg p-6 shadow-sm">
                <h4 className="text-base font-bold mb-3" style={{ color: 'var(--vaaya-text)' }}>Top Requested</h4>
                <ul className="space-y-2">
                  {executive_brief.product_direction.top_requested_features.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                      <span>{item.feature}</span>
                      {item.vote_count && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' }}>
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
                  ''
                }`} style={signal.confidence !== 'high' && signal.confidence !== 'medium' ? { backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' } : {}}>
                  {signal.signal}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL TABS */}
      <div className="mb-8" style={{ borderBottom: '1px solid var(--vaaya-border)' }}>
        <nav className="flex gap-6">
          {[
            { id: 'official', label: 'Official Sources' },
            { id: 'community', label: 'Community & Social' },
            { id: 'product', label: 'Product Signals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id as DetailTab)}
              className="px-4 py-3 text-base font-semibold transition-colors"
              style={{
                borderBottom: activeDetailTab === tab.id ? '2px solid var(--vaaya-brand)' : '2px solid transparent',
                color: activeDetailTab === tab.id ? 'var(--vaaya-brand)' : 'var(--vaaya-text-muted)',
              }}
            >
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
              <a href={tier1.g2.url} target="_blank" rel="noopener noreferrer" className="p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>G2</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier1.g2.overall_rating.toFixed(1)}</span>
                    <span className="text-yellow-500 text-lg">★</span>
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>{tier1.g2.total_reviews} reviews</div>
                {tier1.g2.categories[0]?.badge && (
                  <div className="mt-3 text-xs px-2 py-1 rounded font-medium inline-block" style={{ backgroundColor: 'rgba(7, 59, 57, 0.1)', color: 'var(--vaaya-brand)' }}>
                    {tier1.g2.categories[0].badge}
                  </div>
                )}
              </a>
            )}

            {/* Capterra */}
            {tier1.capterra && (
              <a href={tier1.capterra.url} target="_blank" rel="noopener noreferrer" className="p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>Capterra</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier1.capterra.overall_rating.toFixed(1)}</span>
                    <span className="text-yellow-500 text-lg">★</span>
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>{tier1.capterra.total_reviews} reviews</div>
              </a>
            )}

            {/* TrustRadius */}
            {tier1.trustradius && (
              <a href={tier1.trustradius.url} target="_blank" rel="noopener noreferrer" className="p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>TrustRadius</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier1.trustradius.tr_score.toFixed(1)}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>/10</span>
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>{tier1.trustradius.total_reviews} reviews</div>
              </a>
            )}
          </div>

          {/* LinkedIn Posts */}
          {tier1.linkedin && tier1.linkedin.company_posts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>LinkedIn Activity</h3>
              <div className="space-y-4">
                {tier1.linkedin.company_posts.slice(0, 3).map((post, i) => (
                  <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-base" style={{ color: 'var(--vaaya-text-muted)' }}>{post.content_snippet}</div>
                    <div className="flex items-center gap-4 mt-3 text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                      <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(7, 59, 57, 0.1)', color: 'var(--vaaya-brand)' }}>{post.post_type.replace('_', ' ')}</span>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>Press & News</h3>
              <div className="space-y-4">
                {tier1.press_releases.slice(0, 5).map((press, i) => (
                  <a key={i} href={press.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{press.title}</div>
                    <div className="text-sm mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>{press.snippet}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                      <span>{press.source}</span>
                      <span>{press.date}</span>
                      <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' }}>{press.category}</span>
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
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--vaaya-neutral)', border: '1px solid var(--vaaya-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>Overall Community Sentiment</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--vaaya-border)' }}>
                  <div className="h-full" style={{ width: `${tier2.aggregate_sentiment.score}%`, backgroundColor: getSentimentColor(tier2.aggregate_sentiment.score) }} />
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--vaaya-text)' }}>{tier2.aggregate_sentiment.score}</span>
              </div>
            </div>
            <div className="text-sm mt-3 font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
              Based on {tier2.aggregate_sentiment.total_mentions} mentions • Most active on {tier2.aggregate_sentiment.most_active_platform}
            </div>
          </div>

          {/* Reddit */}
          {tier2.reddit && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>Reddit Discussions</h3>
              <div className="space-y-4">
                {tier2.reddit.top_threads.slice(0, 4).map((thread, i) => (
                  <a key={i} href={thread.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{thread.title}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                          <span className="text-orange-600">{thread.subreddit}</span>
                          <span>{thread.score} pts</span>
                          <span>{thread.num_comments} comments</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        thread.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        thread.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                        ''
                      }`} style={thread.sentiment !== 'positive' && thread.sentiment !== 'negative' ? { backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' } : {}}>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>Hacker News</h3>
              <div className="text-sm font-medium mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>
                {tier2.hacker_news.total_stories} stories • {tier2.hacker_news.total_comments} comments
              </div>
              <div className="space-y-4">
                {tier2.hacker_news.top_stories.slice(0, 3).map((story, i) => (
                  <a key={i} href={story.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{story.title}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>Twitter/X Mentions</h3>
              <div className="space-y-4">
                {tier2.twitter.notable_tweets.slice(0, 3).map((tweet, i) => (
                  <a key={i} href={tweet.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-base" style={{ color: 'var(--vaaya-text-muted)' }}>{tweet.content}</div>
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                      <span style={{ color: 'var(--vaaya-brand)' }}>@{tweet.author_handle}</span>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>Product Hunt</h3>
              <a href={tier2.product_hunt.latest_launch.url} target="_blank" rel="noopener noreferrer" className="block p-6 bento-box rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: '#F97316' }}>
                <div className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier2.product_hunt.latest_launch.name}</div>
                <div className="text-sm mt-2" style={{ color: 'var(--vaaya-text-muted)' }}>{tier2.product_hunt.latest_launch.tagline}</div>
                <div className="flex items-center gap-3 mt-3 text-sm font-medium">
                  <span className="text-orange-600">▲ {tier2.product_hunt.latest_launch.upvotes}</span>
                  <span style={{ color: 'var(--vaaya-text-muted)' }}>{tier2.product_hunt.latest_launch.date}</span>
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
                <h3 className="text-xl font-bold" style={{ color: 'var(--vaaya-text)' }}>Release Activity</h3>
                <div className="text-sm font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
                  {tier3.changelog.velocity.releases_last_30_days} releases (30d) •
                  Trend: <span className={tier3.changelog.velocity.trend === 'accelerating' ? 'text-green-600 font-bold' : tier3.changelog.velocity.trend === 'slowing' ? 'text-red-600 font-bold' : ''} style={tier3.changelog.velocity.trend !== 'accelerating' && tier3.changelog.velocity.trend !== 'slowing' ? { color: 'var(--vaaya-text-muted)' } : {}}>
                    {tier3.changelog.velocity.trend}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {tier3.changelog.releases.slice(0, 5).map((release, i) => (
                  <div key={i} className="p-4 bento-box rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: 'var(--vaaya-text)' }}>{release.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          release.type === 'major' ? 'bg-blue-100 text-blue-700' :
                          release.type === 'minor' ? 'bg-green-100 text-green-700' :
                          ''
                        }`} style={release.type !== 'major' && release.type !== 'minor' ? { backgroundColor: 'var(--vaaya-neutral)', color: 'var(--vaaya-text-muted)' } : {}}>
                          {release.type}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>{release.date}</span>
                      </div>
                    </div>
                    {release.highlights.length > 0 && (
                      <ul className="mt-3 text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
                        {release.highlights.slice(0, 2).map((h, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span style={{ color: 'var(--vaaya-border)' }}>•</span>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--vaaya-text)' }}>GitHub Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bento-box rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier3.github.metrics?.stars.toLocaleString()}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>Stars</div>
                </div>
                <div className="p-4 bento-box rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier3.github.metrics?.forks.toLocaleString()}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>Forks</div>
                </div>
                <div className="p-4 bento-box rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier3.github.metrics?.open_issues}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>Open Issues</div>
                </div>
                <div className="p-4 bento-box rounded-lg shadow-sm text-center">
                  <div className={`text-base font-bold ${
                    tier3.github.metrics?.activity_level === 'very_active' ? 'text-green-600' :
                    tier3.github.metrics?.activity_level === 'active' ? '' : ''
                  }`} style={tier3.github.metrics?.activity_level !== 'very_active' ? { color: 'var(--vaaya-brand)' } : {}}>
                    {tier3.github.metrics?.activity_level.replace('_', ' ')}
                  </div>
                  <div className="text-xs font-medium mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>Activity</div>
                </div>
              </div>

              {tier3.github.feature_requests.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>Top Feature Requests</h4>
                  <div className="space-y-2">
                    {tier3.github.feature_requests.slice(0, 3).map((fr, i) => (
                      <a key={i} href={fr.url} target="_blank" rel="noopener noreferrer" className="block p-3 bento-box rounded-lg hover:shadow-sm transition-shadow">
                        <div className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>{fr.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
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
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--vaaya-text)' }}>Hiring Signals</h3>
              <div className="p-4 bento-box rounded-lg">
                <div className="text-2xl font-bold" style={{ color: 'var(--vaaya-text)' }}>{tier3.job_signals.total_open_roles}</div>
                <div className="text-sm mb-4" style={{ color: 'var(--vaaya-text-muted)' }}>Open roles</div>

                {tier3.job_signals.product_signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>Product Focus Areas (from hiring)</h4>
                    <div className="flex flex-wrap gap-2">
                      {tier3.job_signals.product_signals.slice(0, 5).map((signal, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(7, 59, 57, 0.1)', color: 'var(--vaaya-brand)' }}>
                          {signal.inferred_focus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tier3.job_signals.team_signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>Team Signals</h4>
                    <ul className="space-y-1">
                      {tier3.job_signals.team_signals.slice(0, 3).map((signal, i) => (
                        <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--vaaya-text-muted)' }}>
                          <span style={{ color: 'var(--vaaya-brand)' }}>→</span>
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
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--vaaya-text)' }}>Public Roadmap</h3>
              <a href={tier3.public_roadmap.url} target="_blank" rel="noopener noreferrer" className="block p-4 bento-box rounded-lg hover:shadow-sm transition-shadow">
                <div className="text-sm mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>Platform: {tier3.public_roadmap.platform}</div>
                {tier3.public_roadmap.most_voted.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>Most Voted</h4>
                    <ul className="space-y-2">
                      {tier3.public_roadmap.most_voted.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--vaaya-text-muted)' }}>{item.title}</span>
                          <span style={{ color: 'var(--vaaya-text-muted)' }}>{item.votes} votes</span>
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
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--vaaya-text)' }}>Status & Reliability</h3>
              <a href={tier3.status_page.url} target="_blank" rel="noopener noreferrer" className="block p-4 bento-box rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    tier3.status_page.current_status === 'operational' ? 'bg-green-500' :
                    tier3.status_page.current_status === 'degraded' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize" style={{ color: 'var(--vaaya-text)' }}>{tier3.status_page.current_status}</span>
                  {tier3.status_page.uptime_90d && (
                    <span className="text-sm ml-auto" style={{ color: 'var(--vaaya-text-muted)' }}>{tier3.status_page.uptime_90d}% uptime (90d)</span>
                  )}
                </div>
                {tier3.status_page.recent_incidents.length > 0 && (
                  <div className="mt-3 text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
                    <span style={{ color: 'var(--vaaya-text-muted)' }}>Last incident:</span> {tier3.status_page.recent_incidents[0].title}
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
