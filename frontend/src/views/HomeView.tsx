import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Rail } from '../components/shell/Rail';
import { Sidebar } from '../components/shell/Sidebar';
import { Topbar } from '../components/shell/Topbar';
import type { HealthResponse } from '../types';

// Simple SVG icons as inline components
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconPlan() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconInsights() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

const RAIL_ITEMS = [
  { id: 'home', label: 'Início', icon: <IconHome /> },
  { id: 'patients', label: 'Pacientes', icon: <IconUsers /> },
  { id: 'plan', label: 'Plano', icon: <IconPlan /> },
  { id: 'insights', label: 'Insights', icon: <IconInsights /> },
];

export function HomeView() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    apiClient
      .get<HealthResponse>('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError('Backend não disponível'));
  }, []);

  return (
    <div className="flex h-screen bg-bg">
      {/* Rail */}
      <Rail
        items={RAIL_ITEMS}
        activeId={activeNav}
        onSelect={setActiveNav}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Dashboard" />

        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="font-serif text-4xl tracking-tight text-fg mb-6">
            Dashboard
          </h1>

          {/* Health endpoint card */}
          <Card title="Status da API" className="mb-6">
            {error && <p className="text-coral">{error}</p>}
            {health ? (
              <div className="mono tnum space-y-2">
                <div className="flex gap-4">
                  <span className="text-fg-subtle w-20">Status:</span>
                  <span className="text-sage font-semibold">{health.status}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-fg-subtle w-20">Versão:</span>
                  <span className="text-fg">{health.version}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-fg-subtle w-20">Banco:</span>
                  <span className="text-fg">{health.db}</span>
                </div>
              </div>
            ) : (
              !error && (
                <p className="text-fg-muted mono">Carregando...</p>
              )
            )}
          </Card>

          {/* Component showcase cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buttons showcase */}
            <Card title="Botões">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primário</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="ai">IA ✨</Button>
                <Button variant="danger">Perigo</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg">Grande</Button>
                <Button disabled>Desativado</Button>
              </div>
            </Card>

            {/* Input showcase */}
            <Card title="Campos de Entrada">
              <div className="space-y-3">
                <Input label="NOME" placeholder="Digite o nome..." />
                <Input label="E-MAIL" type="email" placeholder="exemplo@email.com" />
                <Input label="COM ERRO" error="Campo obrigatório" placeholder="..." />
              </div>
            </Card>

            {/* Theme card */}
            <Card title="Tema">
              <p className="text-fg-muted text-sm mb-3">
                Tema atual: <span className="text-fg font-mono">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
              </p>
              <Button variant="secondary" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Mudar para Claro' : '🌙 Mudar para Escuro'}
              </Button>
            </Card>

            {/* Modal card */}
            <Card title="Modal">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Abrir Modal
              </Button>
              <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Exemplo de Modal"
              >
                <p className="text-fg-muted mb-4">
                  Este é um modal de exemplo. Pressione Escape ou clique fora para fechar.
                </p>
                <Input label="CAMPO NO MODAL" placeholder="Digite algo..." />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Confirmar
                  </Button>
                </div>
              </Modal>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}