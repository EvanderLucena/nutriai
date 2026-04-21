import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Preencha todos os campos.');
      return;
    }
    setLocalError('');
    try {
      await login(email, password);
      // login updates authStore, App.tsx AuthGuard handles redirect
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Credenciais inválidas. Tente novamente.';
      setLocalError(message);
    }
  };

  const displayError = localError;

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13Z" style={{ stroke: 'var(--lime)' }} strokeWidth="1.6" />
              <circle cx="12" cy="14" r="1.4" style={{ fill: 'var(--lime)' }} />
            </svg>
            <span className="auth-brand-name">Nutri<span>AI</span></span>
          </div>
          <h1 className="auth-left-title">Seus pacientes reportam.<br />A IA extrai.<br /><em>Você decide.</em></h1>
          <p className="auth-left-sub">Acompanhamento nutricional inteligente via WhatsApp. Zero fricção pro paciente, dados estruturados pra você.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Entrar</h2>
            <p>Acesse sua conta NutriAI</p>
          </div>

          {displayError && <div className="auth-error">{displayError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">E-mail</label>
              <input
                type="email"
                className="auth-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Senha</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="auth-row">
              <a href="#" className="auth-link" title="Recuperação de senha será implementada em breve">Esqueci minha senha</a>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={!email || !password || isLoading} style={{ opacity: (!email || !password || isLoading) ? 0.45 : 1 }}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button className="btn btn-secondary auth-oauth">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" /></svg>
            Continuar com Google
          </button>

          <p className="auth-switch">
            Não tem conta? <Link to="/signup" className="auth-link-btn">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}