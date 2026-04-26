---
phase: 06
slug: dashboard-biometry
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-24
---

# Phase 06 — UI Design Contract

> Visual and interaction contract for the dashboard and biometry surfaces in Phase 06.
> Generated locally as a fallback because GSD UI subagents are unavailable in this runtime.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | local `components/icons` set |
| Font | `Inter Tight` + `JetBrains Mono` + `Instrument Serif` |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Dot indicators, inline icon gaps |
| sm | 8px | Compact controls, chip padding, field gaps |
| md | 16px | Default card padding and component spacing |
| lg | 24px | Section padding, page blocks |
| xl | 32px | Layout gutters on desktop pages |
| 2xl | 48px | Large panel rhythm, page top breathing room |
| 3xl | 64px | Major section separation only |

Exceptions: 10px and 12px are allowed for mono labels, table density, and chart legends already established in the migrated UI.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 10.5px-12px | 500-600 | 1.3 |
| Heading | 22px-36px | 400-600 | 1.15-1.25 |
| Display | 34px | 500 | 1.0-1.1 |

Typography rules:
- Page titles stay in `Instrument Serif`, low weight, negative letter-spacing, and should feel editorial rather than dashboard-generic.
- Numeric metrics, chart legends, dates, and compact meta labels stay in `JetBrains Mono`.
- Form labels, helper text, and body copy stay in `Inter Tight`.
- Do not introduce a fourth font or a new typographic voice in this phase.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--bg)` / `#FEFCF6` light, `#0B0C0A` dark | App background, large canvas areas |
| Secondary (30%) | `var(--surface)` / `var(--surface-2)` | Cards, panels, tab content, grouped sections |
| Accent (10%) | `var(--sage)`, `var(--amber)`, `var(--coral)`, `var(--sky)` | Clinical state, metric emphasis, chart lines, deltas |
| Destructive | `var(--coral)` / `#FF6B4A` | Destructive actions and dangerous trend emphasis only |

Accent reserved for:
- patient status chips
- metric deltas and clinical signals
- evolution chart series
- empty/sparse state signaling when clinically meaningful

Color rules:
- Do not use lime as the dominant interaction color on dashboard/biometry surfaces in this phase; lime remains associated with AI/WhatsApp and should stay largely absent after removal of the WhatsApp block.
- Weight should read as neutral/ink.
- `% gordura` should stay amber-family.
- Lean mass should stay sage-family.
- Water stays sky-family.
- Historical read-only surfaces should look slightly quieter than active clinical editing surfaces by leaning on `surface-2`, muted text, and border hierarchy instead of adding new colors.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Nova avaliação` |
| Empty state heading | `Nenhuma avaliação registrada ainda` |
| Empty state body | `Registre a primeira avaliação para acompanhar evolução, comparar ciclos e enriquecer o contexto clínico do paciente.` |
| Error state | `Não foi possível carregar os dados agora. Tente novamente e, se o problema continuar, revise a conexão ou recarregue a página.` |
| Destructive confirmation | `Encerrar período`: `Este período ficará disponível apenas para consulta no histórico.` |

Copy rules:
- Keep all UI copy in pt-BR.
- Sound clinical, calm, and practical; avoid marketing tone inside authenticated screens.
- Historical episodes with little activity must use explicit, honest copy such as `Sem avaliação registrada no período` or `Sem registros clínicos relevantes neste ciclo`.
- Dashboard labels should describe current portfolio context, not future AI behavior.

---

## Screen Contract

### Dashboard Home
- Remove the WhatsApp activity card entirely.
- Keep the KPI row structure, but metrics must reflect real portfolio and biometry context.
- One of the dashboard surfaces must highlight recent evaluations, but the dashboard should still read as an overview of the nutritionist's current carteira.
- Patient cards remain compact and status-led, with no added visual clutter.
- Avoid making the dashboard feel like a reporting page; it should remain operational and skimmable.

### Biometria Tab
- The active episode is the only editable clinical workspace.
- The "Última avaliação" block stays prominent and immediately actionable.
- The biometric form keeps all planned sections visible in one flow, but the visual contract should clearly separate:
  - required core capture (`data`, `peso`, `% gordura`)
  - optional bioimpedance
  - optional skinfolds
  - optional perimetry
- Charts must privilege readability over novelty. Current `LineChart` and `MultiLineChart` behavior is a feature, not something to redesign.

### Histórico Tab
- Show only past episodes.
- Each past episode should read as a closed clinical snapshot.
- Opening an episode exposes plan, biometrics, and historical records in read-only mode.
- Sparse or short episodes are valid and must not look broken; they need deliberate “low-data” states.
- The active episode must never appear mixed with archived cycles in this tab.

---

## Interaction Contract

- After saving a biometric assessment, the UI should prompt manual status review instead of silently mutating status.
- Read-only historical views must feel visibly archival:
  - no primary save buttons
  - no editable inputs
  - no ambiguous affordances that look editable
- Drill-down into a past episode should always offer a clear way back to the current active workflow.
- Mobile behavior should preserve current responsive collapse patterns already present in `globals.css`; no new mobile navigation pattern is introduced here.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| local codebase only | `KPI`, `LineChart`, `MultiLineChart`, existing card/button/chip patterns | not required |

No third-party component registry should be introduced for this phase.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-24
