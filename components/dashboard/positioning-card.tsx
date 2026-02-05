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
    <div className="bento-box rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: 'var(--vaaya-text-muted)' }}>
        Positioning + ICP
      </h3>

      {/* One-liner */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--vaaya-text)' }}>
        {one_liner || 'Company description not available'}
      </p>

      {/* Category Tags */}
      {category_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {category_tags.slice(0, 4).map((tag, i) => (
            <Chip key={i} variant="category">{tag}</Chip>
          ))}
        </div>
      )}

      {/* Primary Personas */}
      {primary_personas.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Key Personas
          </div>
          <div className="flex flex-wrap gap-1.5">
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
        <div className="mt-auto">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--vaaya-text-muted)' }}>
            Jobs To Be Done
          </div>
          <ul className="space-y-1">
            {top_jobs.slice(0, 3).map((job, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--vaaya-text)' }}>
                <span style={{ color: 'var(--vaaya-brand)' }}>•</span>
                <span>{job}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
