import { useState, useEffect } from 'react';
import { useNavigationStore } from '../../stores/navigationStore';
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
  const crumbs = VIEW_LABELS[activeView] || ['Dashboard'];
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="topbar">
      <button className="sidebar-toggle" onClick={toggleSidebar} title="Alternar painel lateral">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
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
          {dateStr} · {timeStr}
        </div>
      </div>
    </header>
  );
}
