function OnboardingView({ setView }) {
  const [step, setStep] = React.useState(1);
  const totalSteps = 4;

  const stepLabels = ['Conheça sua carteira', 'Configure seu plano', 'Convide seus pacientes', 'Pronto'];

  const StepDots = () => (
    <div className="onboard-dots">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className={"onboard-dot " + (step > i ? "done" : step === i + 1 ? "active" : "")}>
            {step > i + 1 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 4 12 14.01l-3-3"/></svg>
            ) : i + 1}
          </div>
          {i < totalSteps - 1 && <div className={"onboard-line " + (step > i + 1 ? "done" : "")} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="onboard-page">
      <div className="onboard-header">
        <div className="auth-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13Z" stroke="#D4FF4F" strokeWidth="1.6" />
            <circle cx="12" cy="14" r="1.4" fill="#D4FF4F"/>
          </svg>
          <span className="auth-brand-name">Nutri<span>AI</span></span>
        </div>
        <button className="btn btn-ghost onboard-skip" onClick={() => setView('home')}>Pular por enquanto</button>
      </div>

      <div className="onboard-body">
        <StepDots />
        <div className="onboard-step-label">{stepLabels[step - 1]}</div>

        {step === 1 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2>Conheça sua carteira</h2>
            <p>Cadastre seus pacientes pra IA começar a acompanhar. Você pode adicionar um a um ou importar via CSV.</p>
            <div className="onboard-options">
              <div className="onboard-option">
                <div className="onboard-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/></svg>
                </div>
                <div>
                  <strong>Adicionar manualmente</strong>
                  <span>Nome, WhatsApp e objetivo de cada paciente</span>
                </div>
              </div>
              <div className="onboard-option">
                <div className="onboard-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <strong>Importar CSV</strong>
                  <span>Planilha com nome, WhatsApp e objeivo</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Adicionar pacientes →</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </div>
            <h2>Configure seu primeiro plano</h2>
            <p>Monte um plano alimentar simples. A IA vai usar esse plano como referência pra orientar o paciente no WhatsApp.</p>
            <div className="onboard-plan-preview">
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Café da manhã</span>
                <span className="onboard-plan-items">3 itens</span>
                <span className="onboard-plan-kcal">420 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Lanche da manhã</span>
                <span className="onboard-plan-items">1 item</span>
                <span className="onboard-plan-kcal">150 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Almoço</span>
                <span className="onboard-plan-items">4 itens</span>
                <span className="onboard-plan-kcal">680 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Lanche da tarde</span>
                <span className="onboard-plan-items">1 item</span>
                <span className="onboard-plan-kcal">130 kcal</span>
              </div>
              <div className="onboard-plan-row">
                <span className="onboard-plan-meal">Jantar</span>
                <span className="onboard-plan-items">3 itens</span>
                <span className="onboard-plan-kcal">550 kcal</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Configurar plano →</button>
          </div>
        )}

        {step === 3 && (
          <div className="onboard-card">
            <div className="onboard-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
            </div>
            <h2>Convide seus pacientes</h2>
            <p>Mande o link personalizado pra cada paciente. Quando eles mandarem a primeira mensagem no WhatsApp, a IA se apresenta e começa o acompanhamento.</p>
            <div className="onboard-invite-example">
              <div className="onboard-invite-link">
                <span className="onboard-invite-prefix">wa.me/</span>
                <span className="onboard-invite-number">5511999999999</span>
                <span className="onboard-invite-text">?text=Olá, sou paciente da Dra. Helena</span>
              </div>
              <button className="btn btn-secondary" style={{marginTop: 12}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar link
              </button>
            </div>
            <div className="onboard-privacy-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              <span>Seus pacientes saberão que as conversas são privadas. Só os dados de alimentação são compartilhados com você.</span>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Enviar convites →</button>
          </div>
        )}

        {step === 4 && (
          <div className="onboard-card onboard-card-success">
            <div className="onboard-card-icon onboard-card-icon-success">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
            </div>
            <h2>Pronto! 🎉</h2>
            <p>A IA já está conversando com seus pacientes. Você acompanha tudo pelo painel — dados estruturados, adesão, tendências.</p>
            <div className="onboard-success-checklist">
              <div className="onboard-check-item done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 4 12 14.01l-3-3"/></svg>
                <span>Pacientes cadastrados</span>
              </div>
              <div className="onboard-check-item done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 4 12 14.01l-3-3"/></svg>
                <span>Plano alimentar configurado</span>
              </div>
              <div className="onboard-check-item done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 4 12 14.01l-3-3"/></svg>
                <span>Convites enviados</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setView('home')}>Ir pro painel →</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingView });