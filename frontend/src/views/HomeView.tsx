import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { HealthResponse } from '../types';

export function HomeView() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<HealthResponse>('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError('Backend não disponível'));
  }, []);

  return (
    <div className="min-h-screen bg-bg font-ui">
      <div className="p-8">
        <h1 className="font-serif text-4xl tracking-tight text-fg">Dashboard</h1>
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <h2 className="eyebrow mb-4">Status da API</h2>
          {error && <p className="text-coral">{error}</p>}
          {health && (
            <div className="mono tnum space-y-1">
              <p>
                <span className="text-fg-subtle">Status:</span>{' '}
                <span className="text-sage">{health.status}</span>
              </p>
              <p>
                <span className="text-fg-subtle">Versão:</span> {health.version}
              </p>
              <p>
                <span className="text-fg-subtle">Banco:</span> {health.db}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}