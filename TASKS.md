# NutriAI — Tarefas pendentes

> Teste do AI reviewer — linha innocua pra gerar diff no PR

## Bugs ativos

- [x] `Editar plano` e `Novo registro > Plano alimentar` no topbar do PatientView chamam `setView('plans')` (rota removida). Corrigir para `setTab('plan')`.

---

## Fluxos sem destino (botões que não abrem nada)

- [x] **Corrigir extração** — Timeline · aba Hoje.
- [x] **Nova avaliação biométrica** — modal unificado com Bioimpedância, Pollock 7 dobras, Perimetria.
- [x] **Novo paciente** — modal: nome, nascimento, sexo, altura, objetivo, WhatsApp.
- [x] **Filtrar** — painel inline em Pacientes: status, objetivo, atividade. Badge com nº de filtros ativos.
- [ ] **Importar TACO** — Alimentos. Out of scope por agora.
- [ ] **Exportar PDF** — Inteligência. Out of scope por agora.

---

## Telas incompletas / placeholder

- [x] **Histórico** (aba do paciente) — registros agrupados por dia, seletor 7d/14d/30d.
- [x] **Notificações** — removido do sistema.

---

## PlansView — editor funcional

- [x] **Edição inline dos alimentos** — campos kcal/prot/carb/gord editáveis diretamente na tabela; nome e quantidade também editáveis.
- [x] **`···` por alimento** — menu inline com Editar e Remover.
- [x] **Adicionar alimento** — busca no catálogo (FOODS_CATALOG) com seleção e inserção na opção ativa.
- [x] **Adicionar refeição** — modal simples: nome, horário, meta de kcal/macros.
- [x] **Nova opção** — duplica a opção atual como ponto de partida, nome editável.

---

## Outros

- [x] **HomeView** — PatientGrid no final sem paginação.
- [x] **InsightsView** — CarteiraChart sem hover/tooltip.

---

## Responsividade

- [x] **Sidebar colapsável** — em telas `< 1200px` a sidebar recolhe automaticamente; botão fixo no topbar permite abrir/fechar manualmente em qualquer tamanho. Rail permanece sempre visível.

---

## Telas P0 — Fluxo público (pré-login)

- [x] **Landing Page** (`view_landing.jsx`) — hero, como funciona com mockup de chat realista (cenário Xtudo), seção "Como a IA responde" (4 princípios), seção funcionalidades (8 features), diferencial de privacidade, pricing, FAQ, CTA final, footer.
- [x] **Login** (`view_login.jsx`) — email + senha, lembrar, Google OAuth, "esqueci senha", link p/ cadastro.
- [x] **Cadastro do Nutri** (`view_signup.jsx`) — 2 steps: dados pessoais (nome, email, senha) + perfil profissional (CRN, regional, especialidade, WhatsApp, termos LGPD).
- [x] **Onboarding** (`view_onboarding.jsx`) — 4 steps: carteira de pacientes, configurar plano, convidar pacientes, pronto.
- [x] **Roteamento público/privado** — App renderiza Landing/Login/Signup quando desautenticado; app principal quando autenticado.

---

## Landing Page — Iterações concluídas

- [x] **Pricing atualizado** — 3 planos pra nutricionista solo (sem clínica): Iniciante R$99,99 (até 15 pacientes), Profissional R$149,99 (até 30), Ilimitado R$199,99 (ilimitado). Todos com as mesmas funcionalidades, só muda qtde de pacientes. Trial 30 dias + auto-renova + cancele quando quiser.
- [x] **"Como funciona" com mockups visuais** — chat WhatsApp realista (cenário Xtudo com redução de danos), timeline de extração fiél ao app real (hora, dot, chip "EXTRAÍDO IA", lista de itens, macros em grid), dashboard com métricas e barra de progresso.
- [x] **Seção "Como a IA responde"** — 4 princípios: consulta o plano primeiro, redução de danos sem julgamento, dieta flexível não rígida, você vê resultado não conversa.
- [x] **Seção funcionalidades** — 8 features: WhatsApp, privacidade, planos alimentares, alimentos porcionados, dashboard, timeline biométrica, gestão de pacientes, inteligência agregada.
- [x] **Mockup catálogo de alimentos porcionados** — tabela com busca, alimentos já porcionados (Frango grelhado 150g, Arroz 120g, Batata doce 200g, Ovo 2 un.), macros calculados.
- [x] **Mockup evolução biométrica** — gráfico SVG de peso/%gordura em 6 meses, legenda com deltas (-5,1 kg, -4,3 pp).

---

## Telas P1 — A fazer

- [ ] **Painel Admin** — dashboard, nutris, instâncias WhatsApp, financeiro, logs.
- [ ] **Tela de Pagamento** (`/billing`) — plano atual, upgrade/downgrade, cartão, faturas, cancelar.
- [ ] **Ajustes do Nutri** (`/settings`) — perfil, horário de atendimento, mensagem de boas-vindas, exportar dados (além do tema que já existe).

---

## Telas P2 — A fazer

- [ ] **Convite do Paciente** — lista com status IA, botão "Copiar link" WhatsApp.
- [ ] **Status IA no paciente** — badge conectado/inativo no PatientView.
- [ ] **Recuperação de senha** — fluxo "esqueci minha senha".
- [ ] **Relatório do paciente** — exportar dados estruturados.
- [ ] **Notificações globais** — push, email ou in-app.
- [ ] **Checkout + Pós-checkout** — integração com gateway de pagamento.

---

## Decisões de negócio registradas

- **Público-alvo:** apenas nutricionistas solo (sem clínicas/multi-nutri por enquanto)
- **Pricing:** Iniciante R$99,99 (15 pacientes) · Profissional R$149,99 (30 pacientes) · Ilimitado R$199,99 (ilimitado)
- **Trial:** 30 dias grátis com cartão cadastrado, auto-renovação, cancelar quando quiser
- **Todos planos = mesmas funcionalidades**, só muda a quantidade de pacientes
- **IA:** responde sempre com base no plano alimentar do paciente, nunca inventa; abordagem de redução de danos e dieta flexível
- **Alimentos porcionados:** cadastrados uma vez, reutilizados em qualquer plano
- **Timeline biométrica:** peso, dobras, perimetria acompanhados como timeline por consulta, com gráficos de evolução

---

## Code Quality — Próximos passos

### Alto valor ✅

- [x] **Coverage floors no CI** — JaCoCo `jacocoTestCoverageVerification` (INSTRUCTION 50%, BRANCH 30%) + vitest `coverage.thresholds` (10% lines, 20% functions/branches)
- [x] **`@PreAuthorize` em todos os controllers** — PatientController + AuthController (/logout, /me, /onboarding) + ArchUnit rule
- [x] **ArchUnit rules (6)** — controller↛repository, service↛controller, repository↛service, no package cycles, DTOs↛repositories, controllers must have @PreAuthorize
- [x] **Husky + lint-staged** — pre-commit: prettier on staged ts/tsx files. ESLint runs in CI.

### Valor médio

- [ ] **springdoc-openapi** — Swagger UI auto-gerado. Útil quando integração WhatsApp (Phase 7) precisar de contract.
- [ ] **PMD addon ao Checkstyle** — bugs como empty catch, `==` em strings. Depois que Checkstyle estiver estável.

### Parked (revisitar quando trigger acontecer)

- [ ] **Mutation testing** (PIT + StrykerJS) — quando suite >30 arquivos ou testes de IA fracos detectados
- [ ] **PostgreSQL RLS** — quando usuários reais chegarem ou auditoria LGPD formal
- [ ] **Audit logging** — quando dados reais de saúde em produção
- [ ] **Error Prone** (compilador Java) — depois que PMD estiver estável
- [ ] **SonarQube Community** — quando time crescer (hoje overhead > valor pra solo dev)

---

## Prioridade sugerida

1. ~~Edição inline dos alimentos (PlansView)~~ ✅
2. ~~`···` por alimento → editar/remover~~ ✅
3. ~~Adicionar alimento (busca no catálogo)~~ ✅
4. ~~Adicionar refeição / Nova opção~~ ✅
5. ~~Home — paginação do grid~~ ✅
6. ~~Insights — hover no gráfico~~ ✅
7. ~~Landing Page + Cadastro + Login + Onboarding~~ ✅
8. ~~Landing iterada: pricing, mockups, IA, funcionalidades~~ ✅
9. Painel Admin (mínimo viável)
10. Tela de Pagamento
11. Ajustes do Nutri