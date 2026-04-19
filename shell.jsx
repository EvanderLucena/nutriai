// Shell: icon rail + secondary sidebar + topbar
const { useState, useEffect, useMemo, useRef } = React;

function Rail({ view, setView }) {
  const items = [
    { id: "home", label: "Visão geral", Icon: IconHome },
    { id: "patients", label: "Pacientes", Icon: IconUsers },
    { id: "foods", label: "Alimentos", Icon: IconMeal },
    { id: "insights", label: "Inteligência", Icon: IconInsight }
  ];
  return (
    <aside className="rail">
      <div className="rail-logo" title="NutriAI">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13Z" stroke="#D4FF4F" strokeWidth="1.6" />
          <circle cx="12" cy="14" r="1.4" fill="#D4FF4F"/>
        </svg>
      </div>
      {items.map(it => (
        <button key={it.id}
          className={"rail-btn " + (view === it.id ? "active" : "")}
          onClick={() => setView(it.id)}
          title={it.label}>
          <it.Icon size={18} />
        </button>
      ))}
      <div className="rail-spacer"/>
      <button className="rail-btn" title="Ajustes"><IconSettings size={18}/></button>
      <div className="rail-avatar" title="Dra. Helena Viana">HV</div>
    </aside>
  );
}

function Sidebar({ view, setView, patients, activePatientId, setActivePatientId, statusFilter, setStatusFilter }) {
  const [q, setQ] = useState("");
  const activePats = useMemo(() => patients.filter(p => p.active !== false), [patients]);

  const filtered = useMemo(() => {
    let list = activePats;
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [activePats, q, statusFilter]);

  const counts = useMemo(() => ({
    ontrack: activePats.filter(p=>p.status==="ontrack").length,
    warning: activePats.filter(p=>p.status==="warning").length,
    danger:  activePats.filter(p=>p.status==="danger").length,
  }), [activePats]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-name">Nutri<span style={{color:'var(--lime-dim)'}}>AI</span></div>
          <div className="brand-tag mono">v2.4</div>
        </div>
        <div style={{fontSize:11.5, color:'var(--fg-muted)', marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>Dra. Helena Viana · CRN-3 24781</div>
      </div>

      <div className="search">
        <IconSearch size={14}/>
        <input placeholder="Buscar paciente, plano, alimento…" value={q} onChange={e=>setQ(e.target.value)} />
        <span className="kbd">⌘K</span>
      </div>

      <div className="nav-section-label">Workspace</div>
      <div className="nav-list">
        <button className={"nav-item " + (view==="home"?"active":"")} onClick={()=>setView("home")}>
          <IconHome size={15}/> <span>Visão geral</span> <span className="count mono">HOJE</span>
        </button>
        <button className={"nav-item " + (view==="patients"?"active":"")} onClick={()=>setView("patients")}>
          <IconUsers size={15}/> <span>Pacientes</span> <span className="count mono">{patients.length}</span>
        </button>
        <button className={"nav-item " + (view==="foods"?"active":"")} onClick={()=>setView("foods")}>
          <IconMeal size={15}/> <span>Alimentos</span> <span className="count mono">64</span>
        </button>
        <button className={"nav-item " + (view==="insights"?"active":"")} onClick={()=>setView("insights")}>
          <IconInsight size={15}/> <span>Inteligência</span>
        </button>
      </div>

      <div className="nav-section-label" style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingRight:18}}>
        <span>Pacientes ativos</span>
        <div style={{display:'flex', gap:4}}>
          {[
            {k:"all", label:"Todos"},
            {k:"ontrack", dot:"var(--sage)"},
            {k:"warning", dot:"var(--amber)"},
            {k:"danger",  dot:"var(--coral)"}
          ].map(f => (
            <button key={f.k}
              onClick={()=>setStatusFilter(f.k)}
              title={f.k}
              style={{
                padding: f.k==="all"?"2px 6px":"4px",
                borderRadius: 4,
                border: "1px solid " + (statusFilter===f.k ? "var(--fg)" : "var(--border)"),
                background: statusFilter===f.k ? "var(--surface-2)" : "transparent",
                fontSize: 9, fontFamily:"var(--font-mono)", letterSpacing:"0.04em",
                textTransform:"uppercase", color:"var(--fg-muted)",
                display:"flex", alignItems:"center", justifyContent:"center",
                minWidth: f.k==="all"?0:18, minHeight:18
              }}>
              {f.k === "all" ? "TODOS" : <span style={{width:6,height:6,borderRadius:999,background:f.dot,display:"block"}}/>}
            </button>
          ))}
        </div>
      </div>
      <div className="patient-quick">
        {filtered.map(p => (
          <div key={p.id}
            className={"pq-item " + (p.id === activePatientId && view === "patient" ? "active" : "")}
            onClick={() => { setActivePatientId(p.id); setView("patient"); }}>
            <span className={"pq-status " + p.status}/>
            <div style={{minWidth:0, overflow:'hidden'}}>
              <div className="pq-name" style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
              <div className="pq-meta" style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.objective.toUpperCase()}</div>
            </div>
            <div className="pq-meta tnum" style={{flexShrink:0}}>{p.adherence}%</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{padding:'16px', fontSize:12, color:'var(--fg-subtle)'}}>Nenhum paciente neste filtro.</div>
        )}
      </div>
    </aside>
  );
}

function Topbar({ crumbs, right }) {
  return (
    <header className="topbar">
      <button className="sidebar-toggle" onClick={() => window._sidebarToggle?.()} title="Alternar painel lateral">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h12M2 8h12M2 12h12"/>
        </svg>
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-right">
        <div className="date-chip tnum"><IconCalendar size={12} style={{marginRight:4, verticalAlign:'-2px'}}/>qua 17 abr · 14:32</div>
        {right}
      </div>
    </header>
  );
}

Object.assign(window, { Rail, Sidebar, Topbar });
