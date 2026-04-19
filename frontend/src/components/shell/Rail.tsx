import { cn } from '../../lib/utils';

interface RailItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface RailProps {
  items: RailItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function Rail({ items, activeId, onSelect, className }: RailProps) {
  return (
    <nav className={cn('flex flex-col items-center w-14 bg-surface border-r border-border py-4 gap-1', className)}>
      {/* Logo/brand mark */}
      <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center mb-4">
        <span className="font-serif text-ink text-sm font-bold">N</span>
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-[var(--radius)] transition-colors duration-150 cursor-pointer',
            item.id === activeId
              ? 'bg-lime/15 text-lime'
              : 'text-fg-subtle hover:bg-surface-2 hover:text-fg',
          )}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}