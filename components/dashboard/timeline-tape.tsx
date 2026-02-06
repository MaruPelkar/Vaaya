'use client';

import { useState } from 'react';
import { TimelineEvent, TimelineEventType } from '@/lib/types';
import { FilterPills } from '../ui/filter-pills';

interface TimelineTapeProps {
  events: TimelineEvent[];
  initialFilter?: TimelineEventType | 'all';
}

const EVENT_TYPE_CONFIG: Record<TimelineEventType, { label: string; color: string; bgColor: string }> = {
  product: { label: 'Product', color: 'var(--success)', bgColor: 'var(--success-bg)' },
  pricing: { label: 'Pricing', color: 'var(--warning)', bgColor: 'var(--warning-bg)' },
  gtm: { label: 'GTM', color: 'var(--info)', bgColor: 'var(--info-bg)' },
  security: { label: 'Security', color: 'var(--error)', bgColor: 'var(--error-bg)' },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'gtm', label: 'GTM' },
  { value: 'security', label: 'Security' },
];

export function TimelineTape({ events, initialFilter = 'all' }: TimelineTapeProps) {
  const [filter, setFilter] = useState<TimelineEventType | 'all'>(initialFilter);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((event) => event.type === filter);

  // Sort by date descending
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h3 className="metric-label">Timeline</h3>
        </div>
        <FilterPills
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => setFilter(value as TimelineEventType | 'all')}
        />
      </div>

      {sortedEvents.length > 0 ? (
        <div className="space-y-3">
          {sortedEvents.slice(0, 10).map((event) => {
            const config = EVENT_TYPE_CONFIG[event.type];
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 py-3 px-4 rounded-lg transition-all"
                style={{ backgroundColor: 'var(--gray-100)' }}
              >
                {/* Event Type Badge */}
                <span
                  className="badge shrink-0"
                  style={{ backgroundColor: config.bgColor, color: config.color }}
                >
                  {config.label}
                </span>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
                    {event.title}
                  </div>
                  {event.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Date and Source */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium" style={{ color: 'var(--gray-500)' }}>
                    {formatDate(event.date)}
                  </div>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      Source
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
            No timeline events available
          </span>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
