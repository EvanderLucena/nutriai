import { useNavigationStore } from '../../stores/navigationStore';
import { useThemeStore } from '../../stores/themeStore';
import { IconCalendar } from '../../components/icons';

const VIEW_LABELS: Record<string, string[]> = {
  home: ['Dashboard'],
  patients: ['Pacientes'],
  patient: ['Pacientes', 'Paciente'],
  foods: ['Alimentos'],
  insights: ['Inteligência'],
};

export function Topbar() {
  const { activeView, toggleSidebar } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();
  const crumbs = VIEW_LABELS[activeView] || ['Dashboard'];

  return (
    <header className="topbar">
      <button className="sidebar-toggle" onClick={toggleSidebar} title="Alternar painel lateral">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'now' : ''}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-right">
        <div className="date-chip tnum">
          <IconCalendar size={12} />
          qua 17 abr · 14:32
        </div>
        <button className="btn btn-ghost" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
    </header>
  );
}