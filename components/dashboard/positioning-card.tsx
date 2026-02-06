'use client';

import { PersonaChip } from '@/lib/types';
import { Chip } from '../ui/chip';

interface PositioningCardProps {
  one_liner: string;
  category_tags: string[];
  primary_personas: PersonaChip[];
  top_jobs: string[];
}

export function PositioningCard({
  one_liner,
  category_tags,
  primary_personas,
  top_jobs,
}: PositioningCardProps) {
  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="metric-label">Positioning + ICP</h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      </div>

      {/* One-liner */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--gray-800)' }}>
        {one_liner || 'Company description not available'}
      </p>

      {/* Category Tags */}
      {category_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {category_tags.slice(0, 4).map((tag, i) => (
            <Chip key={i} variant="category">{tag}</Chip>
          ))}
        </div>
      )}

      {/* Primary Personas */}
      {primary_personas.length > 0 && (
        <div className="mb-4">
          <div className="metric-label mb-2">Key Personas</div>
          <div className="flex flex-wrap gap-2">
            {primary_personas.slice(0, 4).map((persona, i) => (
              <Chip key={i} variant={persona.type === 'buyer' ? 'persona' : 'icp'}>
                {persona.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Top Jobs */}
      {top_jobs.length > 0 && (
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--gray-200)' }}>
          <div className="metric-label mb-2">Jobs To Be Done</div>
          <ul className="space-y-2">
            {top_jobs.slice(0, 3).map((job, i) => (
              <li key={i} className="text-sm flex items-start gap-3" style={{ color: 'var(--gray-700)' }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--white)' }}
                >
                  {i + 1}
                </span>
                <span>{job}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
