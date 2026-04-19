// Pacientes view — table + grid switchable, with filters
function PatientsView({ setView, setActivePatientId, patients, setPatients }) {
  const [mode, setMode] = React.useState("table");
  const [newPatientOpen, setNewPatientOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [statusF, setStatusF] = React.useState("all");
  const [objectiveF, setObjectiveF] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState(null);

  const activePats   = React.useMemo(() => patients.filter(p => p.active !== false), [patients]);
  const inactivePats = React.useMemo(() => patients.filter(p => p.active === false),  [patients]);
  const objectives   = [...new Set(activePats.map(p => p.objective))];

  const filtered = React.useMemo(() => {
    const base = showInactive ? inactivePats : activePats;
    return base.filter(p => {
      if (!showInactive) {
        if (statusF !== "all" && p.status !== statusF) return false;
        if (objectiveF !== "all" && p.objective !== objectiveF) return false;
      }
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [activePats, inactivePats, showInactive, statusF, objectiveF, q]);

  const activeFilters = !showInactive
    ? [statusF !== "all", objectiveF !== "all"].filter(Boolean).length
    : 0;

  const clearFilters = () => { setStatusF("all"); setObjectiveF("all"); setQ(""); };

  const toggleActive = (id) => {
    setPatients(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const saveEdit = (id, updated) => {
    setPatients(ps => ps.map(p => p.id !== id ? p : { ...p, ...updated }));
    setEditingPatient(null);
  };

  return (
    <>
      <Topbar crumbs={["Workspace", "Pacientes"]}/>
      <div className="page">
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: filterOpen && !showInactive ? 12 : 20, flexWrap:'wrap', gap:12}}>
          <div>
            <div className="eyebrow">{showInactive ? "Inativos · arquivo clínico" : "Carteira clínica"}</div>
            <h1 className="serif" style={{fontSize:34, margin:'4px 0 0', fontWeight:400, letterSpacing:'-0.02em'}}>
              {filtered.length} {showInactive ? "pacientes inativos" : "pacientes ativos"}
            </h1>
          </div>
          <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
            {!showInactive && (
              <>
                <MiniStat label="Adesão média" value="82%"/>
                <MiniStat label="On-track" value={String(activePats.filter(p=>p.status==="ontrack").length)} dot="var(--sage)"/>
                <MiniStat label="Atenção"   value={String(activePats.filter(p=>p.status==="warning").length)} dot="var(--amber)"/>
                <MiniStat label="Crítico"   value={String(activePats.filter(p=>p.status==="danger").length)}  dot="var(--coral)"/>
                <div style={{width:1, height:32, background:'var(--border)'}}/>
              </>
            )}
            <div className="search" style={{margin:0, width:200}}>
              <IconSearch size={13}/>
              <input placeholder="Buscar por nome…" value={q} onChange={e=>setQ(e.target.value)}/>
            </div>
            {!showInactive && (
              <div className="seg" style={{height:30}}>
                <button className={mode==="table"?"active":""} onClick={()=>setMode("table")}>Lista</button>
                <button className={mode==="grid"?"active":""} onClick={()=>setMode("grid")}>Cartões</button>
              </div>
            )}
            {!showInactive && (
              <button
                className={"btn " + (filterOpen || activeFilters > 0 ? "btn-secondary" : "btn-ghost")}
                onClick={()=>setFilterOpen(v=>!v)}
                style={{position:'relative'}}>
                <IconFilter size={13}/> Filtrar
                {activeFilters > 0 && (
                  <span style={{
                    position:'absolute', top:-5, right:-5,
                    width:16, height:16, borderRadius:'50%',
                    background:'var(--fg)', color:'var(--bg)',
                    fontSize:9, fontFamily:'var(--font-mono)',
                    display:'grid', placeItems:'center'
                  }}>{activeFilters}</span>
                )}
              </button>
            )}
            <button
              className={"btn " + (showInactive ? "btn-secondary" : "btn-ghost")}
              onClick={() => { setShowInactive(v => !v); setQ(""); }}
              style={{color: showInactive ? 'var(--fg)' : inactivePats.length > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)'}}>
              <IconArchive size={13}/>
              {showInactive ? " Ver ativos" : inactivePats.length > 0 ? ` ${inactivePats.length} inativos` : " Inativos"}
            </button>
            {!showInactive && (
              <button className="btn btn-primary" onClick={()=>setNewPatientOpen(true)}>
                <IconPlus size={13}/> Novo paciente
              </button>
            )}
          </div>
        </div>

        {!showInactive && filterOpen && (
          <div style={{
            display:'flex', gap:20, alignItems:'flex-end', flexWrap:'wrap',
            padding:'16px 18px', marginBottom:20,
            background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8
          }}>
            <FilterGroup label="Status">
              {[
                {k:"all",     label:"Todos"},
                {k:"ontrack", label:"On-track", color:"var(--sage)"},
                {k:"warning", label:"Atenção",  color:"var(--amber)"},
                {k:"danger",  label:"Crítico",  color:"var(--coral)"}
              ].map(f => (
                <button key={f.k}
                  onClick={()=>setStatusF(f.k)}
                  style={{
                    padding:'5px 10px', borderRadius:5, fontSize:12,
                    border: statusF===f.k ? '1px solid var(--fg)' : '1px solid var(--border)',
                    background: statusF===f.k ? 'var(--surface-2)' : 'transparent',
                    display:'flex', alignItems:'center', gap:5, color:'var(--fg)'
                  }}>
                  {f.color && <span style={{width:6,height:6,borderRadius:'50%',background:f.color}}/>}
                  {f.label}
                </button>
              ))}
            </FilterGroup>

            <FilterGroup label="Objetivo">
              <select value={objectiveF} onChange={e=>setObjectiveF(e.target.value)} style={{
                padding:'6px 10px', borderRadius:5, fontSize:12,
                border:'1px solid var(--border)', background:'var(--surface)',
                color:'var(--fg)', fontFamily:'var(--font-ui)'
              }}>
                <option value="all">Todos</option>
                {objectives.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </FilterGroup>

{activeFilters > 0 && (
              <button onClick={clearFilters} style={{fontSize:12, color:'var(--fg-muted)', padding:'5px 0', marginLeft:'auto'}}>
                <IconX size={11} style={{verticalAlign:'-2px', marginRight:4}}/> Limpar filtros
              </button>
            )}
          </div>
        )}

        {showInactive && filtered.length === 0 && (
          <div style={{padding:'60px 0', textAlign:'center', fontSize:13, color:'var(--fg-subtle)'}}>
            Nenhum paciente inativo no momento.
          </div>
        )}

        {(!showInactive || filtered.length > 0) && (
          <PaginatedPatients
            patients={filtered}
            mode={showInactive ? "table" : mode}
            onOpen={id => { if (!showInactive) { setActivePatientId(id); setView("patient"); } }}
            onEdit={p => setEditingPatient(p)}
            onToggleActive={toggleActive}
            showInactive={showInactive}
          />
        )}
      </div>

      {newPatientOpen && <NewPatientModal onClose={()=>setNewPatientOpen(false)}/>}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={(updated) => saveEdit(editingPatient.id, updated)}
        />
      )}
    </>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div className="eyebrow">{label}</div>
      <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>{children}</div>
    </div>
  );
}

const PAGE_SIZE = 10;

function PaginatedPatients({ patients, mode, onOpen, onEdit, onToggleActive, showInactive }) {
  const [page, setPage] = React.useState(0);
  React.useEffect(() => setPage(0), [patients]);
  const total = patients.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = patients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      {mode === "table"
        ? <PatientTable patients={slice} onOpen={onOpen} onEdit={onEdit} onToggleActive={onToggleActive} showInactive={showInactive}/>
        : <PatientGrid  patients={slice} onOpen={onOpen} onEdit={onEdit} onToggleActive={onToggleActive}/>
      }
      {pages > 1 && (
        <Pagination page={page} pages={pages} total={total} pageSize={PAGE_SIZE} onChange={setPage}/>
      )}
    </>
  );
}

function Pagination({ page, pages, total, pageSize, onChange }) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const nums = Array.from({length: pages}, (_, i) => i);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, padding:'12px 4px'}}>
      <div className="mono" style={{fontSize:11.5, color:'var(--fg-muted)'}}>
        {from}–{to} de {total}
      </div>
      <div style={{display:'flex', gap:4}}>
        <button
          onClick={()=>onChange(page-1)} disabled={page===0}
          className="btn btn-ghost"
          style={{padding:'5px 10px', opacity: page===0 ? 0.3 : 1}}>
          ←
        </button>
        {nums.map(n => (
          <button key={n} onClick={()=>onChange(n)}
            style={{
              padding:'5px 10px', borderRadius:5, fontSize:12.5,
              border: n===page ? '1px solid var(--fg)' : '1px solid var(--border)',
              background: n===page ? 'var(--ink)' : 'var(--surface)',
              color: n===page ? 'var(--paper)' : 'var(--fg)',
              fontFamily:'var(--font-mono)', minWidth:32
            }}>{n+1}</button>
        ))}
        <button
          onClick={()=>onChange(page+1)} disabled={page===pages-1}
          className="btn btn-ghost"
          style={{padding:'5px 10px', opacity: page===pages-1 ? 0.3 : 1}}>
          →
        </button>
      </div>
    </div>
  );
}

function PatientMenuBtn({ patient, onEdit, onToggleActive }) {
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 });
  const btnRef = React.useRef(null);
  const isActive = patient.active !== false;

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('[data-patient-menu-portal]')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const menuItem = (label, Icon, danger, onClick) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); setOpen(false); }}
      style={{
        width:'100%', padding:'8px 14px', textAlign:'left',
        display:'flex', alignItems:'center', gap:8, fontSize:12.5,
        color: danger ? 'var(--coral)' : 'var(--fg)',
        background:'transparent', transition:'background 0.1s'
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <Icon size={12}/> {label}
    </button>
  );

  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Mais ações"
        style={{
          color: open ? 'var(--fg)' : 'var(--fg-subtle)',
          padding:4, display:'flex', alignItems:'center', justifyContent:'center',
          borderRadius:4, background: open ? 'var(--surface-2)' : 'transparent',
          transition:'background 0.1s, color 0.1s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--surface-2)'; e.currentTarget.style.color='var(--fg)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--fg-subtle)'; } }}>
        <IconDots size={14}/>
      </button>
      {open && ReactDOM.createPortal(
        <div
          data-patient-menu-portal
          style={{
            position:'fixed',
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 1000,
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,0.14)',
            minWidth:140, overflow:'hidden'
          }}>
          {isActive && menuItem("Editar", IconEdit, false, () => onEdit(patient))}
          {menuItem(
            isActive ? "Inativar" : "Reativar",
            isActive ? IconArchive : IconCheck,
            isActive,
            () => onToggleActive(patient.id)
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function NewPatientModal({ onClose }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.45)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(560px, 100%)', maxHeight:'90vh', overflow:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Novo paciente</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>

        <div style={{padding:'18px 20px 20px', display:'flex', flexDirection:'column', gap:14}}>
          <PatField label="Nome completo" placeholder="ex: Ana Beatriz Lima"/>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <PatField label="Data de nascimento" type="date"/>
            <PatField label="Sexo" kind="select" options={["Feminino","Masculino","Outro"]}/>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <PatField label="Altura (cm)" placeholder="165" mono/>
            <PatField label="Objetivo" kind="select" options={["Emagrecimento","Hipertrofia","Manutenção","Recomposição corporal","Saúde geral"]}/>
          </div>

          <div className="divider"><span>Contato</span></div>

          <PatField label="WhatsApp" placeholder="+55 11 9 0000-0000" mono/>
          <div style={{padding:'10px 12px', background:'var(--surface-2)', borderRadius:6, fontSize:12, color:'var(--fg-muted)', lineHeight:1.55}}>
            <span className="mono" style={{fontSize:10, color:'var(--lime-dim)', marginRight:6}}>IA</span>
            O paciente vai receber a IA por este número. Certifique que está correto antes de salvar.
          </div>

          <PatField label="Observações iniciais · opcional" kind="textarea" placeholder="ex: histórico de diabetes, alergia a lactose"/>
        </div>

        <div style={{padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onClose}><IconCheck size={13}/> Cadastrar paciente</button>
        </div>
      </div>
    </div>
  );
}

function PatField({ label, placeholder, type, kind, options, mono }) {
  const style = {
    padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6,
    fontSize:13, background:'var(--surface)', outline:'none', width:'100%',
    color:'var(--fg)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)'
  };
  return (
    <div style={{display:'flex', flexDirection:'column', gap:5}}>
      <div className="eyebrow">{label}</div>
      {kind === "select" ? (
        <select style={style} defaultValue="">
          <option value="" disabled>Selecione…</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : kind === "textarea" ? (
        <textarea placeholder={placeholder} rows={2} style={{...style, resize:'vertical', fontFamily:'var(--font-ui)'}}/>
      ) : (
        <input type={type||"text"} placeholder={placeholder} style={style}/>
      )}
    </div>
  );
}

function MiniStat({ label, value, dot }) {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
      <div className="eyebrow">{label}</div>
      <div style={{display:'flex', alignItems:'center', gap:6, marginTop:2}}>
        {dot && <span style={{width:6,height:6,borderRadius:'50%', background:dot}}/>}
        <div className="mono tnum" style={{fontSize:18, fontWeight:500}}>{value}</div>
      </div>
    </div>
  );
}

function PatientTable({ patients, onOpen, onEdit, onToggleActive, showInactive }) {
  return (
    <div className="card">
      <div style={{display:'grid', gridTemplateColumns:'2.4fr 1.4fr 1fr 1.6fr 1fr 1fr 32px', padding:'12px 18px', borderBottom:'1px solid var(--border)', gap:14}}>
        {["Paciente","Objetivo","Semanas","Adesão 7d","Peso","Δ peso",""].map((h,i)=>(
          <div key={i} className="eyebrow" style={{fontSize:10}}>{h}</div>
        ))}
      </div>
      {patients.length === 0 && (
        <div style={{padding:'40px', textAlign:'center', fontSize:13, color:'var(--fg-subtle)'}}>Nenhum paciente neste filtro.</div>
      )}
      {patients.map(p => {
        const isActive = p.active !== false;
        return (
          <div key={p.id}
            onClick={() => { if (isActive) { onOpen(p.id); } }}
            style={{
              display:'grid',
              gridTemplateColumns:'2.4fr 1.4fr 1fr 1.6fr 1fr 1fr 32px',
              padding:'14px 18px',
              borderBottom:'1px solid var(--border)',
              gap:14,
              alignItems:'center',
              cursor: isActive ? 'pointer' : 'default',
              opacity: isActive ? 1 : 0.5,
              transition:'background 0.1s'
            }}
            onMouseEnter={e=>{ if (isActive) e.currentTarget.style.background='var(--surface-2)'; }}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <Avatar p={p}/>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{fontSize:13.5, fontWeight:500}}>{p.name}</div>
                  {!isActive && (
                    <span style={{
                      fontSize:9, fontFamily:'var(--font-mono)', letterSpacing:'0.06em',
                      padding:'1px 5px', borderRadius:3,
                      background:'var(--surface-2)', color:'var(--fg-subtle)',
                      border:'1px solid var(--border)'
                    }}>INATIVO</span>
                  )}
                </div>
                <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>{p.age}A · {p.id.toUpperCase()}</div>
              </div>
            </div>
            <div style={{fontSize:12.5, color:'var(--fg-muted)'}}>{p.objective}</div>
            <div className="mono tnum" style={{fontSize:12}}>{p.tag}</div>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{flex:1, maxWidth:100}}>
                <StackBar segments={[
                  { value: p.adherence,        color: p.status==="ontrack"?"var(--sage)": p.status==="warning"?"var(--amber)":"var(--coral)" },
                  { value: 100 - p.adherence, color: "var(--surface-2)" }
                ]}/>
              </div>
              <div className="mono tnum" style={{fontSize:12.5, width:32}}>{p.adherence}%</div>
            </div>
            <div className="mono tnum" style={{fontSize:12.5}}>{p.weight} kg</div>
            <div className="mono tnum" style={{fontSize:12.5, color: p.weightDelta > 0 ? 'var(--coral-dim)' : p.weightDelta < 0 ? 'var(--sage-dim)' : 'var(--fg-muted)'}}>
              {p.weightDelta > 0 ? "+" : ""}{p.weightDelta.toFixed(1)} kg
            </div>
            <PatientMenuBtn patient={p} onEdit={onEdit} onToggleActive={onToggleActive}/>
          </div>
        );
      })}
    </div>
  );
}

function PatientGrid({ patients, onOpen, onEdit, onToggleActive, compact }) {
  const list = compact ? patients.slice(0, 8) : patients;
  return (
    <div style={{display:'grid', gridTemplateColumns:`repeat(${compact?4:3}, 1fr)`, gap:14}}>
      {list.map(p => (
        <div key={p.id} className="card"
          onClick={()=>onOpen(p.id)}
          style={{cursor:'pointer', padding:'16px', transition:'border-color 0.12s'}}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-2)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
            <Avatar p={p} size={34}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13.5, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</div>
              <div style={{fontSize:11.5, color:'var(--fg-muted)'}}>{p.objective} · {p.age}A</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <div className={"chip " + p.status} style={{padding:'2px 6px'}}><span className="d"/></div>
              {onToggleActive && (
                <div onClick={e=>e.stopPropagation()}>
                  <PatientMenuBtn patient={p} onEdit={onEdit} onToggleActive={onToggleActive}/>
                </div>
              )}
            </div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:8}}>
            <div>
              <div className="eyebrow">Adesão 7d</div>
              <div className="mono tnum" style={{fontSize:22, fontWeight:500, color: p.status==="ontrack"?"var(--sage-dim)": p.status==="warning"?"#A0801F":"var(--coral-dim)"}}>{p.adherence}%</div>
            </div>
            <Sparkline values={fakeSpark(p.adherence)} width={90} height={30} stroke={p.status==="ontrack"?"var(--sage-dim)": p.status==="warning"?"var(--amber)":"var(--coral)"} fill="transparent" showDots={false}/>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--fg-muted)', paddingTop:10, borderTop:'1px solid var(--border)'}}>
            <span className="mono tnum">{p.weight}kg · {p.weightDelta > 0 ? "+" : ""}{p.weightDelta.toFixed(1)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ p, size = 32 }) {
  const bg = p.status === "ontrack" ? "var(--sage)" : p.status === "warning" ? "var(--amber)" : "var(--coral)";
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'var(--surface-2)',
      border:'1px solid var(--border)',
      display:'grid', placeItems:'center',
      fontFamily:'var(--font-mono)', fontSize: size*0.34, fontWeight:600,
      color:'var(--fg)',
      position:'relative',
      flexShrink:0
    }}>
      {p.initials}
      <span style={{
        position:'absolute', bottom:-1, right:-1,
        width:10, height:10, borderRadius:'50%',
        background:bg, border:'2px solid var(--bg)'
      }}/>
    </div>
  );
}

function fakeSpark(end) {
  const out = [];
  let v = end - (Math.random()*10 - 5);
  for (let i = 0; i < 7; i++) {
    out.push(v);
    v += (Math.random()*8 - 3);
  }
  out[6] = end;
  return out;
}

Object.assign(window, { PatientsView, PatientTable, PatientGrid, Avatar, fakeSpark, NewPatientModal, Pagination, PAGE_SIZE, PatientMenuBtn });
