// Meal plan editor — refeições → opções → alimentos
const INITIAL_OPTIONS = [
  { name:"Opção 1 · Clássico", items:[
    {food:"Frango grelhado", qty:"150g", prep:"grelhado, sem óleo", kcal:248, prot:46, carb:0, fat:6},
    {food:"Arroz integral", qty:"4 col. sopa", prep:"cozido", kcal:165, prot:4, carb:35, fat:1},
    {food:"Feijão carioca", qty:"1 concha", prep:"cozido", kcal:76, prot:5, carb:14, fat:0},
    {food:"Salada verde", qty:"à vontade", prep:"crua, azeite 1 col.", kcal:90, prot:2, carb:6, fat:7},
    {food:"Azeite extra-virgem", qty:"1 col. chá", prep:"-", kcal:40, prot:0, carb:0, fat:5}
  ]},
  { name:"Opção 2 · Peixe", items:[
    {food:"Salmão", qty:"130g", prep:"assado", kcal:290, prot:32, carb:0, fat:18},
    {food:"Batata-doce", qty:"180g", prep:"cozida", kcal:155, prot:3, carb:36, fat:0},
    {food:"Brócolis refogado", qty:"1 xícara", prep:"refogado com alho", kcal:55, prot:4, carb:8, fat:1},
    {food:"Azeite extra-virgem", qty:"1 col. chá", prep:"-", kcal:40, prot:0, carb:0, fat:5}
  ]},
  { name:"Opção 3 · Vegetariano", items:[
    {food:"Tofu grelhado", qty:"150g", prep:"temperado, grelhado", kcal:180, prot:20, carb:4, fat:10},
    {food:"Quinoa", qty:"1/2 xícara", prep:"cozida", kcal:120, prot:4, carb:22, fat:2},
    {food:"Legumes assados", qty:"1 prato", prep:"abobrinha, cenoura, beterraba", kcal:110, prot:4, carb:20, fat:2},
    {food:"Castanhas-do-pará", qty:"3 unidades", prep:"-", kcal:95, prot:2, carb:2, fat:9}
  ]}
];

const INITIAL_MEALS = [
  { id:"cafe",    label:"Café da manhã", time:"07:00", kcal:380, prot:26, carb:28, fat:16 },
  { id:"lanche1", label:"Lanche manhã",  time:"10:00", kcal:210, prot:8,  carb:28, fat:8  },
  { id:"almoco",  label:"Almoço",        time:"12:30", kcal:620, prot:45, carb:62, fat:20 },
  { id:"lanche2", label:"Lanche tarde",  time:"15:30", kcal:240, prot:14, carb:32, fat:6  },
  { id:"jantar",  label:"Jantar",        time:"19:30", kcal:530, prot:36, carb:42, fat:22 },
  { id:"ceia",    label:"Ceia",          time:"22:00", kcal:220, prot:16, carb:14, fat:10 }
];

function PlansView({ setView }) {
  const [selectedMeal, setSelectedMeal] = React.useState("almoco");
  const [selectedOption, setSelectedOption] = React.useState(0);
  const [section, setSection] = React.useState("meals");
  const [dirty, setDirty] = React.useState(false);
  const [planTitle, setPlanTitle] = React.useState("Hipertrofia com manutenção de % gordura");
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [meals, setMeals] = React.useState(INITIAL_MEALS);
  const [options, setOptions] = React.useState(INITIAL_OPTIONS);
  const [addFoodOpen, setAddFoodOpen] = React.useState(false);
  const [addMealOpen, setAddMealOpen] = React.useState(false);
  const [extras, setExtras] = React.useState(INITIAL_EXTRAS);
  const [newFoodOpen, setNewFoodOpen] = React.useState(false);

  const markDirty = () => setDirty(true);

  const updateItem = (optIdx, itemIdx, key, val) => {
    setOptions(opts => opts.map((o, oi) => oi !== optIdx ? o : {
      ...o,
      items: o.items.map((it, ii) => ii !== itemIdx ? it : { ...it, [key]: key==='food'||key==='qty'||key==='prep' ? val : (Number(val)||0) })
    }));
    markDirty();
  };

  const removeItem = (optIdx, itemIdx) => {
    setOptions(opts => opts.map((o, oi) => oi !== optIdx ? o : {
      ...o, items: o.items.filter((_, ii) => ii !== itemIdx)
    }));
    markDirty();
  };

  const replaceItem = (optIdx, itemIdx, newItem) => {
    setOptions(opts => opts.map((o, oi) => oi !== optIdx ? o : {
      ...o, items: o.items.map((it, ii) => ii !== itemIdx ? it : newItem)
    }));
    setDirty(false);
  };

  const addItem = (optIdx, item) => {
    setOptions(opts => opts.map((o, oi) => oi !== optIdx ? o : {
      ...o, items: [...o.items, item]
    }));
    markDirty();
  };

  const addNewOption = () => {
    const currentOpt = options[selectedOption] || options[0];
    const newOpt = {
      name: `Opção ${options.length + 1} · Cópia`,
      items: currentOpt.items.map(it => ({ ...it }))
    };
    setOptions(opts => [...opts, newOpt]);
    setSelectedOption(options.length);
    markDirty();
  };

  const removeOption = (optIdx) => {
    if (options.length <= 1) return;
    setOptions(opts => opts.filter((_, i) => i !== optIdx));
    setSelectedOption(prev => Math.min(prev, options.length - 2));
    markDirty();
  };

  const updateOptionName = (optIdx, name) => {
    setOptions(opts => opts.map((o, oi) => oi !== optIdx ? o : { ...o, name }));
    markDirty();
  };

  const addMeal = (meal) => {
    setMeals(ms => [...ms, meal]);
    setSelectedMeal(meal.id);
    markDirty();
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');

    const mealBlocks = meals.map(m => {
      const opts = options.map(o => {
        if (!o.items.length) return '';
        const rows = o.items.map(it => `
          <li><strong>${it.food}</strong>${it.qty ? ' · ' + it.qty : ''}${it.prep && it.prep !== '-' ? ' <span class="prep">(' + it.prep + ')</span>' : ''}</li>
        `).join('');
        return `<div class="option"><div class="option-name">${o.name}</div><ul>${rows}</ul></div>`;
      }).join('');
      return `
        <div class="meal">
          <div class="meal-header">
            <span class="meal-label">${m.label}</span>
            <span class="meal-time">${m.time}</span>
          </div>
          ${opts}
        </div>`;
    }).join('');

    const extrasBlock = extras.filter(e => e.name).length ? `
      <div class="section-title">Opções extras</div>
      <ul class="extras-list">
        ${extras.filter(e => e.name).map(e => `
          <li>
            <strong>${e.name}</strong>${e.qty ? ' · ' + e.qty : ''}${e.category ? ' <span class="prep">(${e.category})</span>' : ''}
            ${e.note ? '<div class="extra-note">' + e.note + '</div>' : ''}
          </li>`).join('')}
      </ul>` : '';

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${planTitle}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; font-size: 13px; color: #111; padding: 40px 48px; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 24px; font-weight: normal; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #888; margin-bottom: 32px; font-family: -apple-system, sans-serif; }
        .meal { margin-bottom: 28px; break-inside: avoid; }
        .meal-header { display: flex; align-items: baseline; gap: 10px; border-bottom: 1.5px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
        .meal-label { font-size: 15px; font-weight: bold; }
        .meal-time { font-size: 11px; color: #888; font-family: monospace; }
        .option { margin-bottom: 10px; }
        .option-name { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #999; margin-bottom: 5px; font-family: -apple-system, sans-serif; }
        ul { list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 4px; }
        li { font-size: 13px; padding-left: 12px; position: relative; }
        li::before { content: "·"; position: absolute; left: 0; color: #aaa; }
        .prep { color: #888; font-style: italic; font-size: 12px; }
        .section-title { font-size: 13px; font-weight: bold; border-bottom: 1.5px solid #111; padding-bottom: 6px; margin: 32px 0 12px; }
        .extras-list li { margin-bottom: 8px; }
        .extra-note { font-size: 11.5px; color: #666; margin-top: 2px; padding-left: 0; font-style: italic; }
        @media print { body { padding: 20px 24px; } }
      </style>
    </head><body>
      <h1>${planTitle}</h1>
      <div class="meta">Ana Beatriz L. · ${new Date().toLocaleDateString('pt-BR')} · NutriAI</div>
      ${mealBlocks}
      ${extrasBlock}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const activeMeal = meals.find(m => m.id === selectedMeal) || meals[2];
  const activeOpt = options[selectedOption] || options[0];
  const activeOptIdx = selectedOption;
  const optTotals = activeOpt.items.reduce((a, x) => ({
    kcal: a.kcal + (Number(x.kcal)||0),
    prot: a.prot + (Number(x.prot)||0),
    carb: a.carb + (Number(x.carb)||0),
    fat:  a.fat  + (Number(x.fat) ||0),
  }), {kcal:0, prot:0, carb:0, fat:0});

  return (
    <div>
      <div style={{padding:'20px 28px 16px', borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap'}}>
          <div>
            <div className="eyebrow">PLANO ATUAL</div>
            {editingTitle ? (
              <input
                autoFocus
                value={planTitle}
                onChange={(e)=>{ setPlanTitle(e.target.value); setDirty(true); }}
                onBlur={()=>setEditingTitle(false)}
                onKeyDown={(e)=> e.key === "Enter" && setEditingTitle(false)}
                className="serif"
                style={{fontSize:24, margin:'4px 0 4px', fontWeight:400, letterSpacing:'-0.01em', background:'transparent', border:'none', borderBottom:'1px solid var(--fg)', padding:'0 0 2px', color:'var(--fg)', outline:'none', minWidth:420}}
              />
            ) : (
              <h2
                onClick={()=>setEditingTitle(true)}
                className="serif"
                style={{fontSize:24, margin:'4px 0 4px', fontWeight:400, letterSpacing:'-0.01em', cursor:'text'}}
                title="Clique para renomear">
                {planTitle}
              </h2>
            )}
            <div style={{fontSize:12, color:'var(--fg-muted)'}}>
              Criado 04 abr 2026 · próxima revisão 25 abr
            </div>
          </div>
          <div style={{display:'flex', gap:20}}>
            <DailyMacro label="Kcal · meta" value="2200" color="var(--ink-contrast)"/>
            <DailyMacro label="Proteína" value="140g" sub="0.9g/kg magra" color="var(--sage)"/>
            <DailyMacro label="Carboidrato" value="250g" sub="45% VET" color="var(--amber)"/>
            <DailyMacro label="Gordura" value="70g" sub="30% VET" color="var(--sky)"/>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn-ghost" onClick={exportPDF}>
                <IconDownload size={13}/> Exportar PDF
              </button>
              <button
                className="btn btn-primary"
                onClick={()=>setDirty(false)}
                disabled={!dirty}
                style={{opacity: dirty ? 1 : 0.55}}>
                <IconCheck size={13}/> Salvar
              </button>
            </div>
            <div className="mono" style={{fontSize:10, letterSpacing:'0.04em', color: dirty ? 'var(--amber)' : 'var(--fg-subtle)'}}>
              {dirty ? "ALTERAÇÕES NÃO SALVAS" : "SALVO · IA JÁ RESPONDE COM ESTE PLANO"}
            </div>
          </div>
        </div>

        <div style={{marginTop:16, padding:'10px 12px', background:'var(--surface-2)', borderRadius:6, fontSize:12, color:'var(--fg-muted)', lineHeight:1.5, display:'flex', gap:10}}>
          <span className="mono" style={{color:'var(--lime-dim)', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', flexShrink:0}}>OBSERVAÇÕES</span>
          <span>Evitar lactose. Preferir proteína magra à noite. Carne vermelha máx 2×/semana.</span>
        </div>

        <div style={{marginTop:14, display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:-17}}>
            {[
              {k:"meals", label:"Refeições do plano"},
              {k:"extras", label:"Opções extras · sem horário"}
            ].map(t => (
              <button key={t.k}
                onClick={()=>setSection(t.k)}
                style={{
                  padding:'10px 14px', fontSize:13,
                  color: section===t.k ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: section===t.k ? 600 : 400,
                  borderBottom: section===t.k ? '2px solid var(--fg)' : '2px solid transparent',
                  marginBottom:-1
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {section === "extras" ? <ExtrasSection extras={extras} setExtras={setExtras}/> : (
        <div style={{display:'grid', gridTemplateColumns:'320px 1fr', minHeight:620}}>
          {/* Meal list */}
          <div style={{borderRight:'1px solid var(--border)', padding:'16px 14px'}}>
            <div className="eyebrow" style={{padding:'0 6px 10px'}}>ESTRUTURA DO DIA</div>
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              {meals.map(m => {
                const active = selectedMeal === m.id;
                return (
                  <button key={m.id}
                    onClick={() => { setSelectedMeal(m.id); setSelectedOption(0); }}
                    style={{
                      padding:'12px 14px',
                      borderRadius:6,
                      border: active ? '1px solid var(--fg)' : '1px solid transparent',
                      background: active ? 'var(--surface)' : 'transparent',
                      textAlign:'left',
                      transition:'all 0.12s'
                    }}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
                      <span style={{fontSize:13, fontWeight: active ? 600 : 500}}>{m.label}</span>
                      <span className="mono tnum" style={{fontSize:11, color:'var(--fg-muted)'}}>{m.time}</span>
                    </div>
                    <div style={{display:'flex', gap:10, fontSize:10.5, color:'var(--fg-muted)'}} className="mono tnum">
                      <span>{m.kcal}kcal</span>
                      <span>P{m.prot}</span>
                      <span>C{m.carb}</span>
                      <span>G{m.fat}</span>
                      <span style={{marginLeft:'auto'}}>{m.options} opções</span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setAddMealOpen(true)}
                style={{padding:'12px 14px', borderRadius:6, border:'1px dashed var(--border-2)', color:'var(--fg-muted)', fontSize:12, marginTop:6}}>
                <IconPlus size={12} style={{verticalAlign:'-2px', marginRight:4}}/> Adicionar refeição
              </button>
            </div>
          </div>

          {/* Option editor */}
          <div style={{padding:'20px 24px', background:'var(--bg)'}}>
            <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18}}>
              <div>
                <div className="eyebrow">EDITANDO · {activeMeal.label.toUpperCase()} · {activeMeal.time}</div>
                <h2 className="serif" style={{fontSize:26, margin:'4px 0 0', fontWeight:400, letterSpacing:'-0.02em'}}>
                  {options.length} opções equivalentes
                </h2>
              </div>
            </div>

            {/* Option tabs */}
            <div style={{display:'flex', gap:6, marginBottom:18, flexWrap:'wrap'}}>
              {options.map((o, i) => (
                <OptionTab key={i} opt={o} active={selectedOption===i}
                  onClick={() => setSelectedOption(i)}
                  onRename={(name) => updateOptionName(i, name)}
                  onRemove={options.length > 1 ? () => removeOption(i) : null}/>
              ))}
              <button
                onClick={addNewOption}
                style={{padding:'7px 12px', borderRadius:6, border:'1px dashed var(--border-2)', background:'transparent', color:'var(--fg-muted)', fontSize:12.5}}>
                <IconPlus size={12} style={{verticalAlign:'-2px'}}/> Nova opção
              </button>
            </div>

            {/* Food items table */}
            <div className="card">
              <div style={{display:'grid', gridTemplateColumns:'2.2fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)'}}>
                {["Alimento","Quantidade","Preparo","Kcal","Prot","Carb","Gord",""].map((h,i) => (
                  <div key={i} className="eyebrow" style={{fontSize:10, textAlign: i>=3 && i<=6 ? 'right' : 'left'}}>{h}</div>
                ))}
              </div>
              {activeOpt.items.map((it, i) => (
                <PlanFoodRow key={i} item={it}
                  isLast={i === activeOpt.items.length - 1}
                  onChange={(key, val) => updateItem(activeOptIdx, i, key, val)}
                  onRemove={() => removeItem(activeOptIdx, i)}
                  onSave={(newItem) => replaceItem(activeOptIdx, i, newItem)}/>
              ))}
              <div style={{padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--surface-2)', display:'flex', gap:16}}>
                <button onClick={() => setAddFoodOpen(true)} style={{fontSize:12, color:'var(--fg-muted)'}}>
                  <IconPlus size={12} style={{verticalAlign:'-2px'}}/> Adicionar Alimento
                </button>
                <button onClick={() => setNewFoodOpen(true)} style={{fontSize:12, color:'var(--fg-subtle)'}}>
                  <IconPlus size={12} style={{verticalAlign:'-2px'}}/> Novo alimento
                </button>
              </div>
            </div>

            {/* Totals */}
            <div style={{marginTop:16, padding:'14px 18px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:16, alignItems:'center'}}>
              <div>
                <div className="eyebrow">TOTAL DA OPÇÃO</div>
                <div className="serif" style={{fontSize:18, letterSpacing:'-0.01em', marginTop:2}}>{activeOpt.name}</div>
              </div>
              <TotalCell label="Kcal" actual={optTotals.kcal} target={activeMeal.kcal}/>
              <TotalCell label="Proteína" actual={optTotals.prot} target={activeMeal.prot} unit="g" color="var(--sage)"/>
              <TotalCell label="Carboidrato" actual={optTotals.carb} target={activeMeal.carb} unit="g" color="var(--amber)"/>
              <TotalCell label="Gordura" actual={optTotals.fat} target={activeMeal.fat} unit="g" color="var(--sky)"/>
            </div>
          </div>

        </div>
        )}

      {addFoodOpen && (
        <AddFoodModal
          onClose={() => setAddFoodOpen(false)}
          onAdd={(item) => { addItem(activeOptIdx, item); setAddFoodOpen(false); }}/>
      )}
      {addMealOpen && (
        <AddMealModal
          onClose={() => setAddMealOpen(false)}
          onAdd={(meal) => { addMeal(meal); setAddMealOpen(false); }}/>
      )}
      {newFoodOpen && (
        <EditFoodModal
          item={{food:'', qty:'', prep:'', kcal:0, prot:0, carb:0, fat:0}}
          onClose={() => setNewFoodOpen(false)}
          onSave={(newItem) => { addItem(activeOptIdx, newItem); setNewFoodOpen(false); markDirty(); }}/>
      )}
    </div>
  );
}

// Editable row for a food item inside an option
function PlanFoodRow({ item, isLast, onChange, onRemove, onSave }) {
  const cellStyle = (color, isNum) => ({
    padding:'5px 7px', border:'1px solid transparent', borderRadius:5,
    fontSize:12.5, background:'transparent', outline:'none',
    color: color || 'var(--fg)', width:'100%',
    fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-ui)',
    textAlign: isNum ? 'right' : 'left',
    transition:'border-color 0.1s, background 0.1s'
  });

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const onFocusIn  = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)'; };
  const onFocusOut = e => { e.target.style.borderColor = 'transparent';   e.target.style.background = 'transparent'; };

  const inp = (key, color, isNum) => (
    <input
      value={item[key]}
      onChange={e => onChange(key, e.target.value)}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      style={cellStyle(color, isNum)}
    />
  );

  const menuItemStyle = (danger) => ({
    width:'100%', padding:'8px 14px', textAlign:'left',
    display:'flex', alignItems:'center', gap:8, fontSize:12.5,
    color: danger ? 'var(--coral)' : 'var(--fg)',
    background:'transparent', transition:'background 0.1s'
  });

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'2.2fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
      gap:10, padding:'8px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      alignItems:'center'
    }}>
      {inp('food', 'var(--fg)', false)}
      {inp('qty', 'var(--fg-muted)', false)}
      {inp('prep', 'var(--fg-muted)', false)}
      {inp('kcal', 'var(--fg)', true)}
      {inp('prot', 'var(--sage-dim)', true)}
      {inp('carb', '#A0801F', true)}
      {inp('fat', 'var(--sky)', true)}
      <div style={{position:'relative'}} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          title="Mais ações"
          style={{
            color: menuOpen ? 'var(--fg)' : 'var(--fg-subtle)',
            padding:4, display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius:4, background: menuOpen ? 'var(--surface-2)' : 'transparent',
            transition:'background 0.1s, color 0.1s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--surface-2)'; e.currentTarget.style.color='var(--fg)'; }}
          onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--fg-subtle)'; } }}>
          <IconDots size={13}/>
        </button>
        {menuOpen && (
          <div style={{
            position:'absolute', right:0, zIndex:20,
            ...(isLast ? {bottom:'calc(100% + 4px)'} : {top:'calc(100% + 4px)'}),
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,0.14)',
            minWidth:130, overflow:'hidden'
          }}>
            <button
              onClick={() => { setEditOpen(true); setMenuOpen(false); }}
              style={menuItemStyle(false)}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <IconEdit size={12}/> Editar
            </button>
            <button
              onClick={() => { onRemove(); setMenuOpen(false); }}
              style={menuItemStyle(true)}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <IconTrash size={12}/> Remover
            </button>
          </div>
        )}
      </div>
      {editOpen && (
        <EditFoodModal
          item={item}
          onClose={() => setEditOpen(false)}
          onSave={(newItem) => { onSave(newItem); setEditOpen(false); }}/>
      )}
    </div>
  );
}

// Option tab — click to select, double-click name to rename
function OptionTab({ opt, active, onClick, onRename, onRemove }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(opt.name);

  React.useEffect(() => { setVal(opt.name); }, [opt.name]);

  const commit = () => { setEditing(false); if (val.trim()) onRename(val.trim()); };

  return (
    <div style={{display:'flex', alignItems:'center',
      borderRadius:6,
      border: active ? '1px solid var(--fg)' : '1px solid var(--border)',
      background: active ? 'var(--ink)' : 'var(--surface)',
      overflow:'hidden'
    }}>
      <button
        onClick={onClick}
        onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        style={{
          padding:'7px 12px',
          color: active ? 'var(--paper)' : 'var(--fg)',
          fontSize:12.5, display:'flex', alignItems:'center', gap:6,
          background:'transparent'
        }}>
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key==='Enter') commit(); if (e.key==='Escape') { setEditing(false); setVal(opt.name); } }}
            onClick={e => e.stopPropagation()}
            style={{background:'transparent', border:'none', outline:'none', color:'inherit', fontSize:12.5, fontFamily:'var(--font-ui)', minWidth:80}}
          />
        ) : opt.name}
      </button>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remover opção"
          style={{
            padding:'4px 8px', color: active ? 'rgba(255,255,255,0.5)' : 'var(--fg-subtle)',
            borderLeft: '1px solid ' + (active ? 'rgba(255,255,255,0.15)' : 'var(--border)'),
            background:'transparent', display:'flex', alignItems:'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = active ? 'var(--paper)' : 'var(--coral)'}
          onMouseLeave={e => e.currentTarget.style.color = active ? 'rgba(255,255,255,0.5)' : 'var(--fg-subtle)'}>
          <IconX size={11}/>
        </button>
      )}
    </div>
  );
}

// Modal: editar alimento existente
function EditFoodModal({ item, onClose, onSave }) {
  const [food, setFood] = React.useState(item.food);
  const [qty,  setQty]  = React.useState(item.qty);
  const [prep, setPrep] = React.useState(item.prep);
  const [kcal, setKcal] = React.useState(item.kcal);
  const [prot, setProt] = React.useState(item.prot);
  const [carb, setCarb] = React.useState(item.carb);
  const [fat,  setFat]  = React.useState(item.fat);

  const handle = () => {
    onSave({ food, qty, prep,
      kcal: Number(kcal)||0,
      prot: Number(prot)||0,
      carb: Number(carb)||0,
      fat:  Number(fat) ||0 });
  };

  const field = (label, val, set, color, mono) => (
    <div style={{display:'flex', flexDirection:'column', gap:5}}>
      <div className="eyebrow">{label}</div>
      <input autoComplete="off" value={val} onChange={e => set(e.target.value)}
        style={{
          padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6,
          fontSize:13, background:'var(--surface)', outline:'none',
          color: color || 'var(--fg)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
          width:'100%', boxSizing:'border-box'
        }}
        onFocus={e => e.target.style.borderColor='var(--fg-muted)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}/>
    </div>
  );

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.4)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(460px, 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Editar alimento</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>
        <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', gap:12}}>
          {field("Alimento", food, setFood, 'var(--fg)', false)}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {field("Quantidade", qty, setQty, 'var(--fg-muted)', false)}
            {field("Preparo", prep, setPrep, 'var(--fg-muted)', false)}
          </div>
          <div className="divider"><span>Valores nutricionais</span></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            {field("Kcal", kcal, setKcal, 'var(--fg)', true)}
            {field("Prot (g)", prot, setProt, 'var(--sage-dim)', true)}
            {field("Carb (g)", carb, setCarb, '#A0801F', true)}
            {field("Gord (g)", fat, setFat, 'var(--sky)', true)}
          </div>
        </div>
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={!food.trim()} style={{opacity: food.trim() ? 1 : 0.45}}>
            <IconCheck size={13}/> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: adicionar alimento do catálogo
function AddFoodModal({ onClose, onAdd }) {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [qty, setQty] = React.useState("");

  const results = React.useMemo(() => {
    if (!q) return [];
    return FOODS_CATALOG.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }, [q]);

  const handleAdd = () => {
    if (!selected) return;
    const nutrition = selected.type === "preset"
      ? selected.nutrition
      : { kcal: selected.per100.kcal, prot: selected.per100.prot, carb: selected.per100.carb, fat: selected.per100.fat };
    onAdd({
      food: selected.name,
      qty: qty || (selected.type === "preset" ? selected.portionLabel : "100g"),
      prep: "-",
      kcal: nutrition.kcal,
      prot: nutrition.prot,
      carb: nutrition.carb,
      fat:  nutrition.fat,
    });
  };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.4)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(520px, 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Adicionar alimento</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>

        <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', gap:12}}>
          <div className="search" style={{margin:0}}>
            <IconSearch size={13}/>
            <input autoFocus placeholder="Buscar no catálogo…" value={q} onChange={e=>{setQ(e.target.value); setSelected(null);}}/>
          </div>

          {results.length > 0 && (
            <div style={{border:'1px solid var(--border)', borderRadius:6, overflow:'hidden'}}>
              {results.map(f => (
                <div key={f.id}
                  onClick={() => setSelected(f)}
                  style={{
                    padding:'10px 14px', cursor:'pointer',
                    background: selected?.id===f.id ? 'var(--surface-2)' : 'transparent',
                    borderBottom:'1px solid var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12
                  }}>
                  <div>
                    <div style={{fontSize:13, fontWeight: selected?.id===f.id ? 600 : 400}}>{f.name}</div>
                    <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.04em'}}>
                      {f.category} · {f.type === "preset" ? f.portionLabel : "por 100g"}
                    </div>
                  </div>
                  <div className="mono tnum" style={{fontSize:11.5, color:'var(--fg-muted)', flexShrink:0}}>
                    {f.type === "preset" ? f.nutrition.kcal : f.per100.kcal} kcal
                  </div>
                </div>
              ))}
            </div>
          )}
          {q && results.length === 0 && (
            <div style={{fontSize:12.5, color:'var(--fg-subtle)', textAlign:'center', padding:'12px 0'}}>Nenhum alimento encontrado.</div>
          )}

          {selected && (
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div className="eyebrow">Quantidade / descrição</div>
              <input
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder={selected.type === "preset" ? selected.portionLabel : "ex: 150g"}
                style={{padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'var(--surface)', outline:'none', color:'var(--fg)'}}
              />
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, padding:'10px 12px', background:'var(--surface-2)', borderRadius:6}}>
                {(['kcal','prot','carb','fat']).map(k => {
                  const n = selected.type==="preset" ? selected.nutrition : selected.per100;
                  return (
                    <div key={k}>
                      <div className="eyebrow" style={{fontSize:9}}>{k}</div>
                      <div className="mono tnum" style={{fontSize:14, fontWeight:600}}>{n[k]}{k!=='kcal'?'g':''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!selected} onClick={handleAdd} style={{opacity:selected?1:0.45}}>
            <IconPlus size={13}/> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: adicionar refeição
function AddMealModal({ onClose, onAdd }) {
  const [label, setLabel] = React.useState("");
  const [time, setTime] = React.useState("");
  const [kcal, setKcal] = React.useState("");
  const [prot, setProt] = React.useState("");
  const [carb, setCarb] = React.useState("");
  const [fat, setFat] = React.useState("");

  const valid = label.trim() && time;

  const handle = () => {
    if (!valid) return;
    onAdd({
      id: "meal_" + Date.now(),
      label: label.trim(),
      time,
      kcal: Number(kcal)||0,
      prot: Number(prot)||0,
      carb: Number(carb)||0,
      fat:  Number(fat)||0,
    });
  };

  const mf = (label, val, set, color, ph) => (
    <div style={{display:'flex', flexDirection:'column', gap:5, minWidth:0}}>
      <div className="eyebrow">{label}</div>
      <input value={val} onChange={e=>set(e.target.value)} placeholder={ph}
        style={{padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'var(--surface)', outline:'none', color: color || 'var(--fg)', fontFamily:'var(--font-mono)', width:'100%', boxSizing:'border-box'}}/>
    </div>
  );

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(11,12,10,0.4)', zIndex:200, display:'grid', placeItems:'center', padding:20}} onClick={onClose}>
      <div className="card" style={{width:'min(420px, 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Nova refeição</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:'4px 6px'}}><IconX size={14}/></button>
        </div>
        <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <div style={{display:'flex', flexDirection:'column', gap:5}}>
              <div className="eyebrow">Nome</div>
              <input autoFocus value={label} onChange={e=>setLabel(e.target.value)} placeholder="ex: Lanche pré-treino"
                style={{padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'var(--surface)', outline:'none', color:'var(--fg)'}}/>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:5}}>
              <div className="eyebrow">Horário</div>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}
                style={{padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'var(--surface)', outline:'none', color:'var(--fg)', fontFamily:'var(--font-mono)'}}/>
            </div>
          </div>
          <div className="divider"><span>Meta de macros · opcional</span></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {mf("Kcal", kcal, setKcal, 'var(--fg)', "0")}
            {mf("Prot (g)", prot, setProt, 'var(--sage-dim)', "0")}
            {mf("Carb (g)", carb, setCarb, '#A0801F', "0")}
            {mf("Gord (g)", fat, setFat, 'var(--sky)', "0")}
          </div>
        </div>
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--surface-2)'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid} onClick={handle} style={{opacity:valid?1:0.45}}>
            <IconPlus size={13}/> Criar refeição
          </button>
        </div>
      </div>
    </div>
  );
}

const INITIAL_EXTRAS = [
  { name:"Cerveja Ultra", qty:"350ml · lata", category:"Bebida alcoólica", kcal:99, prot:4, carb:2, fat:0, note:"Se paciente reportar consumo à noite, IA orienta hidratação extra e ajuste do lanche seguinte." },
  { name:"Chocolate 70% cacau", qty:"20g · 2 quadradinhos", category:"Doce/sobremesa", kcal:108, prot:2, carb:8, fat:8, note:"Opção aprovada como sobremesa ocasional. IA contabiliza no total diário." },
  { name:"Açaí puro", qty:"200g · pequeno", category:"Sobremesa/lanche", kcal:120, prot:1, carb:10, fat:7, note:"Sem granola nem xarope. IA sugere combinar com banana no lugar do açúcar." },
  { name:"Pizza muçarela", qty:"1 fatia · 110g", category:"Refeição social", kcal:265, prot:11, carb:30, fat:10, note:"Se paciente avisar jantar fora, IA orienta máx. 2 fatias + salada." },
  { name:"Vinho tinto seco", qty:"150ml · 1 taça", category:"Bebida alcoólica", kcal:125, prot:0, carb:4, fat:0, note:"Até 2× na semana. IA reforça água entre taças." }
];

function ExtrasSection({ extras, setExtras }) {
  const update = (i, key, val) => setExtras(ex => ex.map((e, idx) => idx !== i ? e : {
    ...e, [key]: ['name','qty','category','note'].includes(key) ? val : (Number(val)||0)
  }));
  const remove = (i) => setExtras(ex => ex.filter((_, idx) => idx !== i));
  const addBlank = () => setExtras(ex => [...ex, { name:'', qty:'', category:'', kcal:0, prot:0, carb:0, fat:0, note:'' }]);
  return (
    <div style={{padding:'20px 28px 28px'}}>
      <div className="card" style={{marginBottom:16}}>
        <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12}}>
          <IconSparkle size={14} style={{color:'var(--lime-dim)', flexShrink:0}}/>
          <div style={{fontSize:13, color:'var(--fg-muted)', lineHeight:1.5}}>
            Alimentos e bebidas <strong style={{color:'var(--fg)'}}>fora do plano estruturado</strong> que você pré-autoriza para a IA orientar
            quando o paciente mencionar. Não têm horário fixo — funcionam como parâmetros de contorno.
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap:8, padding:'8px 20px', borderBottom:'1px solid var(--border)'}}>
          {["Item","Porção","Categoria","Kcal","Prot","Carb","Gord",""].map((h,i) => (
            <div key={i} className="eyebrow" style={{fontSize:10, textAlign: i>=3 && i<=6 ? 'right' : 'left'}}>{h}</div>
          ))}
        </div>
        {extras.map((e, i) => {
          const inp = (key, color, mono, align) => (
            <input value={e[key]} onChange={ev => update(i, key, ev.target.value)}
              style={{padding:'3px 6px', border:'1px solid transparent', borderRadius:5, fontSize:12.5,
                background:'transparent', outline:'none', color: color||'var(--fg)', width:'100%',
                fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
                textAlign: align || 'left'}}
              onFocus={ev => ev.target.style.borderColor='var(--border)'}
              onBlur={ev => ev.target.style.borderColor='transparent'}/>
          );
          return (
            <div key={i} style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap:8, padding:'5px 20px', borderBottom: i === extras.length-1 ? 'none' : '1px solid var(--border)', alignItems:'center'}}>
              {inp('name', 'var(--fg)', false)}
              {inp('qty', 'var(--fg-muted)', true)}
              {inp('category', 'var(--fg-muted)', false)}
              {inp('kcal', 'var(--fg)', true, 'right')}
              {inp('prot', 'var(--sage-dim)', true, 'right')}
              {inp('carb', '#A0801F', true, 'right')}
              {inp('fat', 'var(--sky)', true, 'right')}
              <button onClick={() => remove(i)} style={{color:'var(--fg-subtle)', padding:4}}
                onMouseEnter={ev => ev.currentTarget.style.color='var(--coral)'}
                onMouseLeave={ev => ev.currentTarget.style.color='var(--fg-subtle)'}>
                <IconX size={12}/>
              </button>
            </div>
          );
        })}
        <div style={{padding:'12px 20px', background:'var(--surface-2)', borderTop:'1px solid var(--border)'}}>
          <button onClick={addBlank} style={{fontSize:12.5, color:'var(--fg-muted)'}}>
            <IconPlus size={12} style={{verticalAlign:'-2px'}}/> Adicionar Opção Extra
          </button>
        </div>
      </div>
    </div>
  );
}

function DailyMacro({ label, value, sub, color }) {
  return (
    <div style={{display:'flex', flexDirection:'column', minWidth:82}}>
      <div className="eyebrow">{label}</div>
      <div className="mono tnum" style={{fontSize:22, fontWeight:500, color, letterSpacing:'-0.02em', marginTop:2}}>{value}</div>
      {sub && <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)'}}>{sub}</div>}
    </div>
  );
}

function TotalCell({ label, actual, target, unit = "", color }) {
  const pct = actual / target;
  const ok = pct >= 0.9 && pct <= 1.1;
  return (
    <div>
      <div className="eyebrow">{label} · {target}{unit}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:6, marginTop:3}}>
        <div className="mono tnum" style={{fontSize:18, fontWeight:500, color: color || 'var(--fg)'}}>{actual}{unit}</div>
        <div className="mono tnum" style={{fontSize:11, color: ok ? 'var(--sage-dim)' : 'var(--amber)'}}>
          {pct >= 1 ? "+" : ""}{Math.round((pct - 1) * 100)}%
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlansView });
