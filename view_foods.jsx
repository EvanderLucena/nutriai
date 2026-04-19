// Alimentos — catálogo reutilizável do nutricionista
const FOODS_CATALOG = [
  // Bases — macros por 100g, porções equivalentes opcionais
  { id:"f1",  type:"base", name:"Arroz integral cozido", category:"Carboidrato",
    per100:{ kcal:124, prot:2.6, carb:25, fat:1, fiber:2.7 },
    portions:[ {name:"1 colher de sopa", grams:20}, {name:"1 concha", grams:80}, {name:"1 xícara", grams:160} ],
    used:38 },
  { id:"f2",  type:"base", name:"Frango desfiado cozido", category:"Proteína",
    per100:{ kcal:165, prot:31, carb:0, fat:3.6, fiber:0 },
    portions:[ {name:"1 filé pequeno", grams:100}, {name:"1 filé médio", grams:150}, {name:"1 xícara", grams:140} ],
    used:52 },
  { id:"f3",  type:"base", name:"Batata-doce cozida", category:"Carboidrato",
    per100:{ kcal:86, prot:1.6, carb:20, fat:0.1, fiber:3 },
    portions:[ {name:"1 unidade pequena", grams:110}, {name:"1 unidade média", grams:180} ],
    used:29 },
  { id:"f4",  type:"base", name:"Ovo de galinha inteiro", category:"Proteína",
    per100:{ kcal:143, prot:13, carb:0.7, fat:9.5, fiber:0 },
    portions:[ {name:"1 unidade", grams:50} ],
    used:47 },
  { id:"f5",  type:"base", name:"Azeite extra-virgem", category:"Gordura",
    per100:{ kcal:884, prot:0, carb:0, fat:100, fiber:0 },
    portions:[ {name:"1 colher de chá", grams:5}, {name:"1 colher de sopa", grams:13} ],
    used:61 },
  { id:"f6",  type:"base", name:"Banana prata", category:"Fruta",
    per100:{ kcal:98, prot:1.3, carb:26, fat:0.1, fiber:2 },
    portions:[ {name:"1 unidade pequena", grams:85}, {name:"1 unidade média", grams:120} ],
    used:33 },
  { id:"f7",  type:"base", name:"Brócolis cozido", category:"Vegetal",
    per100:{ kcal:35, prot:2.4, carb:7, fat:0.4, fiber:3.3 },
    portions:[ {name:"1 xícara", grams:90} ],
    used:22 },
  { id:"f8",  type:"base", name:"Salmão grelhado", category:"Proteína",
    per100:{ kcal:208, prot:22, carb:0, fat:13, fiber:0 },
    portions:[ {name:"1 posta pequena", grams:100}, {name:"1 posta média", grams:150} ],
    used:18 },
  { id:"f9",  type:"base", name:"Feijão carioca cozido", category:"Carboidrato",
    per100:{ kcal:77, prot:4.8, carb:14, fat:0.5, fiber:8 },
    portions:[ {name:"1 concha pequena", grams:60}, {name:"1 concha média", grams:90} ],
    used:41 },
  { id:"f10", type:"base", name:"Queijo branco", category:"Proteína",
    per100:{ kcal:240, prot:18, carb:3, fat:17, fiber:0 },
    portions:[ {name:"1 fatia", grams:30} ],
    used:14 },
  { id:"f11", type:"base", name:"Aveia em flocos", category:"Carboidrato",
    per100:{ kcal:389, prot:17, carb:66, fat:7, fiber:11 },
    portions:[ {name:"1 colher de sopa", grams:15}, {name:"1 xícara", grams:90} ],
    used:27 },
  { id:"f12", type:"base", name:"Tofu firme", category:"Proteína",
    per100:{ kcal:144, prot:17, carb:3, fat:8, fiber:2 },
    portions:[ {name:"1 fatia", grams:80} ],
    used:9 },

  // Presets — porções prontas (já calculadas), arrasta e solta no plano
  { id:"p1",  type:"preset", name:"Frango desfiado · 100g", category:"Proteína",
    portionLabel:"100g · pronto", grams:100,
    nutrition:{ kcal:165, prot:31, carb:0, fat:3.6 },
    basedOn:"Frango desfiado cozido", used:44 },
  { id:"p2",  type:"preset", name:"Omelete 2 ovos + queijo branco", category:"Proteína",
    portionLabel:"1 unidade · ~130g", grams:130,
    nutrition:{ kcal:358, prot:34, carb:2, fat:22 },
    basedOn:"Ovos (2) + queijo branco 30g", used:25 },
  { id:"p3",  type:"preset", name:"Mix castanhas · 30g", category:"Gordura",
    portionLabel:"1 porção · 30g", grams:30,
    nutrition:{ kcal:185, prot:5, carb:6, fat:17 },
    basedOn:"Castanha-do-pará + amêndoa + caju", used:31 },
  { id:"p4",  type:"preset", name:"Whey protein baunilha · 1 scoop", category:"Proteína",
    portionLabel:"1 scoop · 30g", grams:30,
    nutrition:{ kcal:120, prot:24, carb:3, fat:1.5 },
    basedOn:"Growth Supplements — rotulado", used:19 },
  { id:"p5",  type:"preset", name:"Iogurte natural integral · 170g", category:"Proteína",
    portionLabel:"1 pote · 170g", grams:170,
    nutrition:{ kcal:102, prot:5, carb:7, fat:6 },
    basedOn:"Iogurte Vigor integral", used:12 }
];

const FOOD_CATEGORIES = ["Todos","Proteína","Carboidrato","Gordura","Vegetal","Fruta","Bebida","Outro"];

const FOODS_PAGE_SIZE = 12;

function FoodsPagination({ page, pages, total, pageSize, onChange }) {
  if (pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const nums = Array.from({length: pages}, (_, i) => i);
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', marginTop:8, borderTop:'1px solid var(--border)'}}>
      <div className="mono" style={{fontSize:11.5, color:'var(--fg-subtle)', letterSpacing:'0.04em'}}>
        {from}–{to} <span style={{color:'var(--fg-muted)'}}>de</span> {total}
      </div>
      <div style={{display:'flex', gap:4, alignItems:'center'}}>
        <button
          className="btn btn-ghost"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          style={{padding:'4px 8px', opacity: page===0 ? 0.35 : 1}}>
          ←
        </button>
        {nums.map(n => (
          <button key={n}
            onClick={() => onChange(n)}
            style={{
              width:28, height:28, borderRadius:5, fontSize:12,
              background: n===page ? 'var(--surface-2)' : 'transparent',
              border: n===page ? '1px solid var(--border)' : '1px solid transparent',
              color: n===page ? 'var(--fg)' : 'var(--fg-muted)',
              fontFamily:'var(--font-mono)'
            }}>
            {n + 1}
          </button>
        ))}
        <button
          className="btn btn-ghost"
          disabled={page === pages - 1}
          onClick={() => onChange(page + 1)}
          style={{padding:'4px 8px', opacity: page===pages-1 ? 0.35 : 1}}>
          →
        </button>
      </div>
    </div>
  );
}

function FoodsView({ setView }) {
  const [cat, setCat] = React.useState("Todos");
  const [q, setQ] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    setPage(0);
    return FOODS_CATALOG.filter(f => {
      if (cat !== "Todos" && f.category !== cat) return false;
      if (q && !f.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [cat, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / FOODS_PAGE_SIZE));
  const slice = filtered.slice(page * FOODS_PAGE_SIZE, (page + 1) * FOODS_PAGE_SIZE);

  return (
    <>
      <Topbar crumbs={["Workspace", "Alimentos"]}/>

      <div className="page" style={{padding:0}}>
        <div style={{padding:'24px 28px 16px', borderBottom:'1px solid var(--border)'}}>
          <div>
            <div className="eyebrow">Catálogo pessoal · reutilizável nos planos</div>
            <h1 className="serif" style={{fontSize:32, margin:'4px 0 6px', fontWeight:400, letterSpacing:'-0.02em'}}>Alimentos</h1>
          </div>

          {/* Search + filter + novo */}
          <div style={{marginTop:18, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
            <div className="search" style={{margin:0, flex:1, maxWidth:320}}>
              <IconSearch size={13}/>
              <input placeholder="Buscar no catálogo…" value={q} onChange={e=>setQ(e.target.value)}/>
            </div>
            <select value={cat} onChange={e=>setCat(e.target.value)} style={{padding:'7px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--fg)', fontSize:12.5, fontFamily:'var(--font-ui)'}}>
              {FOOD_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setCreating(true)}><IconPlus size={13}/> Novo alimento</button>
          </div>
        </div>

        <div style={{padding:'20px 28px 40px'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12}}>
            {slice.map(f => (
              f.type === "base" ? <FoodBaseCard key={f.id} food={f}/> : <FoodPresetCard key={f.id} food={f}/>
            ))}
            {filtered.length === 0 && (
              <div style={{gridColumn:'1 / -1', padding:'40px', textAlign:'center', color:'var(--fg-subtle)', fontSize:13}}>
                Nenhum alimento bate com esse filtro.
              </div>
            )}
          </div>
          <FoodsPagination page={page} pages={pages} total={filtered.length} pageSize={FOODS_PAGE_SIZE} onChange={setPage}/>
        </div>
      </div>

      {creating && <CreateFoodModal onClose={() => setCreating(false)}/>}
    </>
  );
}

function FoodBaseCard({ food }) {
  return (
    <div className="card" style={{display:'flex', flexDirection:'column'}}>
      <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:10}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
            <div className="chip" style={{padding:'1px 6px', fontSize:9.5}}>BASE</div>
            <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase'}}>{food.category}</div>
          </div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:'-0.005em'}}>{food.name}</div>
        </div>
        <button style={{color:'var(--fg-subtle)'}}><IconDots size={14}/></button>
      </div>
      <div style={{padding:'12px 16px'}}>
        <div className="eyebrow" style={{marginBottom:8}}>por 100g</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
          <MiniMacro label="Kcal" value={food.per100.kcal}/>
          <MiniMacro label="Prot" value={food.per100.prot + "g"} color="var(--sage-dim)"/>
          <MiniMacro label="Carb" value={food.per100.carb + "g"} color="#A0801F"/>
          <MiniMacro label="Gord" value={food.per100.fat + "g"} color="var(--sky)"/>
        </div>
      </div>
      {food.portions && food.portions.length > 0 && (
        <div style={{padding:'10px 16px 12px', borderTop:'1px solid var(--border)'}}>
          <div className="eyebrow" style={{marginBottom:6}}>Porções · {food.portions.length}</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
            {food.portions.map((p, i) => (
              <div key={i} style={{fontSize:11, padding:'3px 7px', border:'1px solid var(--border)', borderRadius:999, color:'var(--fg-muted)'}}>
                <span>{p.name}</span>
                <span className="mono tnum" style={{marginLeft:5, color:'var(--fg-subtle)'}}>{p.grams}g</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-2)', marginTop:'auto'}}>
        <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase'}}>usado em {food.used} planos</div>
        <button className="btn btn-ghost" style={{fontSize:11.5, padding:'3px 6px', color:'var(--fg-muted)'}}><IconEdit size={11}/> Editar</button>
      </div>
    </div>
  );
}

function FoodPresetCard({ food }) {
  return (
    <div className="card" style={{display:'flex', flexDirection:'column', borderColor:'rgba(156,191,43,0.3)'}}>
      <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:10}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
            <div className="chip ai" style={{padding:'1px 6px', fontSize:9.5}}><span className="d"/>PRESET</div>
            <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase'}}>{food.category}</div>
          </div>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:'-0.005em'}}>{food.name}</div>
          <div className="mono tnum" style={{fontSize:11, color:'var(--fg-muted)', marginTop:2}}>{food.portionLabel}</div>
        </div>
        <button style={{color:'var(--fg-subtle)'}}><IconDots size={14}/></button>
      </div>
      <div style={{padding:'12px 16px'}}>
        <div className="eyebrow" style={{marginBottom:8}}>valores calculados</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
          <MiniMacro label="Kcal" value={food.nutrition.kcal}/>
          <MiniMacro label="Prot" value={food.nutrition.prot + "g"} color="var(--sage-dim)"/>
          <MiniMacro label="Carb" value={food.nutrition.carb + "g"} color="#A0801F"/>
          <MiniMacro label="Gord" value={food.nutrition.fat + "g"} color="var(--sky)"/>
        </div>
      </div>
      <div style={{padding:'10px 16px', fontSize:11.5, color:'var(--fg-muted)', lineHeight:1.5, borderTop:'1px solid var(--border)'}}>
        <span className="mono" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--fg-subtle)', marginRight:6}}>BASE:</span>
        {food.basedOn}
      </div>
      <div style={{padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-2)', marginTop:'auto'}}>
        <div className="mono" style={{fontSize:10.5, color:'var(--fg-subtle)', letterSpacing:'0.04em', textTransform:'uppercase'}}>usado em {food.used} planos</div>
        <button className="btn btn-ghost" style={{fontSize:11.5, padding:'3px 6px', color:'var(--fg-muted)'}}><IconEdit size={11}/> Editar</button>
      </div>
    </div>
  );
}

function MiniMacro({ label, value, color }) {
  return (
    <div>
      <div className="mono" style={{fontSize:9.5, color:'var(--fg-subtle)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:2}}>{label}</div>
      <div className="mono tnum" style={{fontSize:14, fontWeight:500, color: color || 'var(--fg)', letterSpacing:'-0.01em'}}>{value}</div>
    </div>
  );
}

function CreateFoodModal({ onClose }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.4)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(560px, 100%)', maxHeight:'90vh', overflow:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Novo alimento · porção pronta</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>

        <div style={{padding:'18px 20px 20px', display:'flex', flexDirection:'column', gap:14}}>
          <Field label="Nome do alimento" placeholder="ex: Frango desfiado 100g"/>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <Field label="Categoria" kind="select" options={["Proteína","Carboidrato","Gordura","Vegetal","Fruta","Bebida","Outro"]}/>
            <Field label="Descrição da porção" placeholder="ex: 1 unidade · 100g"/>
          </div>

          <div className="divider"><span>Macros da porção</span></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10}}>
            <Field label="Kcal" placeholder="0" mono/>
            <Field label="Proteína (g)" placeholder="0" mono/>
            <Field label="Carboidrato (g)" placeholder="0" mono/>
            <Field label="Gordura (g)" placeholder="0" mono/>
            <Field label="Fibra (g)" placeholder="0" mono/>
          </div>

          <Field label="Notas · opcional" placeholder="ex: sem lactose, integral" kind="textarea"/>
        </div>

        <div style={{padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary"><IconCheck size={13}/> Salvar no catálogo</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, kind, options, mono }) {
  const common = {
    padding:'8px 10px',
    border:'1px solid var(--border)',
    borderRadius:6,
    fontSize:13,
    background:'var(--surface)',
    outline:'none',
    width:'100%',
    color:'var(--fg)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)'
  };
  return (
    <div style={{display:'flex', flexDirection:'column', gap:5}}>
      <div className="eyebrow">{label}</div>
      {kind === "select" ? (
        <select style={common} defaultValue="">
          <option value="" disabled>Selecione…</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : kind === "textarea" ? (
        <textarea placeholder={placeholder} rows={2} style={{...common, resize:'vertical', fontFamily:'var(--font-ui)'}}/>
      ) : (
        <input placeholder={placeholder} style={common}/>
      )}
    </div>
  );
}

Object.assign(window, { FoodsView });
