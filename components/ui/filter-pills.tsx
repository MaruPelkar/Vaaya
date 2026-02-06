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
    <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--gray-100)' }}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
            style={{
              backgroundColor: isActive ? 'var(--white)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--gray-600)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
