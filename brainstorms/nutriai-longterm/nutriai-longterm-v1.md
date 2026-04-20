# NutriAI — Visão de Longo Prazo · v1

## Quick Context

NutriAI é um painel clínico para nutricionistas que acompanham pacientes via WhatsApp com extração de refeições por IA. Atualmente é um prototype funcional (single HTML + React/Babel CDN) com mock data, cobrindo carteira, paciente individual, planos alimentares, catálogo de alimentos e inteligência agregada. Todas as funcionalidades da TASKS.md foram implementadas; restam dois itens "out of scope" (Importar TACO, Exportar PDF). A sessão de hoje explora visão de longo prazo, conectando com outros projetos do usuário.

---

## Session Log

| Date       | Duration | Energy | Mode      | Methods Used           |
|------------|----------|--------|-----------|------------------------|
| 2026-04-19 | —        | Deep   | Connected | First Principles, Inversion, Pre-mortem |

---

## Open Questions

1. **Qual o modelo de negócio?** SaaS por nutricionista? Por paciente? Marketplace?
2. **A IA precisa ser propria ou wrapper sobre LLM?** Viabilidade de fine-tuning vs API.
3. **Regulamentação (LGPD/CFM)** — dados de saúde, consentimento, armazenamento.
4. **WhatsApp Business API** — custo, limites, aprovação da Meta.
5. **Multi-tenancy** — cada nutricionista é um tenant isolado?
6. **Conexão com outros projetos** — o que mais você está construindo?

---

## Current Thinking

### Estado atual do produto

O NutriAI hoje é um **protótipo de altíssima fidelidade** — visualmente completo, funcionalmente cobrindo o fluxo principal do nutricionista. Isso é notável: a lacuna entre "onde está" e "produto comercializável" é menor do que parece.

**O que funciona bem:**
- UX clínica autêntica (linguagem, bioimpedância, Pollock 7, perimetria)
- Fluxo plano → consumo → adesão está completo
- Editor de planos com múltiplas opções, catálogo, extras
- Visual system coeso (design tokens, dark mode, tipografia)
- Insights agregados da carteira

**O que é fachada (ainda):**
- Toda a camada de dados é mock (`data.jsx`, `ANA` object)
- "Extraído via WhatsApp" é hardcoded — não há integração real
- Persistência é `localStorage` para view/paciente apenas
- Sem autenticação, sem multi-usuário
- "IA" é texto estático, não há NLU/Pipeline real
- Exportar PDF é `window.print()` — funciona mas é rudimentar
- TACO import é manual no catálogo

### Camadas para ir de prototype → produto

Pensando em **First Principles**, o produto se decompe em camadas:

```
┌─────────────────────────────────────┐
│  CAMADA 5 · GO-TO-MARKET           │
│  Pricing, onboarding, marketing    │
├─────────────────────────────────────┤
│  CAMADA 4 · INTELIGÊNCIA           │
│  Pipeline de extração, LLM, fine-tune │
├─────────────────────────────────────┤
│  CAMADA 3 · COMUNICAÇÃO            │
│  WhatsApp Business API, templates  │
├─────────────────────────────────────┤
│  CAMADA 2 · APLICAÇÃO              │
│  Auth, CRUD, API, persistência     │
├─────────────────────────────────────┤
│  CAMADA 1 · INFRA                  │
│  Hosting, DB, CI/CD, observabilidade │
└─────────────────────────────────────┘
```

### Priorização estratégica (Inversion)

Em vez de "o que fazer primeiro?", perguntamos: **"o que precisa ser verdade para o produto funcionar?"**

1. **A extração por IA tem que funcionar** — sem isso, é só um planner bonito. O moat é a conversa → dados estruturados.
2. **WhatsApp tem que ser viável** — se a API da Meta for bloqueio, o produto morre. Validar logo.
3. **Dados precisam persistir** — sem backend, não há SaaS.

A sequência lógica: **Validar WhatsApp API → Construir pipeline de IA → Backend + Auth → Refatorar frontend → GTM**

---

## Ideas Inventory

### Raw
- App mobile para o paciente (React Native/Flutter)
- Integração com wearables (Apple Health, Google Fit)
- Marketplace de planos alimentares
- API pública para outros apps de saúde
- Compliance automático (gerar termo de consentimento LGPD)
- Dashboard para redes de clínicas (multi-nutri)
- Integração com laboratórios (exames sanguíneos)
- Tradução para ES/EN (mercado LATAM e US)

### Developing
- **TACO como database real** — Importar a Tabela Brasileira de Composição de Alimentos (TACO) completa. Transforma o catálogo de 17 itens em ~400+ alimentos com dados oficiais. Impacto direto na credibilidade clínica.
- **Pipeline de extração de refeições** — LLM (GPT-4o-mini ou similar) recebe mensagem do paciente, retorna JSON estruturado: `{meal, time, items: [{food, qty, kcal, prot, carb, fat}]}`. Precisa de few-shot examples + validação.
- **WhatsApp Business API integration** — Cloud API da Meta. Webhook para receber mensagens, template messages para onboarding do paciente, mensagem de prompt diário ("Bom dia! O que comeu no café?").

### Refined
- **SaaS modelo: R$97/mês por nutricionista + R$5/paciente ativo** — Baseado em pesquisa de mercado brasileiro. Nutri консультório cobra R$150-400/paciente/mês. Ferramenta que economiza 30min/dia vale R$97 easy.
- **PDF export profissional** — Hoje é window.print(). Evoluir para gerador de PDF clínico com header do consultório, logo, dados do paciente, planos por refeição, observações. Usar jsPDF ou API externa.

### Ready
- **Migrar frontend para Vite + React** — Sair do single-HTML-Babel é o primeiro passo técnico. Manter design, trocar build system.

### Parked
- _Nada estacionado ainda_

### Eliminated
- _Nada eliminado ainda_

---

## Decisions Made

1. **Prototype é bem-sucedido** — Todas as funcionalidades TASKS.md implementadas. O protótipo cumpriu seu papel: validar UX e fluxo clínico.
2. **Próximo passo lógico é backend + IA** — Não vale otimizar o frontend sem resolver a camada de dados e inteligência.

---

## Next Steps

1. **Validar WhatsApp Business API** — Criar conta de desenvolvedor, testar webhook, estimar custos por mensagem
2. **Provar de conceito da extração** — 10-20 mensagens reais de pacientes → LLM → JSON. Medir acurácia.
3. **Escolher stack de backend** — Sugerido: Next.js (App Router) + PostgreSQL + Prisma. Mantém React, adiciona API routes, auth (NextAuth), DB.
4. **Mapear LGPD/CFM** — O que é obrigatório para dados de saúde no Brasil? Termo de consentimento, criptografia, retenção.
5. **Conexão com outros projetos** — Perguntar ao usuário sobre portfólio para cross-pollination de ideias.

---

## The Overnight Test

> Se você tivesse que escolher apenas UMA coisa para validar amanhã — WhatsApp Business API ou pipeline de extração de IA — qual escolheria? E por quê?