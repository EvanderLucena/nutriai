// Page: Visão geral (home) — portfolio snapshot for today
function HomeView({ setView, setActivePatientId, showAISummary, patients }) {
  const activePats = React.useMemo(() => (patients || PATIENTS).filter(p => p.active !== false), [patients]);
  const [newPatientOpen, setNewPatientOpen] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const pages = Math.max(1, Math.ceil(activePats.length / PAGE_SIZE));
  const patientSlice = activePats.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <>
      <Topbar crumbs={["Workspace", "Visão geral"]}/>
      <div className="page">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:20, flexWrap:'wrap'}}>
          <div>
            <div className="eyebrow">Quarta-feira · 17 abril 2026</div>
            <h1 className="serif" style={{fontSize:34, margin:'4px 0 0', letterSpacing:'-0.02em', fontWeight:400, whiteSpace:'nowrap'}}>
              Bom dia, Helena.
            </h1>
          </div>
          <div style={{display:'flex', gap:8, flexShrink:0, alignItems:'center'}}>
            <div className="chip"><span className="d" style={{background:'var(--sage)'}}/>{AGGREGATE.onTrack} on-track</div>
            <div className="chip warning"><span className="d"/>{AGGREGATE.warning} atenção</div>
            <div className="chip danger"><span className="d"/>{AGGREGATE.danger} crítico</div>
            <button className="btn btn-primary" onClick={()=>setNewPatientOpen(true)} style={{marginLeft:8}}><IconPlus size={13}/> Novo paciente</button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:18}}>
          <KPI label="Pacientes ativos" value="48" sub="+2 esta semana" />
          <KPI label="Refeições extraídas hoje" value="127" sub="via WhatsApp" />
          <KPI label="Média kcal · hoje" value="1.840" sub="vs. meta 2.200 kcal" />
          <KPI label="Sem registro há >3 dias" value="5" sub="contato recomendado" />
        </div>

        {/* Activity — only extracted data, no conversation content */}
        <div className="card">
          <div className="card-h">
            <div className="title">Refeições reportadas · hoje</div>
            <div className="sub">EXTRAÍDO VIA WHATSAPP</div>
            <div className="spacer"/>
            <div className="chip ai"><span className="d"/>AO VIVO</div>
          </div>
          <div className="card-b tight">
            {[
              { time:"14:28", who:"Ana Beatriz L.",  whoId:"p1", status:"ontrack", text:"Almoço",          tag:"620 kcal · P45 C62 G20"},
              { time:"13:50", who:"Carla Mendonça",  whoId:"p3", status:"ontrack", text:"Almoço",          tag:"540 kcal · P38 C55 G18"},
              { time:"12:05", who:"Diogo Campos",    whoId:"p6", status:"warning", text:"Almoço",          tag:"1.100 kcal · P32 C88 G55"},
              { time:"10:40", who:"Isabela Nunes",   whoId:"p7", status:"ontrack", text:"Lanche manhã",    tag:"210 kcal · P8 C28 G8"},
              { time:"09:14", who:"Rafael Tonioli",  whoId:"p4", status:"ontrack", text:"Café da manhã",   tag:"380 kcal · P26 C28 G16"},
              { time:"08:02", who:"Ana Beatriz L.",  whoId:"p1", status:"ontrack", text:"Café da manhã",   tag:"410 kcal · P28 C32 G18"}
            ].map((ev, i) => (
              <div key={i} style={{
                display:'grid',
                gridTemplateColumns:'60px 14px 1fr auto',
                alignItems:'center',
                gap:12,
                padding:'12px 18px',
                borderBottom:'1px solid var(--border)',
                cursor:'pointer'
              }} onClick={() => { setActivePatientId(ev.whoId); setView("patient"); }}>
                <div className="mono tnum" style={{fontSize:11, color:'var(--fg-subtle)'}}>{ev.time}</div>
                <div style={{
                  width:8, height:8, borderRadius:'50%',
                  background: ev.status==="ontrack"?"var(--sage)":ev.status==="warning"?"var(--amber)":"var(--coral)"
                }}/>
                <div>
                  <div style={{fontSize:13.5, marginBottom:2}}>
                    <span style={{fontWeight:600}}>{ev.who}</span>
                    <span style={{color:'var(--fg-muted)'}}> — {ev.text}</span>
                  </div>
                  <div className="mono tnum" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase'}}>
                    {ev.tag}
                  </div>
                </div>
                <IconChevronR size={14} style={{color:'var(--fg-subtle)'}}/>
              </div>
            ))}
          </div>
        </div>

        {/* Patient grid — reuse PatientsView logic inline */}
        <div className="divider"><span>Sua carteira · {activePats.length} pacientes</span></div>
        <PatientGrid compact patients={patientSlice} onOpen={id => { setActivePatientId(id); setView("patient"); }}/>
        {pages > 1 && <Pagination page={page} pages={pages} total={activePats.length} pageSize={PAGE_SIZE} onChange={setPage}/>}
      </div>
      {newPatientOpen && <NewPatientModal onClose={()=>setNewPatientOpen(false)}/>}
    </>
  );
}

function KPI({ label, value, sub, trend, danger }) {
  return (
    <div className="card" style={{padding:'16px 18px'}}>
      <div className="eyebrow" style={{marginBottom:8}}>{label}</div>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12}}>
        <div className="mono tnum" style={{fontSize:34, fontWeight:500, letterSpacing:'-0.02em', color: danger ? 'var(--coral)' : 'var(--fg)'}}>{value}</div>
        {trend && <Sparkline values={trend} width={80} height={30} stroke="var(--sage-dim)" fill="rgba(127,183,126,0.12)" showDots={false}/>}
      </div>
      <div style={{fontSize:11.5, color:'var(--fg-muted)', marginTop:6}}>{sub}</div>
    </div>
  );
}

Object.assign(window, { HomeView, KPI });
