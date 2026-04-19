# NutriAI

## What This Is

Painel clínico para nutricionistas solo (Brasil) que gerencia pacientes, planos alimentares, catálogo de alimentos e insights — com IA respondendo ao paciente via WhatsApp com base no plano alimentar. Hoje é um protótipo funcional (HTML/CSS/JS puro, React 18 via CDN, dados mockados) e precisa migrar para produção: monorepo com frontend moderno (React+TypeScript+Vite+Tailwind), backend real (Java 21+Spring Boot+PostgreSQL), e containers Docker para deploy em VPS.

## Core Value

O nutricionista cria o plano alimentar e acompanha seus pacientes em um painel web, enquanto a IA responde ao paciente via WhatsApp usando o plano como base — tirando dúvidas e captando dados das refeições reais.

## Requirements

### Validated

<!-- Estas capacidades já existem no protótipo e precisam ser preservadas na migration -->

- ✓ Landing page com pricing (3 planos: Iniciante R$99,99, Profissional R$149,99, Ilimitado R$199,99)
- ✓ Login/Signup com fluxo de autenticação visual (cosmético, sem backend)
- ✓ Onboarding em 4 steps (carteira, plano, convite, pronto)
- ✓ Dashboard home com KPIs e grid de pacientes
- ✓ Lista de pacientes com filtros (status, busca), table/grid toggle, paginação
- ✓ Detalhe do paciente com 5 abas (Hoje, Plano, Biometria, Insights, Histórico)
- ✓ Editor de plano alimentar (refeições, opções, alimentos editáveis inline, adicionar/remover)
- ✓ Catálogo de alimentos (base por 100g + presets porcionados, busca, paginação)
- ✓ View de inteligência agregada com gráficos
- ✓ Sidebar colapsável com rail de ícones
- ✓ Tema claro/escuro
- ✓ Modais: novo paciente, editar paciente, nova biometria, adicionar alimento, adicionar refeição
- ✓ Visualizações SVG: Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar
- ✓ Timeline de refeições com extração inline
- ✓ Todas as telas em pt-BR

### Active

<!-- Escopo da migration para produção -->

- [ ] Migrar frontend de HTML/CSS/JS puro para React + TypeScript + Vite + Tailwind
- [ ] Criar backend com Java 21 + Spring Boot + PostgreSQL
- [ ] Substituir dados mockados por API REST real
- [ ] Implementar autenticação real (JWT, sessões, persistência)
- [ ] Configurar monorepo com /frontend, /backend, /docker + scripts raiz
- [ ] Dockerizar frontend (build estático Nginx) e backend (Spring Boot JAR)
- [ ] docker-compose para desenvolvimento local (front + back + postgres + evolution-api)
- [ ] Integrar Evolution API (WhatsApp gateway open-source, self-hosted)
- [ ] Fluxo IA WhatsApp: paciente recebe link, conversa com IA, IA registra refeições na timeline
- [ ] Gateway de pagamento real (Stripe ou Pagar.me)
- [ ] LGPD: consentimento, termos, privacidade de dados de paciente
- [ ] CI/CD automatizado (GitHub Actions → deploy VPS)
- [ ] Deploy: frontend em Vercel/CDN, backend em VPS com PostgreSQL

### Out of Scope

- Multi-nutricionista / clínicas — por enquanto isolation por nutricionista solo
- Mobile app — web-first, mobile depois
- Importar TACO — catálogo manual por enquanto
- Exportar PDF de inteligência — deferido
- Painel Admin — P1 futuro
- Recuperação de senha — P2
- Notificações globais (push, email) — P2
- Relatório estruturado do paciente — P2
- Checkout + pós-checkout (além do gateway) — P2

## Context

**Protótipo atual:**
- SPA single-file: `NutriAI.html` carrega 14 scripts JSX via Babel standalone in-browser
- Sem build step, sem bundler, sem módulos ES — componentes globais em `window`
- Estado todo em `useState` no App root, prop drilling profundo
- Dados mockados em `data.jsx` (12 pacientes, 1 com detalhe completo)
- CSS em `styles.css` (1726 linhas) com custom properties, tema light/dark, 3 fontes Google
- Visualizações SVG feitas à mão em `viz.jsx`
- Zero testes, zero API, zero persistência real

**Decisões de negócio já tomadas:**
- Público-alvo: nutricionistas solo (sem clínicas)
- Pricing: Iniciante R$99,99 (15 pacientes) · Profissional R$149,99 (30) · Ilimitado R$199,99
- Trial 30 dias, auto-renovação, cancelar quando quiser
- IA responde com base no plano alimentar — redução de danos, dieta flexível
- Alimentos porcionados: cadastrados uma vez, reutilizados em qualquer plano
- Nutricionista cadastra dados biométricos manualmente; IA captura alimentação do WhatsApp
- Evolução biométrica como timeline por consulta

**Infraestrutura alvo:**
- VPS simples (DigitalOcean, Hetzner ou similar)
- Frontend: deploy estático (Vercel ou Nginx no VPS)
- Backend: container Docker no VPS
- PostgreSQL: container ou managed no VPS
- Evolution API: container próprio no VPS
- CI/CD: GitHub Actions automatizado

## Constraints

- **Tech stack front**: React + TypeScript + Vite + Tailwind — decisão tomada, não negociável
- **Tech stack back**: Java 21 + Spring Boot + PostgreSQL — decisão tomada, não negociável
- **WhatsApp**: Evolution API (open-source, self-hosted) como gateway desde o início
- **Deploy separado**: Monorepo pra desenvolvimento, mas cada projeto gera imagem Docker independente
- **Preservar UI**: Telas já 90% prontas visualmente — não redesenhar, só migrar estrutura
- **Isolamento**: Cada nutricionista só vê seus pacientes (sem multi-tenancy de clínica)
- **Idioma**: Tudo em pt-BR
- **LGPD**: Compliance obrigatório (dados de saúde são sensíveis)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo com pastas + scripts (sem Turborepo/Nx) | 2 projetos não justificam tooling extra; simplicidade primeiro | — Pending |
| Deploy separado (front estático + back container) | Front pode ir pra Vercel/CDN, back fica no VPS; escala independente | — Pending |
| Evolution API como gateway WhatsApp | Open-source, self-hosted, muito usado no Brasil; custo zero de licença | — Pending |
| Gateway próprio desde o início | Controle total, sem dependência de terceiros pra core do produto | — Pending |
| 1 número WhatsApp compartilhado entre nutris | Funciona pra início (~10-20 nutris); escalar com múltiplas instâncias depois | — Pending |
| Self-service completo (onboarding sem vendas) | Escala sem time de vendas; trial 30 dias + cartão | — Pending |
| Payment gateway real (Stripe/Pagar.me) | Primeiros clientes precisam pagar; não adianta mockar | — Pending |
| Tailwind como substituto do CSS custom properties | Migração gradual possível; tokens existentes viram config do Tailwind | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 after initialization*