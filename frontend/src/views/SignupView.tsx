import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const SPECIALTIES = [
  { value: '', label: 'Selecione (opcional)' },
  { value: 'clinica', label: 'Nutrição Clínica' },
  { value: 'esportiva', label: 'Nutrição Esportiva' },
  { value: 'funcional', label: 'Nutrição Funcional' },
  { value: 'materno', label: 'Nutrição Materno-Infantil' },
  { value: 'gerontologia', label: 'Nutrição em Gerontologia' },
  { value: 'pediatria', label: 'Nutrição Pediátrica' },
  { value: 'saude-coletiva', label: 'Saúde Coletiva' },
];

export function SignupView() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', crn: '', crnRegional: '',
    specialty: '', whatsapp: '', terms: false,
  });
  const [localError, setLocalError] = useState('');
  const signup = useAuthStore((s) => s.signup);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        setLocalError('Preencha todos os campos obrigatórios.');
        return;
      }
      setLocalError('');
      setStep(2);
    } else {
      if (!form.crn || !form.crnRegional || !form.terms) {
        setLocalError('Preencha o CRN, regional e aceite os termos.');
        return;
      }
      setLocalError('');
      try {
        await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          crn: form.crn,
          crnRegional: form.crnRegional,
          specialty: form.specialty || undefined,
          whatsapp: form.whatsapp || undefined,
          terms: form.terms,
        });
        // After successful signup, redirect based on onboardingCompleted
        if (user && !user.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'Erro ao criar conta. Tente novamente.';
        setLocalError(message);
      }
    }
  };

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
          <h1 className="auth-left-title">Crie sua conta<br />em 2 minutos.</h1>
          <p className="auth-left-sub">30 dias grátis com todas as funcionalidades. Cadastre o cartão, cancele quando quiser.</p>
          <div className="auth-left-steps">
            <div className="auth-step-indicator">
              <div className={'auth-step-dot ' + (step >= 1 ? 'active' : '')}>1</div>
              <div className="auth-step-line" />
              <div className={'auth-step-dot ' + (step >= 2 ? 'active' : '')}>2</div>
            </div>
            <div className="auth-step-labels">
              <span>Dados pessoais</span>
              <span>Perfil profissional</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          {localError && <div className="auth-error">{localError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {step === 1 && (
              <>
                <div className="auth-form-header">
                  <h2>Crie sua conta</h2>
                  <p>Dados pessoais e acesso</p>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Nome completo *</label>
                  <input className="auth-input" placeholder="Dra. Helena Viana" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">E-mail *</label>
                  <input type="email" className="auth-input" placeholder="helena@consultorio.com" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Senha *</label>
                  <input type="password" className="auth-input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
                </div>
                <button type="submit" className="btn btn-primary auth-submit">Continuar</button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="auth-form-header">
                  <h2>Perfil profissional</h2>
                  <p>Informações do seu CRN e contato</p>
                </div>
                <div className="auth-row-auto">
                  <div className="auth-field" style={{ flex: 1 }}>
                    <label className="auth-label">CRN *</label>
                    <input className="auth-input" placeholder="24781" value={form.crn} onChange={(e) => set('crn', e.target.value)} />
                  </div>
                  <div className="auth-field" style={{ width: 140 }}>
                    <label className="auth-label">Regional *</label>
                    <select className="auth-input auth-select" value={form.crnRegional} onChange={(e) => set('crnRegional', e.target.value)}>
                      <option value="">UF</option>
                      {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Especialidade</label>
                  <select className="auth-input auth-select" value={form.specialty} onChange={(e) => set('specialty', e.target.value)}>
                    {SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="auth-field">
                  <label className="auth-label">WhatsApp (seu número) *</label>
                  <input className="auth-input" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
                  <span className="auth-hint">Seu número de contato — NÃO é o número da IA.</span>
                </div>
                <label className="auth-checkbox auth-terms">
                  <input type="checkbox" checked={form.terms as boolean} onChange={(e) => set('terms', e.target.checked)} />
                  <span>Li e aceito os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a> (LGPD).</span>
                </label>
                <div className="auth-row-between">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="auth-switch">
            Já tem conta? <Link to="/login" className="auth-link-btn">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}