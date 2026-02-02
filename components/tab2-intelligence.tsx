'use client';

import { Tab2Data } from '@/lib/types';

interface Tab2IntelligenceProps {
  data: Tab2Data;
}

export function Tab2Intelligence({ data }: Tab2IntelligenceProps) {
  const getSentimentColor = (score: number) => {
    if (score > 0.6) return '#22c55e'; // green
    if (score > 0.4) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
        <p className="text-gray-600">{data.summary || 'No summary available'}</p>
      </div>

      {/* Sentiment Score */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Sentiment Score:</span>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${(data.sentiment_score || 0.5) * 100}%`,
              backgroundColor: getSentimentColor(data.sentiment_score || 0.5),
            }}
          />
        </div>
        <span className="font-semibold">{Math.round((data.sentiment_score || 0.5) * 100)}%</span>
      </div>

      {/* Features & Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-3">What People Love</h3>
          <ul className="space-y-2">
            {data.loved_features?.length > 0 ? (
              data.loved_features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-500">+</span>
                  {feature}
                </li>
              ))
            ) : (
              <li className="text-gray-400">No data available</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">Common Complaints</h3>
          <ul className="space-y-2">
            {data.common_complaints?.length > 0 ? (
              data.common_complaints.map((complaint, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-500">-</span>
                  {complaint}
                </li>
              ))
            ) : (
              <li className="text-gray-400">No data available</li>
            )}
          </ul>
        </div>
      </div>

      {/* Recent Releases */}
      {data.recent_releases?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Releases</h3>
          <div className="space-y-2">
            {data.recent_releases.map((release, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-900">{release.title}</span>
                {release.date && <span className="text-sm text-gray-500">{release.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Press Mentions */}
      {data.press_mentions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Press Mentions</h3>
          <div className="space-y-3">
            {data.press_mentions.slice(0, 5).map((press, i) => (
              <a
                key={i}
                href={press.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{press.title}</div>
                <div className="text-sm text-gray-500 mt-1">{press.source} {press.date && `• ${press.date}`}</div>
                <div className="text-sm text-gray-600 mt-2">{press.snippet}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Raw Mentions */}
      {data.raw_mentions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Mentions ({data.raw_mentions.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.raw_mentions.slice(0, 20).map((mention, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    mention.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {mention.source}
                  </span>
                  {mention.date && <span className="text-xs text-gray-400">{mention.date}</span>}
                </div>
                <p className="text-sm text-gray-700">{mention.text.slice(0, 200)}{mention.text.length > 200 ? '...' : ''}</p>
                <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                  View source
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
