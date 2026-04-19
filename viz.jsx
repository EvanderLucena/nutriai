// Small, reusable data viz: MacroRing, Sparkline, BarStack, WeekDots
const { useMemo: _useMemo } = React;

// Simple ring — single value
function Ring({ size = 56, stroke = 5, value = 0.75, color = "currentColor", track = "var(--border)", label, sub, valueColor }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 1.2); // allow overflow visualization up to 120%
  const dash = Math.min(v, 1) * c;
  const over = v > 1;
  return (
    <div style={{position:'relative', width:size, height:size, display:'inline-block'}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r}
          stroke={over ? "var(--coral)" : color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}/>
      </svg>
      {(label || sub) && (
        <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', lineHeight:1}}>
          {label && <div className="mono tnum" style={{fontSize: Math.max(11, size * 0.22), fontWeight:600, color: valueColor || 'var(--fg)'}}>{label}</div>}
          {sub && <div className="mono" style={{fontSize:9, color:'var(--fg-subtle)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2}}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// Macro summary ring group
function MacroRings({ macros, size = 64 }) {
  const items = [
    { key:"kcal", label:"Kcal",  color:"var(--ink-contrast)", data: macros.kcal },
    { key:"prot", label:"Prot.", color:"var(--sage)",         data: macros.prot, unit:"g" },
    { key:"carb", label:"Carb.", color:"var(--amber)",        data: macros.carb, unit:"g" },
    { key:"fat",  label:"Gord.", color:"var(--sky)",          data: macros.fat,  unit:"g" }
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:`repeat(4, 1fr)`, gap:10}}>
      {items.map(it => {
        const pct = it.data.actual / it.data.target;
        return (
          <div key={it.key} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
            <Ring size={size} stroke={5} value={pct} color={it.color}
              label={`${Math.round(pct*100)}%`}/>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:11, color:'var(--fg-muted)'}}>{it.label}</div>
              <div className="mono tnum" style={{fontSize:11.5}}>
                {it.data.actual}{it.unit||""} / {it.data.target}{it.unit||""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sparkline with shaded area
function Sparkline({ values, width = 220, height = 54, stroke = "var(--ink-contrast)", fill = "rgba(127,183,126,0.15)", showDots = true, target }) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values) - 0.2;
  const max = Math.max(...values) + 0.2;
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{display:'block', overflow:'visible'}}>
      {target !== undefined && (() => {
        const ty = height - ((target - min) / range) * height;
        return <line x1={0} x2={width} y1={ty} y2={ty} stroke="var(--border-2)" strokeDasharray="2 3" strokeWidth="1"/>;
      })()}
      <path d={area} fill={fill}/>
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {showDots && pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 2} fill={stroke}/>
      ))}
    </svg>
  );
}

// 7 day bars
function WeekBars({ values, height = 42, activeIndex = -1 }) {
  const max = 1;
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:4, height}}>
      {values.map((v, i) => {
        const h = Math.max(3, v * height);
        const over = v > 1;
        const low = v < 0.7;
        return (
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
            <div style={{
              width:'100%',
              height: h,
              background: low ? 'var(--coral)' : (v < 0.85 ? 'var(--amber)' : 'var(--sage)'),
              borderRadius: 2,
              opacity: activeIndex === -1 || activeIndex === i ? 1 : 0.45
            }}/>
            <div className="mono" style={{fontSize:9, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>
              {["SEG","TER","QUA","QUI","SEX","SÁB","DOM"][i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Line chart with axes (biometry)
function LineChart({ data, width = 560, height = 200, yKey = "weight", yLabel = "peso (kg)", color = "var(--ink-contrast)", fill = "rgba(11,12,10,0.05)", unit = "" }) {
  if (!data || !data.length) return null;
  const padL = 36, padR = 12, padT = 14, padB = 24;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const vals = data.map(d => d[yKey]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = (max - min) || 1;
  const pad = range * 0.2;
  const ymin = min - pad;
  const ymax = max + pad;
  const yRange = ymax - ymin;
  const n = data.length;
  const step = w / (n - 1);
  const pts = data.map((d, i) => [padL + i * step, padT + h - ((d[yKey] - ymin) / yRange) * h]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${padL + w},${padT + h} L${padL},${padT + h} Z`;
  const yTicks = [ymax, (ymax+ymin)/2, ymin];

  const [hover, setHover] = React.useState(null);
  const wrapRef = React.useRef(null);
  const svgRef = React.useRef(null);

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
      <svg ref={svgRef} width={width} height={height} style={{display:'block', cursor:'crosshair'}}>
        {yTicks.map((t, i) => {
          const y = padT + (i / 2) * h;
          return (
            <g key={i}>
              <line x1={padL} x2={padL + w} y1={y} y2={y} stroke="var(--border)" strokeDasharray="1 3"/>
              <text x={padL - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-subtle)">
                {t.toFixed(1)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={padL + i * step} y={height - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-subtle)">
            {d.date}
          </text>
        ))}
        <path d={area} fill={fill}/>
        <path d={path} fill="none" stroke={color} strokeWidth="1.5"/>
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover?.idx===i ? 5 : 3} fill="var(--bg)" stroke={color} strokeWidth="1.5"/>
        ))}
        {hover && (
          <line x1={pts[hover.idx][0]} x2={pts[hover.idx][0]} y1={padT} y2={padT+h}
            stroke="var(--fg)" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"/>
        )}
      </svg>
      {hover && (
        <div style={{
          position:'absolute',
          left: hover.mx + 14,
          top: hover.my - 10,
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6,
          boxShadow:'0 6px 20px rgba(0,0,0,0.12)', padding:'9px 12px', pointerEvents:'none', zIndex:10, whiteSpace:'nowrap'
        }}>
          <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginBottom:6, letterSpacing:'0.06em'}}>{data[hover.idx].date}</div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{width:8, height:8, borderRadius:'50%', background:color, flexShrink:0}}/>
            <span className="mono tnum" style={{fontSize:15, fontWeight:600, color}}>{vals[hover.idx]}{unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Horizontal stacked bar for adesão breakdown
function StackBar({ segments, height = 8, radius = 4 }) {
  const total = segments.reduce((s,x) => s + x.value, 0);
  return (
    <div style={{display:'flex', height, borderRadius:radius, overflow:'hidden', background:'var(--surface-2)'}}>
      {segments.map((s, i) => (
        <div key={i} title={`${s.label}: ${s.value}`} style={{
          flex: s.value,
          background: s.color
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, { Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar });
