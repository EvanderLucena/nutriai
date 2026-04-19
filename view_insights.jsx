// Insights — aggregate intelligence across the carteira
function InsightsView({ setView, setActivePatientId }) {
  return (
    <>
      <Topbar crumbs={["Workspace", "Inteligência"]}/>
      <div className="page">
        <div style={{marginBottom:20}}>
          <div className="eyebrow">Análise agregada · 48 pacientes</div>
          <h1 className="serif" style={{fontSize:38, margin:'4px 0 6px', fontWeight:400, letterSpacing:'-0.02em'}}>
            Panorama da sua carteira.
          </h1>
          <div style={{fontSize:13.5, color:'var(--fg-muted)', maxWidth:720, lineHeight:1.55}}>
            Dados agregados e anônimos de consumo e biometria extraídos pela IA. Sem conteúdo de conversas individuais.
          </div>
        </div>

        {/* Aggregate stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:16}}>
          <AggStat label="Refeições extraídas · 30d" value="3.412"/>
          <AggStat label="Biometrias registradas · 30d" value="148"/>
          <AggStat label="Pacientes sem registro >3d" value="5"/>
          <AggStat label="Média de refeições/paciente/dia" value="2,7"/>
        </div>

        {/* Patterns — factual only, no prescriptive suggestions */}
        <div className="divider"><span>Padrões agregados de consumo</span></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
          {[
            { title:"Concentração de registros no fim de semana", body:"Volume de refeições reportadas cai 32% aos sábados e domingos em relação à média semanal.", pct:"68% DA CARTEIRA" },
            { title:"Proteína por refeição", body:"Média de 28g por refeição registrada, com variação entre 18g (café) e 42g (jantar).", pct:"42% DA CARTEIRA" },
            { title:"Hidratação raramente reportada", body:"Apenas 23% dos pacientes incluem registro de água na conversa com a IA.", pct:"77% DA CARTEIRA" }
          ].map((p, i) => (
            <div key={i} className="card">
              <div className="card-b">
                <div className="mono" style={{fontSize:11, color:'var(--lime-dim)', letterSpacing:'0.08em', marginBottom:10}}>PADRÃO 0{i+1}</div>
                <h3 className="serif" style={{fontSize:22, margin:'0 0 10px', fontWeight:400, letterSpacing:'-0.01em'}}>{p.title}</h3>
                <p style={{margin:0, fontSize:13, color:'var(--fg-muted)', lineHeight:1.55}}>{p.body}</p>
              </div>
              <div style={{padding:'12px 18px', borderTop:'1px solid var(--border)'}}>
                <div className="mono tnum" style={{fontSize:11, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>
                  {p.pct}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evolution */}
        <div className="divider"><span>Evolução da carteira · 12 semanas</span></div>
        <div className="card">
          <div className="card-b" style={{padding:'24px'}}>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:32, alignItems:'center'}}>
              <CarteiraChart/>
              <div>
                <div style={{display:'flex', flexDirection:'column', gap:14}}>
                  <LegendItem color="var(--sage)" label="On-track" value="31 pacientes" delta="+4 vs. mês anterior" good/>
                  <LegendItem color="var(--amber)" label="Atenção" value="12 pacientes" delta="-1 vs. mês anterior"/>
                  <LegendItem color="var(--coral)" label="Crítico" value="5 pacientes" delta="+2 vs. mês anterior" bad/>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function AggStat({ label, value }) {
  return (
    <div className="card" style={{padding:'16px 18px'}}>
      <div className="eyebrow" style={{marginBottom:6}}>{label}</div>
      <div className="mono tnum" style={{fontSize:30, fontWeight:500, letterSpacing:'-0.02em'}}>{value}</div>
    </div>
  );
}

function CarteiraChart() {
  const weeks = 12;
  const data = Array.from({length: weeks}, (_, i) => ({
    ontrack: 25 + Math.round(Math.sin(i*0.6)*3 + i*0.4),
    warning: 14 - Math.round(Math.sin(i*0.8)*2),
    danger: 3 + Math.round(Math.abs(Math.sin(i*0.9)))
  }));
  const width = 560, height = 180, padL = 30, padB = 24, padT = 8, padR = 12;
  const w = width - padL - padR, h = height - padT - padB;
  const maxTotal = 50;
  const step = w / (weeks - 1);

  const [hover, setHover] = React.useState(null);
  const svgRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  const mk = (key) => data.map((d, i) => [padL + i*step, padT + h - (d[key]/maxTotal)*h]);
  const ontrack = mk("ontrack");
  const warning = mk("warning");
  const danger = mk("danger");
  const path = (pts) => pts.map((p,i)=>(i===0?`M${p[0]},${p[1]}`:`L${p[0]},${p[1]}`)).join(" ");

  const handleMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const svgX = (e.clientX - svgRect.left) * (width / svgRect.width);
    const idx = Math.round((svgX - padL) / step);
    if (idx >= 0 && idx < weeks) {
      setHover({ idx, mx: e.clientX - wrapRect.left, my: e.clientY - wrapRect.top });
    } else {
      setHover(null);
    }
  };

  const series = [
    { key:"ontrack", pts: ontrack, color:"var(--sage)",  label:"On-track" },
    { key:"warning", pts: warning, color:"var(--amber)", label:"Atenção"  },
    { key:"danger",  pts: danger,  color:"var(--coral)", label:"Crítico"  },
  ];

  return (
    <div ref={wrapRef} style={{position:'relative'}} onMouseMove={handleMouseMove} onMouseLeave={()=>setHover(null)}>
      <svg ref={svgRef} width={width} height={height} style={{display:'block', maxWidth:'100%', cursor:'crosshair'}}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padT + t * h;
          return <line key={i} x1={padL} x2={padL+w} y1={y} y2={y} stroke="var(--border)" strokeDasharray="1 3"/>;
        })}
        {series.map(s => (
          <g key={s.key}>
            <path d={path(s.pts)} stroke={s.color} strokeWidth="2" fill="none"/>
            {s.pts.map((p,i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={hover?.idx===i ? 5 : 2.5} fill={s.color}/>
            ))}
          </g>
        ))}
        {hover && (
          <line x1={padL + hover.idx*step} x2={padL + hover.idx*step} y1={padT} y2={padT+h}
            stroke="var(--fg)" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"/>
        )}
        {data.map((d, i) => (
          <text key={i} x={padL + i*step} y={height - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--fg-subtle)">S{i+1}</text>
        ))}
      </svg>
      {hover && (
        <div style={{
          position:'absolute', left: hover.mx + 14, top: hover.my - 10,
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6,
          boxShadow:'0 6px 20px rgba(0,0,0,0.12)', padding:'10px 13px',
          pointerEvents:'none', zIndex:10, whiteSpace:'nowrap'
        }}>
          <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginBottom:8, letterSpacing:'0.06em'}}>
            SEMANA {hover.idx + 1}
          </div>
          {series.map(s => (
            <div key={s.key} style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
              <span style={{width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0}}/>
              <span style={{fontSize:12, color:'var(--fg-muted)', flex:1}}>{s.label}</span>
              <span className="mono tnum" style={{fontSize:13, fontWeight:600, color:s.color}}>
                {data[hover.idx][s.key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, value, delta, good, bad }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'12px 1fr auto', gap:10, alignItems:'center'}}>
      <div style={{width:10, height:10, borderRadius:2, background:color}}/>
      <div>
        <div style={{fontSize:13, fontWeight:500}}>{label}</div>
        <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)'}}>{delta}</div>
      </div>
      <div className="mono tnum" style={{fontSize:14, fontWeight:500}}>{value}</div>
    </div>
  );
}

Object.assign(window, { InsightsView });
