import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface TopbarProps {
  title?: string;
  className?: string;
}

export function Topbar({ title = 'Dashboard', className }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-5 border-b border-border bg-surface',
        className,
      )}
    >
      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2">
        <span className="text-fg-subtle font-mono text-xs">/</span>
        <h1 className="font-serif text-fg text-lg">{title}</h1>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] bg-surface-2 border border-border hover:bg-border transition-colors text-sm font-ui text-fg cursor-pointer"
        aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
        <span className="text-fg-muted text-xs">
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </span>
      </button>
    </header>
  );
}