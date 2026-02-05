'use client';

import { useState } from 'react';
import { TimelineEvent, TimelineEventType } from '@/lib/types';
import { FilterPills } from '../ui/filter-pills';

interface TimelineTapeProps {
  events: TimelineEvent[];
  initialFilter?: TimelineEventType | 'all';
}

const EVENT_TYPE_CONFIG: Record<TimelineEventType, { label: string; color: string; bgColor: string }> = {
  product: { label: 'Product', color: '#059669', bgColor: 'rgba(16, 185, 129, 0.1)' },
  pricing: { label: 'Pricing', color: '#D97706', bgColor: 'rgba(245, 158, 11, 0.1)' },
  gtm: { label: 'GTM', color: '#4F46E5', bgColor: 'rgba(99, 102, 241, 0.1)' },
  security: { label: 'Security', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
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
    <div className="bento-box rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--vaaya-text-muted)' }}>
          Timeline
        </h3>
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
                className="flex items-start gap-3 py-2 px-3 rounded-lg"
                style={{ backgroundColor: 'var(--vaaya-neutral)' }}
              >
                {/* Event Type Badge */}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
                  style={{ backgroundColor: config.bgColor, color: config.color }}
                >
                  {config.label}
                </span>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--vaaya-text)' }}>
                    {event.title}
                  </div>
                  {event.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--vaaya-text-muted)' }}>
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Date and Source */}
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ color: 'var(--vaaya-text-muted)' }}>
                    {formatDate(event.date)}
                  </div>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline"
                      style={{ color: 'var(--vaaya-brand)' }}
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
        <div className="text-center py-8">
          <span className="text-sm" style={{ color: 'var(--vaaya-text-muted)' }}>
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
