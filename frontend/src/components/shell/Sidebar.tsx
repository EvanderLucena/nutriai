import { useState } from 'react';
import { cn } from '../../lib/utils';

type StatusFilter = 'all' | 'ontrack' | 'warning' | 'danger';

interface Patient {
  id: string;
  name: string;
  status: StatusFilter;
}

const PLACEHOLDER_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Ana Silva', status: 'ontrack' },
  { id: 'p2', name: 'Carlos Mendes', status: 'warning' },
  { id: 'p3', name: 'Mariana Costa', status: 'danger' },
  { id: 'p4', name: 'João Pereira', status: 'ontrack' },
  { id: 'p5', name: 'Fernanda Lima', status: 'ontrack' },
];

const STATUS_CONFIG: Record<StatusFilter, { label: string; chipClass: string }> = {
  all: { label: 'Todos', chipClass: 'bg-surface-2 text-fg' },
  ontrack: { label: 'No prazo', chipClass: 'bg-sage/15 text-sage' },
  warning: { label: 'Atenção', chipClass: 'bg-amber/15 text-amber' },
  danger: { label: 'Crítico', chipClass: 'bg-coral/15 text-coral' },
};

interface SidebarProps {
  className?: string;
  onSelectPatient?: (id: string) => void;
}

export function Sidebar({ className, onSelectPatient }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = PLACEHOLDER_PATIENTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <aside
      className={cn(
        'flex flex-col w-72 bg-surface border-r border-border h-full',
        className,
      )}
    >
      {/* Search */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm font-ui text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-border flex-wrap">
        {(Object.keys(STATUS_CONFIG) as StatusFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-mono font-medium transition-colors cursor-pointer',
              STATUS_CONFIG[key].chipClass,
              filter === key ? 'ring-1 ring-lime' : '',
            )}
          >
            {STATUS_CONFIG[key].label}
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onSelectPatient?.(patient.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors text-left cursor-pointer"
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                patient.status === 'ontrack' && 'bg-sage',
                patient.status === 'warning' && 'bg-amber',
                patient.status === 'danger' && 'bg-coral',
              )}
            />
            <span className="text-sm text-fg truncate">{patient.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}