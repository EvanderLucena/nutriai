// Patient detail — the hero screen
function PatientView({ setView, showAISummary, overrideStatus }) {
  const base = { ...ANA };
  if (overrideStatus && overrideStatus !== ANA.status) {
    base.status = overrideStatus;
    base.adherence = overrideStatus === "ontrack" ? 92 : overrideStatus === "warning" ? 71 : 54;
  }

  const [patientData, setPatientData] = React.useState(base);
  const [editOpen, setEditOpen] = React.useState(false);
  const patient = patientData;

  const [tab, setTab] = React.useState("today");
  const [range, setRange] = React.useState("7d");

  return (
    <>
      <Topbar crumbs={["Pacientes", patient.name]}/>
      <div className="page" style={{maxWidth:'none', padding:'0'}}>

        {/* Patient header strip */}
        <div style={{padding:'24px 28px 20px', borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex', alignItems:'flex-start', gap:20}}>
            <div style={{
              width:68, height:68, borderRadius:'50%',
              background:'var(--surface-2)', border:'1px solid var(--border)',
              display:'grid', placeItems:'center',
              fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
              position:'relative', flexShrink:0
            }}>
              {patient.initials}
              <span style={{
                position:'absolute', bottom:0, right:0,
                width:18, height:18, borderRadius:'50%',
                background: patient.status==="ontrack"?"var(--sage)":patient.status==="warning"?"var(--amber)":"var(--coral)",
                border:'3px solid var(--bg)'
              }}/>
            </div>
            <div style={{flex:1}}>
              <div className="eyebrow">Paciente · {patient.id.toUpperCase()} · acompanhamento desde {patient.since}</div>
              <h1 className="serif" style={{fontSize:36, margin:'4px 0 6px', fontWeight:400, letterSpacing:'-0.02em'}}>
                {patient.name}
              </h1>
              <div style={{display:'flex', gap:16, flexWrap:'wrap', fontSize:12.5, color:'var(--fg-muted)', alignItems:'center'}}>
                <span>{patient.age} anos · {patient.sex}</span>
                <span>·</span>
                <span>{patient.height} cm · {patient.biometry[patient.biometry.length-1].weight} kg</span>
                <span>·</span>
                <span style={{color:'var(--fg)'}}>{patient.objective}</span>
                {patient.whatsapp && <><span>·</span><span style={{color:'var(--fg-muted)'}}>{patient.whatsapp}</span></>}
                <button
                  className="btn btn-ghost"
                  style={{fontSize:11.5, padding:'3px 8px', marginLeft:4}}
                  onClick={() => setEditOpen(true)}>
                  <IconEdit size={11}/> Editar
                </button>
              </div>
            </div>
            <div style={{display:'flex', gap:20, alignItems:'center', flexShrink:0}}>
              <HeaderStat label="Adesão 7d" value={`${patient.adherence}%`} status={patient.status}/>
              <div style={{width:1, height:44, background:'var(--border)'}}/>
              <HeaderStat label="Peso" value="64.2 kg" sub="-1.6 kg / 30d" good/>
              <div style={{width:1, height:44, background:'var(--border)'}}/>
              <HeaderStat label="% gordura" value="22.8%" sub="11 abr"/>
            </div>
          </div>

          {/* Tab row */}
          <div style={{display:'flex', gap:2, marginTop:20, borderBottom:'1px solid var(--border)', marginBottom:-21}}>
            {[
              {k:"today", label:"Hoje"},
              {k:"plan", label:"Plano"},
              {k:"biometry", label:"Biometria"},
              {k:"insights", label:"Inteligência"},
              {k:"history", label:"Histórico"}
            ].map(t => (
              <button key={t.k}
                onClick={()=>setTab(t.k)}
                style={{
                  padding:'10px 14px',
                  fontSize:13,
                  color: tab===t.k ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: tab===t.k ? 600 : 400,
                  borderBottom: tab===t.k ? '2px solid var(--fg)' : '2px solid transparent',
                  marginBottom:-1
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "today" && <TodayTab patient={patient} setTab={setTab}/>}
        {tab === "plan" && <PlansView setView={setView}/>}
        {tab === "biometry" && <BiometryTab patient={patient}/>}
        {tab === "insights" && <InsightsTab patient={patient}/>}
        {tab === "history" && <HistoryTab patient={patient}/>}
      </div>
      {editOpen && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => { setPatientData(p => ({ ...p, ...updated })); setEditOpen(false); }}
        />
      )}
    </>
  );
}

function HeaderStat({ label, value, sub, status, good }) {
  const color = status === "ontrack" ? "var(--sage-dim)" : status === "warning" ? "#A0801F" : status === "danger" ? "var(--coral-dim)" : good ? "var(--sage-dim)" : "var(--fg)";
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', minWidth:68, whiteSpace:'nowrap'}}>
      <div className="eyebrow">{label}</div>
      <div className="mono tnum" style={{fontSize:20, fontWeight:500, color, letterSpacing:'-0.02em', marginTop:2}}>{value}</div>
      {sub && <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>{sub}</div>}
    </div>
  );
}

function TodayTab({ patient, showAISummary, setTab }) {
  return (
    <div>
      <div style={{padding:'24px 28px'}}>

        {/* Two-column: PLANO (cadastrado) vs CONSUMO (extraído da IA) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:22}}>
          {/* LEFT: PLANO — cadastrado pelo nutricionista */}
          <div className="card">
            <div className="card-h">
              <div style={{width:8, height:8, borderRadius:2, background:'var(--fg)', flexShrink:0}}/>
              <div className="title">Plano do dia</div>
              <div className="spacer"/>
              <button className="btn btn-ghost" style={{fontSize:11.5, padding:'4px 8px'}} onClick={()=>setTab('plan')}><IconEdit size={11}/> Editar</button>
            </div>
            <div className="card-b">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
                <div className="eyebrow">META DIÁRIA</div>
                <div className="mono tnum" style={{fontSize:14, color:'var(--fg-muted)'}}>6 refeições</div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
                <PlanMacro label="kcal" value="2.200"/>
                <PlanMacro label="proteína" value="140g" color="var(--sage-dim)"/>
                <PlanMacro label="carboidrato" value="250g" color="#A0801F"/>
                <PlanMacro label="gordura" value="70g" color="var(--sky)"/>
              </div>
              <div style={{marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--fg-muted)', lineHeight:1.5}}>
                <span className="mono" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--fg-subtle)', marginRight:6}}>OBSERVAÇÕES</span>
                Evitar lactose · preferir proteína magra à noite · carne vermelha máx 2×/semana
              </div>
            </div>
          </div>

          {/* RIGHT: CONSUMO — somente dados extraídos, sem comparativo */}
          <div className="card">
            <div className="card-h">
              <div style={{width:8, height:8, borderRadius:'50%', background:'var(--lime-dim)', boxShadow:'0 0 0 3px rgba(156,191,43,0.2)', flexShrink:0}}/>
              <div className="title">Consumo reportado</div>
              <div className="spacer"/>
              <div className="chip ai"><span className="d"/>4 registros</div>
            </div>
            <div className="card-b">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
                <div className="eyebrow">EXTRAÍDO ATÉ AGORA · 14:28</div>
                <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.06em'}}>VIA WHATSAPP</div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
                <PlanMacro label="kcal" value="1.680"/>
                <PlanMacro label="proteína" value="108g" color="var(--sage-dim)"/>
                <PlanMacro label="carboidrato" value="182g" color="#A0801F"/>
                <PlanMacro label="gordura" value="54g" color="var(--sky)"/>
              </div>
              <div style={{marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--fg-muted)', lineHeight:1.55}}>
                <span className="mono" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--fg-subtle)', marginRight:6}}>NOTA</span>
                Macros estimados pela IA a partir do texto do paciente. Edite qualquer registro se houver erro de extração.
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="title">Refeições reportadas · hoje</div>
            <div className="sub">SOMENTE REGISTROS DO PACIENTE</div>
            <div className="spacer"/>
            <div style={{fontSize:11, color:'var(--fg-muted)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'var(--lime-dim)'}}/> Extraído via WhatsApp
            </div>
          </div>
          <div className="card-b tight">
            <Timeline items={patient.timeline}/>
          </div>
        </div>
      </div>

    </div>
  );
}

function PlanMacro({ label, value, sub, color }) {
  return (
    <div>
      <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3}}>{label}</div>
      <div className="mono tnum" style={{fontSize:20, fontWeight:500, letterSpacing:'-0.02em', color: color || 'var(--fg)'}}>{value}</div>
      {sub && <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginTop:2}}>{sub}</div>}
    </div>
  );
}

function Timeline({ items }) {
  const reported = items.filter(ev => ev.kind === "log");
  const [editing, setEditing] = React.useState(null); // index of event being edited

  return (
    <div style={{position:'relative'}}>
      {reported.map((ev, i) => {
        const accent = "var(--lime-dim)";
        return (
          <div key={i} style={{
            borderBottom: i === reported.length - 1 ? 'none' : '1px solid var(--border)'
          }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'70px 20px 1fr 170px',
              gap:14,
              padding:'18px 22px',
            }}>
              <div style={{paddingTop:2}}>
                <div className="mono tnum" style={{fontSize:14, fontWeight:600}}>{ev.time}</div>
                <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase', marginTop:2}}>
                  {ev.meal}
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', paddingTop:6}}>
                <div style={{
                  width:12, height:12, borderRadius:'50%',
                  background: accent, border: `2px solid ${accent}`,
                  boxShadow: `0 0 0 3px ${accent}22`
                }}/>
                {i < reported.length - 1 && <div style={{width:1, flex:1, background:'var(--border)', marginTop:4, minHeight:20}}/>}
              </div>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                  <div style={{fontSize:13.5, fontWeight:600}}>Registro</div>
                  <div className="chip ai" style={{padding:'1px 6px'}}><span className="d"/>EXTRAÍDO IA</div>
                </div>
                <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:8}}>
                  {ev.label}
                </div>
                <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:3}}>
                  {ev.items.map((it, j) => (
                    <li key={j} style={{fontSize:13, color:'var(--fg)', display:'flex', gap:8}}>
                      <span style={{color:'var(--fg-subtle)'}}>·</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
                {ev.macros && (
                  <div style={{display:'grid', gridTemplateColumns:'auto auto', columnGap:10, rowGap:2, fontSize:11.5, textAlign:'right'}}>
                    <span style={{color:'var(--fg-muted)'}}>kcal</span><span className="mono tnum" style={{fontWeight:600}}>{ev.macros.kcal}</span>
                    <span style={{color:'var(--fg-muted)'}}>prot</span><span className="mono tnum">{ev.macros.prot}g</span>
                    <span style={{color:'var(--fg-muted)'}}>carb</span><span className="mono tnum">{ev.macros.carb}g</span>
                    <span style={{color:'var(--fg-muted)'}}>gord</span><span className="mono tnum">{ev.macros.fat}g</span>
                  </div>
                )}
                <button
                  className="btn btn-ghost"
                  style={{fontSize:11, padding:'3px 6px', color: editing===i ? 'var(--fg)' : 'var(--fg-subtle)'}}
                  onClick={()=>setEditing(editing===i ? null : i)}>
                  <IconEdit size={10}/> {editing===i ? "Fechar" : "Corrigir extração"}
                </button>
              </div>
            </div>

            {editing === i && <ExtractionEditor ev={ev} onClose={()=>setEditing(null)}/>}
          </div>
        );
      })}
    </div>
  );
}

function ExtractionEditor({ ev, onClose }) {
  const [items, setItems] = React.useState(
    ev.items.map((name, i) => ({
      name,
      kcal: i === 0 ? ev.macros?.kcal ?? 0 : 0,
      prot: i === 0 ? ev.macros?.prot ?? 0 : 0,
      carb: i === 0 ? ev.macros?.carb ?? 0 : 0,
      fat:  i === 0 ? ev.macros?.fat  ?? 0 : 0,
    }))
  );

  const totals = items.reduce((a, x) => ({
    kcal: a.kcal + (Number(x.kcal)||0),
    prot: a.prot + (Number(x.prot)||0),
    carb: a.carb + (Number(x.carb)||0),
    fat:  a.fat  + (Number(x.fat) ||0),
  }), {kcal:0, prot:0, carb:0, fat:0});

  const update = (i, k, v) => setItems(items.map((it, idx) => idx===i ? {...it, [k]:v} : it));
  const addItem = () => setItems([...items, {name:"", kcal:0, prot:0, carb:0, fat:0}]);
  const removeItem = (i) => setItems(items.filter((_,idx)=>idx!==i));

  return (
    <div style={{
      margin:'0 22px 18px 106px',
      background:'var(--surface-2)',
      border:'1px solid var(--border)',
      borderRadius:8,
      overflow:'hidden'
    }}>
      <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
        <div className="eyebrow">CORREÇÃO DE EXTRAÇÃO · {ev.time} · {ev.meal}</div>
        <div style={{fontSize:11.5, color:'var(--fg-muted)', flex:1}}>Ajuste os alimentos e macros se a IA errou na leitura.</div>
      </div>

      {/* Header */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px', gap:8, padding:'8px 14px', borderBottom:'1px solid var(--border)'}}>
        {["Alimento identificado","Kcal","Prot (g)","Carb (g)","Gord (g)",""].map((h,i)=>(
          <div key={i} className="eyebrow" style={{fontSize:9.5}}>{h}</div>
        ))}
      </div>

      {items.map((it, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px', gap:8, padding:'8px 14px', borderBottom:'1px solid var(--border)', alignItems:'center'}}>
          <input
            value={it.name}
            onChange={e=>update(i,'name',e.target.value)}
            style={{padding:'6px 8px', border:'1px solid var(--border)', borderRadius:5, fontSize:12.5, background:'var(--surface)', outline:'none', color:'var(--fg)'}}/>
          {['kcal','prot','carb','fat'].map(k => (
            <input key={k}
              value={it[k]}
              onChange={e=>update(i,k,e.target.value)}
              className="mono tnum"
              style={{padding:'6px 8px', border:'1px solid var(--border)', borderRadius:5, fontSize:12.5, background:'var(--surface)', outline:'none', color:'var(--fg)', width:'100%'}}/>
          ))}
          <button onClick={()=>removeItem(i)} style={{color:'var(--fg-subtle)', padding:4}} title="Remover">
            <IconX size={12}/>
          </button>
        </div>
      ))}

      <div style={{padding:'8px 14px', borderBottom:'1px solid var(--border)'}}>
        <button onClick={addItem} style={{fontSize:12, color:'var(--fg-muted)'}}>
          <IconPlus size={11} style={{verticalAlign:'-2px', marginRight:4}}/> Adicionar alimento
        </button>
      </div>

      {/* Totals */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--surface)'}}>
        <div className="eyebrow" style={{fontSize:10, paddingLeft:2}}>TOTAL CORRIGIDO</div>
        {[totals.kcal, totals.prot, totals.carb, totals.fat].map((v,i)=>(
          <div key={i} className="mono tnum" style={{fontSize:13, fontWeight:600}}>{v}</div>
        ))}
        <div/>
      </div>

      <div style={{padding:'10px 14px', display:'flex', justifyContent:'flex-end', gap:8}}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={onClose}><IconCheck size={12}/> Salvar correção</button>
      </div>
    </div>
  );
}

function BiometryTab({ patient }) {
  const last = patient.biometry[patient.biometry.length - 1];
  const [metric, setMetric] = React.useState("all");
  const [newEvalOpen, setNewEvalOpen] = React.useState(false);
  const metricCfg = {
    all:      { label: "Todas",   color: null },
    weight:   { label: "Peso",    unit: "kg", color: "var(--ink-contrast)" },
    fat:      { label: "Gordura", unit: "%",  color: "#A0801F" },
    lean:     { label: "Massa",   unit: "kg", color: "var(--sage-dim)" },
    water:    { label: "Água",    unit: "%",  color: "var(--sky)" }
  };
  return (
    <div style={{padding:'24px 28px'}}>

      {/* Header: última avaliação */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center'}}>
          <div>
            <div className="eyebrow">ÚLTIMA AVALIAÇÃO</div>
            <div className="serif" style={{fontSize:22, margin:'4px 0 0', letterSpacing:'-0.01em'}}>{last.date} 2026 · {last.method}</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:20, paddingLeft:20, borderLeft:'1px solid var(--border)'}}>
            <BioCell label="Peso" value={last.weight} unit="kg"/>
            <BioCell label="% Gordura" value={last.fat} unit="%" delta={-1.3} good/>
            <BioCell label="Massa magra" value={last.lean} unit="kg" delta={+0.6} good/>
            <BioCell label="% Água" value={last.water} unit="%"/>
            <BioCell label="Gordura visceral" value={last.visceral} sub="nível"/>
          </div>
          <button className="btn btn-primary" onClick={()=>setNewEvalOpen(true)}><IconPlus size={13}/> Nova avaliação</button>
        </div>
      </div>

      {/* Evolução chart */}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-h">
          <div className="title">Evolução · 4 avaliações</div>
          <div className="sub">21 MAR → 11 ABR</div>
          <div className="spacer"/>
          <div className="seg" style={{height:26}}>
            {Object.keys(metricCfg).map(k => (
              <button key={k} className={metric===k?"active":""} onClick={()=>setMetric(k)}>{metricCfg[k].label}</button>
            ))}
          </div>
        </div>
        <div className="card-b">
          {metric === "all" ? (
            <MultiLineChart data={patient.biometry} metrics={[
              { key:"weight", color:"var(--ink-contrast)", label:"Peso",    unit:"kg" },
              { key:"fat",    color:"#A0801F",             label:"Gordura", unit:"%" },
              { key:"lean",   color:"var(--sage-dim)",     label:"Massa",   unit:"kg" },
              { key:"water",  color:"var(--sky)",          label:"Água",    unit:"%" }
            ]}/>
          ) : (
            <LineChart data={patient.biometry} width={900} height={200} yKey={metric} color={metricCfg[metric].color} fill="rgba(11,12,10,0.05)" unit={metricCfg[metric].unit || ""}/>
          )}
        </div>
      </div>

      {/* Dobras cutâneas + Perimetria side by side */}
      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, marginBottom:16}}>
        <div className="card">
          <div className="card-h">
            <div className="title">Dobras cutâneas</div>
            <div className="sub">PROTOCOLO POLLOCK 7 · ADIPÔMETRO</div>
            <div className="spacer"/>
            <div className="mono" style={{fontSize:11, color:'var(--fg-muted)'}}>{patient.skinfolds.date}</div>
          </div>
          <div className="card-b">
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
              {patient.skinfolds.folds.map((f, i) => (
                <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surface-2)', borderRadius:6}}>
                  <div style={{flex:1, fontSize:12.5}}>{f.name}</div>
                  <div className="mono tnum" style={{fontSize:15, fontWeight:600}}>{f.value}<span style={{fontSize:10, color:'var(--fg-subtle)', marginLeft:3}}>mm</span></div>
                </div>
              ))}
            </div>
            <div style={{marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12}}>
              <div>
                <div className="eyebrow">SOMATÓRIO 7 DOBRAS</div>
                <div className="mono tnum" style={{fontSize:20, fontWeight:500, marginTop:3}}>114 <span style={{fontSize:11, color:'var(--fg-subtle)'}}>mm</span></div>
              </div>
              <div>
                <div className="eyebrow">DENSIDADE CORPORAL</div>
                <div className="mono tnum" style={{fontSize:20, fontWeight:500, marginTop:3}}>1,048 <span style={{fontSize:11, color:'var(--fg-subtle)'}}>g/mL</span></div>
              </div>
              <div>
                <div className="eyebrow">% GORDURA (SIRI)</div>
                <div className="mono tnum" style={{fontSize:20, fontWeight:500, marginTop:3, color:'#A0801F'}}>22,8%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="title">Perimetria</div>
            <div className="sub">CIRCUNFERÊNCIAS · CM</div>
            <div className="spacer"/>
            <div className="mono" style={{fontSize:11, color:'var(--fg-muted)'}}>{patient.perimetry.date}</div>
          </div>
          <div className="card-b tight">
            {patient.perimetry.measures.map((m, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:16, padding:'12px 18px', borderBottom: i === patient.perimetry.measures.length - 1 ? 'none' : '1px solid var(--border)', alignItems:'center'}}>
                <div style={{fontSize:13}}>{m.name}</div>
                <div className="mono tnum" style={{fontSize:14, fontWeight:500}}>{m.value} <span style={{fontSize:10, color:'var(--fg-subtle)'}}>cm</span></div>
                <div className="mono tnum" style={{fontSize:11, width:48, textAlign:'right', color: m.delta < 0 ? 'var(--sage-dim)' : m.delta > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)'}}>
                  {m.delta > 0 ? "+" : ""}{m.delta.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de avaliações */}
      <div className="card">
        <div className="card-h">
          <div className="title">Histórico de avaliações</div>
          <div className="sub">APPEND-ONLY · AUDITORIA CLÍNICA</div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr', padding:'10px 18px', borderBottom:'1px solid var(--border)', gap:12}}>
          {["Data","Método","Peso","% Gordura","Magra","% Água","TMB"].map((h,i) => (
            <div key={i} className="eyebrow" style={{fontSize:10}}>{h}</div>
          ))}
        </div>
        {[...patient.biometry].reverse().map((b, i, arr) => (
          <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr', padding:'12px 18px', borderBottom: i===arr.length-1 ? 'none' : '1px solid var(--border)', gap:12, alignItems:'center'}}>
            <div className="mono" style={{fontSize:12, color:'var(--fg)'}}>{b.date} 2026</div>
            <div style={{fontSize:12, color:'var(--fg-muted)'}}>{b.method}</div>
            <div className="mono tnum" style={{fontSize:12.5, fontWeight:500}}>{b.weight} kg</div>
            <div className="mono tnum" style={{fontSize:12, color:'#A0801F'}}>{b.fat}%</div>
            <div className="mono tnum" style={{fontSize:12, color:'var(--sage-dim)'}}>{b.lean} kg</div>
            <div className="mono tnum" style={{fontSize:12, color:'var(--sky)'}}>{b.water}%</div>
            <div className="mono tnum" style={{fontSize:12, color:'var(--fg-muted)'}}>{b.bmr} kcal</div>
          </div>
        ))}
      </div>
      {newEvalOpen && <NewBiometryModal onClose={()=>setNewEvalOpen(false)}/>}
    </div>
  );
}

function NewBiometryModal({ onClose }) {
  const SKINFOLDS = ["Peitoral","Axilar médio","Tríceps","Subescapular","Abdominal","Suprailíaco","Coxa"];
  const PERIMETRY = ["Cintura","Abdômen","Quadril","Braço D","Braço E","Coxa D","Coxa E","Panturrilha D"];

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.45)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(680px, 100%)', maxHeight:'90vh', overflow:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Nova avaliação biométrica</div>
          <div className="spacer"/>
          <div style={{fontSize:11.5, color:'var(--fg-muted)'}}>Preencha só o que tiver disponível</div>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px', marginLeft:8}}><IconX size={14}/></button>
        </div>

        <div style={{padding:'18px 20px 20px', display:'flex', flexDirection:'column', gap:14}}>

          {/* Sempre obrigatório */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <BioField label="Data da avaliação" type="date"/>
            <BioField label="Peso (kg)" placeholder="64.2" mono/>
          </div>

          {/* Bioimpedância */}
          <div className="divider"><span>Bioimpedância · opcional</span></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <BioField label="% Gordura" placeholder="22.8" mono/>
            <BioField label="Massa magra (kg)" placeholder="49.8" mono/>
            <BioField label="% Água" placeholder="54.2" mono/>
            <BioField label="Gordura visceral · nível" placeholder="6" mono/>
            <BioField label="TMB (kcal)" placeholder="1420" mono/>
            <BioField label="Aparelho / marca" placeholder="ex: Tanita BC-601"/>
          </div>

          {/* Pollock 7 dobras */}
          <div className="divider"><span>Dobras cutâneas · mm · opcional</span></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            {SKINFOLDS.map(f => <BioField key={f} label={f} placeholder="—" mono/>)}
          </div>
          <div style={{padding:'10px 12px', background:'var(--surface-2)', borderRadius:6, fontSize:11.5, color:'var(--fg-muted)', lineHeight:1.5}}>
            <span className="mono" style={{color:'var(--fg-subtle)', marginRight:6, fontSize:10}}>FÓRMULA</span>
            Se todas as 7 dobras forem preenchidas, % gordura é calculado por Jackson & Pollock (1978) + Siri.
          </div>

          {/* Perimetria */}
          <div className="divider"><span>Perimetria · cm · opcional</span></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            {PERIMETRY.map(f => <BioField key={f} label={f} placeholder="—" mono/>)}
          </div>

          <BioField label="Observações · opcional" kind="textarea" placeholder="ex: paciente em jejum, avaliação pós-treino"/>
        </div>

        <div style={{padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onClose}><IconCheck size={13}/> Registrar avaliação</button>
        </div>
      </div>
    </div>
  );
}

function BioField({ label, placeholder, type, kind, mono }) {
  const style = {
    padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6,
    fontSize:13, background:'var(--surface)', outline:'none', width:'100%',
    color:'var(--fg)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)'
  };
  return (
    <div style={{display:'flex', flexDirection:'column', gap:5}}>
      <div className="eyebrow">{label}</div>
      {kind === "textarea"
        ? <textarea placeholder={placeholder} rows={2} style={{...style, resize:'vertical', fontFamily:'var(--font-ui)'}}/>
        : <input type={type||"text"} placeholder={placeholder} style={style}/>
      }
    </div>
  );
}

function BioCell({ label, value, unit, sub, delta, good }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:4, marginTop:3}}>
        <div className="mono tnum" style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em'}}>{value}</div>
        {unit && <div style={{fontSize:11, color:'var(--fg-subtle)'}}>{unit}</div>}
      </div>
      {delta !== undefined && (
        <div className="mono tnum" style={{fontSize:10.5, color: good ? 'var(--sage-dim)' : 'var(--fg-muted)', marginTop:1}}>
          {delta > 0 ? "+" : ""}{delta} vs. anterior
        </div>
      )}
      {sub && <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginTop:1}}>{sub}</div>}
    </div>
  );
}

function InsightsTab({ patient }) {
  return (
    <div style={{padding:'24px 28px'}}>
      <div className="card">
        <div className="card-h">
          <div className="title">Padrões observados no consumo</div>
          <div className="sub">ÚLTIMOS 14 DIAS</div>
          <div className="spacer"/>
          <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.06em'}}>APENAS DADOS EXTRAÍDOS</div>
        </div>
        <div className="card-b">
          <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:14}}>
            {[
              "Horários de maior frequência de registro: 07:00–09:00 e 12:00–13:30",
              "Proteína média por refeição: 28g (desvio padrão 6g)",
              "Hidratação raramente reportada — apenas 2 registros nos últimos 7 dias",
              "Frequência de lanches reportados no período da tarde vem caindo nas últimas 2 semanas"
            ].map((t, i) => (
              <li key={i} style={{fontSize:13.5, display:'flex', gap:12, color:'var(--fg)'}}>
                <span style={{color:'var(--lime-dim)', fontFamily:'var(--font-mono)', fontSize:12}}>0{i+1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ patient }) {
  const today = "2026-04-17";
  const [dateFrom, setDateFrom] = React.useState("2026-04-10");
  const [dateTo, setDateTo] = React.useState(today);
  const [quickRange, setQuickRange] = React.useState("7d");

  const applyQuick = (r) => {
    setQuickRange(r);
    const days = { "7d":7, "14d":14, "30d":30 };
    const d = new Date(today);
    d.setDate(d.getDate() - days[r] + 1);
    setDateFrom(d.toISOString().slice(0,10));
    setDateTo(today);
  };

  const MOCK_HISTORY = [
    { date:"17 abr", entries:[
      { time:"12:48", meal:"Almoço",       items:["Frango grelhado ~150g","Arroz integral","Salada"],       macros:{kcal:620,prot:48,carb:62,fat:18} },
      { time:"10:05", meal:"Lanche manhã", items:["Banana + pasta de amendoim"],                            macros:{kcal:210,prot:5,carb:28,fat:10} },
      { time:"07:14", meal:"Café da manhã",items:["Omelete 2 ovos","Pão integral","Café preto"],            macros:{kcal:380,prot:26,carb:28,fat:16} }
    ]},
    { date:"16 abr", entries:[
      { time:"19:55", meal:"Jantar",        items:["Tilápia assada","Batata-doce","Brócolis"],               macros:{kcal:490,prot:40,carb:38,fat:14} },
      { time:"12:30", meal:"Almoço",        items:["Carne moída refogada","Arroz","Feijão","Salada"],        macros:{kcal:680,prot:42,carb:70,fat:22} },
      { time:"07:20", meal:"Café da manhã", items:["Iogurte natural","Granola","Morango"],                   macros:{kcal:310,prot:18,carb:38,fat:8} }
    ]},
    { date:"15 abr", entries:[
      { time:"20:10", meal:"Jantar",        items:["Omelete 3 ovos","Queijo branco","Tomate"],               macros:{kcal:420,prot:34,carb:6,fat:28} },
      { time:"15:40", meal:"Lanche tarde",  items:["Mix de castanhas 30g"],                                  macros:{kcal:185,prot:5,carb:6,fat:17} },
      { time:"12:55", meal:"Almoço",        items:["Frango desfiado","Macarrão integral","Molho de tomate"], macros:{kcal:590,prot:44,carb:58,fat:16} },
      { time:"07:05", meal:"Café da manhã", items:["Whey protein baunilha","Aveia","Banana"],                macros:{kcal:430,prot:32,carb:54,fat:8} }
    ]},
    { date:"14 abr", entries:[
      { time:"19:30", meal:"Jantar",        items:["Salmão grelhado","Purê de batata-doce","Aspargos"],      macros:{kcal:530,prot:38,carb:40,fat:20} },
      { time:"12:40", meal:"Almoço",        items:["Frango grelhado","Arroz integral","Feijão"],             macros:{kcal:610,prot:46,carb:60,fat:18} },
      { time:"07:18", meal:"Café da manhã", items:["Pão integral","Ovo mexido","Queijo"],                    macros:{kcal:360,prot:22,carb:30,fat:14} }
    ]}
  ];

  const HISTORY_PAGE_SIZE = 7;
  const [histPage, setHistPage] = React.useState(0);

  const displayed = MOCK_HISTORY; // in real app, filter by dateFrom/dateTo
  const histPages = Math.max(1, Math.ceil(displayed.length / HISTORY_PAGE_SIZE));
  const histSlice = displayed.slice(histPage * HISTORY_PAGE_SIZE, (histPage + 1) * HISTORY_PAGE_SIZE);

  const totalEntries = displayed.reduce((s, d) => s + d.entries.length, 0);
  const totalKcal = displayed.reduce((s, d) =>
    s + d.entries.reduce((ss, e) => ss + e.macros.kcal, 0), 0);

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Controls */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:20, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">Registros extraídos · append-only</div>
          <div style={{fontSize:13, color:'var(--fg-muted)', marginTop:2}}>
            <span className="mono tnum" style={{fontWeight:600, color:'var(--fg)'}}>{totalEntries}</span> refeições ·&nbsp;
            <span className="mono tnum" style={{fontWeight:600, color:'var(--fg)'}}>{totalKcal.toLocaleString('pt-BR')}</span> kcal total
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div className="seg" style={{height:28}}>
            {["7d","14d","30d"].map(r => (
              <button key={r} className={quickRange===r?"active":""} onClick={()=>applyQuick(r)}>{r}</button>
            ))}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value); setQuickRange("");}}
              style={{padding:'5px 8px', border:'1px solid var(--border)', borderRadius:5, fontSize:12, background:'var(--surface)', color:'var(--fg)', fontFamily:'var(--font-mono)'}}/>
            <span style={{fontSize:12, color:'var(--fg-muted)'}}>→</span>
            <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value); setQuickRange("");}}
              style={{padding:'5px 8px', border:'1px solid var(--border)', borderRadius:5, fontSize:12, background:'var(--surface)', color:'var(--fg)', fontFamily:'var(--font-mono)'}}/>
          </div>
        </div>
      </div>

      {/* Days */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {histSlice.map((day, di) => {
          const dayKcal = day.entries.reduce((s,e) => s + e.macros.kcal, 0);
          return (
            <div key={di} className="card">
              <div style={{padding:'12px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{fontSize:13.5, fontWeight:600}}>{day.date}</div>
                <div style={{display:'flex', gap:16}}>
                  <span className="mono tnum" style={{fontSize:11.5, color:'var(--fg-muted)'}}>{day.entries.length} refeições</span>
                  <span className="mono tnum" style={{fontSize:11.5, color:'var(--fg)'}}>{dayKcal} kcal</span>
                </div>
              </div>
              {day.entries.map((e, ei) => (
                <div key={ei} style={{
                  display:'grid', gridTemplateColumns:'70px 1fr auto',
                  gap:14, padding:'12px 18px',
                  borderBottom: ei < day.entries.length-1 ? '1px solid var(--border)' : 'none',
                  alignItems:'start'
                }}>
                  <div>
                    <div className="mono tnum" style={{fontSize:13, fontWeight:600}}>{e.time}</div>
                    <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2}}>{e.meal}</div>
                  </div>
                  <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:2}}>
                    {e.items.map((it,j) => (
                      <li key={j} style={{fontSize:13, color:'var(--fg)', display:'flex', gap:6}}>
                        <span style={{color:'var(--fg-subtle)'}}>·</span>{it}
                      </li>
                    ))}
                  </ul>
                  <div style={{display:'grid', gridTemplateColumns:'auto auto', columnGap:8, rowGap:1, fontSize:11.5, textAlign:'right'}}>
                    <span style={{color:'var(--fg-muted)'}}>kcal</span><span className="mono tnum" style={{fontWeight:600}}>{e.macros.kcal}</span>
                    <span style={{color:'var(--fg-muted)'}}>prot</span><span className="mono tnum">{e.macros.prot}g</span>
                    <span style={{color:'var(--fg-muted)'}}>carb</span><span className="mono tnum">{e.macros.carb}g</span>
                    <span style={{color:'var(--fg-muted)'}}>gord</span><span className="mono tnum">{e.macros.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {histPages > 1 && (
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)'}}>
          <div className="mono" style={{fontSize:11.5, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>
            Dias {histPage * HISTORY_PAGE_SIZE + 1}–{Math.min((histPage + 1) * HISTORY_PAGE_SIZE, displayed.length)} de {displayed.length}
          </div>
          <div style={{display:'flex', gap:6}}>
            <button className="btn btn-ghost" disabled={histPage===0} onClick={()=>setHistPage(p=>p-1)} style={{opacity:histPage===0?0.35:1}}>← Anterior</button>
            <button className="btn btn-ghost" disabled={histPage===histPages-1} onClick={()=>setHistPage(p=>p+1)} style={{opacity:histPage===histPages-1?0.35:1}}>Próximo →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiLineChart({ data, metrics }) {
  const width = 900, height = 200, padL = 36, padB = 24, padT = 8, padR = 12;
  const w = width - padL - padR, h = height - padT - padB;
  const n = data.length;
  const step = n > 1 ? w / (n - 1) : w;
  const [hover, setHover] = React.useState(null);
  const wrapRef = React.useRef(null);
  const svgRef = React.useRef(null);

  const series = metrics.map(m => {
    const vals = data.map(d => d[m.key]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => [padL + i * step, padT + h - ((v - min) / range) * h]);
    return { ...m, pts, vals, min, max };
  });

  const path = pts => pts.map((p,i) => (i===0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(" ");

  const handleMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const svgX = (e.clientX - svgRect.left) * (width / svgRect.width);
    const idx = Math.round((svgX - padL) / step);
    const mx = e.clientX - wrapRect.left;
    const my = e.clientY - wrapRect.top;
    if (idx >= 0 && idx < n) setHover({ idx, mx, my });
    else setHover(null);
  };

  return (
    <div ref={wrapRef} style={{position:'relative'}} onMouseMove={handleMouseMove} onMouseLeave={()=>setHover(null)}>
      <svg ref={svgRef} width={width} height={height} style={{display:'block', maxWidth:'100%', cursor:'crosshair'}}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={padL} x2={padL+w} y1={padT + t*h} y2={padT + t*h} stroke="var(--border)" strokeDasharray="1 3"/>
        ))}
        {data.map((d, i) => (
          <text key={i} x={padL + i*step} y={height-6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--fg-subtle)">
            {d.date.replace(" 2026","").replace("2026","")}
          </text>
        ))}
        {series.map(m => (
          <g key={m.key}>
            <path d={path(m.pts)} stroke={m.color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
            {m.pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={hover?.idx===i ? 5 : 3} fill={m.color}/>
            ))}
          </g>
        ))}
        {hover && (
          <line x1={padL + hover.idx * step} x2={padL + hover.idx * step} y1={padT} y2={padT+h} stroke="var(--fg)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
        )}
      </svg>

      {hover && (
        <div style={{
          position:'absolute',
          left: hover.mx + 14,
          top: hover.my - 10,
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6,
          boxShadow:'0 6px 20px rgba(0,0,0,0.12)', padding:'10px 13px',
          pointerEvents:'none', zIndex:10, whiteSpace:'nowrap'
        }}>
          <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginBottom:8, letterSpacing:'0.06em'}}>
            {data[hover.idx].date}
          </div>
          {series.map(m => (
            <div key={m.key} style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
              <span style={{width:8, height:8, borderRadius:'50%', background:m.color, flexShrink:0}}/>
              <span style={{fontSize:12, color:'var(--fg-muted)', flex:1}}>{m.label}</span>
              <span className="mono tnum" style={{fontSize:13, fontWeight:600, color:m.color}}>
                {m.vals[hover.idx]}{m.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex', gap:16, paddingLeft:padL, paddingTop:8, flexWrap:'wrap'}}>
        {series.map(m => (
          <div key={m.key} style={{display:'flex', alignItems:'center', gap:5, fontSize:11}}>
            <span style={{width:10, height:3, borderRadius:2, background:m.color, display:'inline-block'}}/>
            <span style={{color:'var(--fg-muted)'}}>{m.label}</span>
            <span className="mono tnum" style={{color:'var(--fg-subtle)', fontSize:10}}>{m.min}{m.unit}–{m.max}{m.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditPatientModal({ patient, onClose, onSave }) {
  const [name,      setName]      = React.useState(patient.name);
  const [age,       setAge]       = React.useState(String(patient.age));
  const [sex,       setSex]       = React.useState(patient.sex || "F");
  const [height,    setHeight]    = React.useState(String(patient.height));
  const [objective, setObjective] = React.useState(patient.objective);
  const [whatsapp,  setWhatsapp]  = React.useState(patient.whatsapp || "");

  const handle = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      initials: name.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0,2).join(''),
      age: Number(age) || patient.age,
      sex,
      height: Number(height) || patient.height,
      objective: objective.trim(),
      whatsapp: whatsapp.trim()
    });
  };

  const field = (label, val, set, opts = {}) => (
    <div style={{display:'flex', flexDirection:'column', gap:5}}>
      <div className="eyebrow">{label}</div>
      <input
        value={val}
        onChange={e => set(e.target.value)}
        type={opts.type || "text"}
        placeholder={opts.placeholder || ""}
        style={{
          padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6,
          fontSize:13, background:'var(--surface)', outline:'none',
          color:'var(--fg)', width:'100%', boxSizing:'border-box',
          fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-ui)'
        }}
        onFocus={e => e.target.style.borderColor='var(--fg-muted)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}
      />
    </div>
  );

  return (
    <div
      style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.4)', zIndex:200, display:'grid', placeItems:'center', padding:20}}
      onClick={onClose}>
      <div className="card" style={{width:'min(480px, 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Editar paciente</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>
        <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', gap:12}}>
          {field("Nome completo", name, setName, {placeholder:"Ana Beatriz Lopes"})}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {field("Idade", age, setAge, {type:"number", mono:true, placeholder:"34"})}
            <div style={{display:'flex', flexDirection:'column', gap:5}}>
              <div className="eyebrow">Sexo</div>
              <div className="seg" style={{height:36}}>
                <button className={sex==="F"?"active":""} onClick={()=>setSex("F")}>Feminino</button>
                <button className={sex==="M"?"active":""} onClick={()=>setSex("M")}>Masculino</button>
              </div>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {field("Altura (cm)", height, setHeight, {type:"number", mono:true, placeholder:"168"})}
            {field("WhatsApp", whatsapp, setWhatsapp, {placeholder:"+55 11 9 0000-0000"})}
          </div>
          {field("Objetivo clínico", objective, setObjective, {placeholder:"Hipertrofia com manutenção de % gordura"})}
        </div>
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={!name.trim()} style={{opacity: name.trim() ? 1 : 0.45}}>
            <IconCheck size={13}/> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PatientView, Timeline });
