'use client';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: isActive ? 'var(--vaaya-brand)' : 'transparent',
              color: isActive ? 'var(--vaaya-white)' : 'var(--vaaya-text-muted)',
              border: isActive ? 'none' : '1px solid var(--vaaya-border)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
