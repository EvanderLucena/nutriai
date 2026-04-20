# NutriAI — Mapa de Telas & Regras de Negócio

## Visão geral

O NutriAI tem **3 persona** com fluxos diferentes:

| Persona | Acesso | Objetivo |
|---------|--------|----------|
| **Administrador** (você) | Painel admin | Gerenciar nutris, infra, financeiro |
| **Nutricionista** | App principal (protótipo atual) | Gerenciar pacientes, planos, IA |
| **Paciente** | WhatsApp (via IA) | Reportar refeições, receber orientação |

---

## Tela Map — todas as telas do produto

### 1. Landing Page (`/`)
- Hero com proposta de valor
- Como funciona (3 passos)
- Pricing (planos)
- CTA: "Comece grátis por 14 dias"
- Depoimentos / social proof
- FAQ

### 2. Cadastro do Nutri (`/signup`)
- Nome completo
- E-mail
- Senha
- CRN (número + regional)
- Especialidade (opcional)
- Número de WhatsApp (dele, pra contato — NÃO o número da IA)
- Aceite de termos (LGPD)
- CTA: "Criar minha conta"
- Após cadastro → onboarding

### 3. Onboarding do Nutri (`/onboarding`)
- Step 1: "Conheça sua carteira" — upload de pacientes (CSV manual ou 1 a 1)
- Step 2: "Configure seu primeiro plano" — wizard simplificado
- Step 3: "Convide seus pacientes" — copia link WhatsApp pra cada paciente
- Step 4: "Pronto! A IA já está conversando"
- Pode pular e voltar depois

### 4. Login (`/login`)
- E-mail + senha
- "Esqueci minha senha"
- Lembrar me

### 5-12. App do Nutri (protótipo atual)
- `/dashboard` — Home/Visão geral ✅
- `/patients` — Pacientes ✅
- `/patient/:id` — Paciente individual ✅
- `/patient/:id/plans` — Planos alimentares ✅
- `/foods` — Catálogo de alimentos ✅
- `/insights` — Inteligência agregada ✅
- `/settings` — Ajustes (parcial, precisa expandir)
- `/billing` — Assinatura e pagamento

### 13. Painel Admin (`/admin`)
- Dashboard — nutris ativos, MRR, churn, uso
- Nutricionistas — lista, status, detalhe
- Instâncias WhatsApp — status, QR, números
- Financeiro — plano, faturamento, inadimplência
- Logs/Auditoria — ações sensíveis
- Config — variáveis do sistema

### 14. Tela de Pagamento (`/billing`)
- Plano atual
- Upgrade/Downgrade
- Cartão de crédito (Stripe/Asaas/Pagar.me)
- Histórico de faturas
- Cancelar assinatura

### 15. Tela de Ajustes do Nutri (`/settings`)
- Perfil (nome, CRN, foto, assinatura de e-mail)
- Horário de atendimento (configura quando a IA pode falar)
- Mensagem de boas-vindas (customizar o que a IA diz primeiro)
- Tema (claro/escuro) ✅ já existe
- Exportar dados

### 16. Tela "Convite do Paciente" (dentro do fluxo do nutri)
- Lista de pacientes com status "IA conectada: sim/não"
- Botão "Copiar link" → `wa.me/5511999999999?text=Olá, sou paciente da Dra. Helena`
- QR code opcional
- Status: aguardando / conectado / inativo
- Aviso: "Suas conversas com a IA são privadas. Seu nutricionista vê apenas os dados de alimentação."

---

## Regras de Negócio

### RN-01 — Autenticação do Paciente
- O paciente é autenticado pelo número de WhatsApp
- Apenas números cadastrados por um nutri ativo podem conversar com a IA
- Se o número não está na whitelist → mensagem automática de recusa
- Se o nutri está inadimplente → IA para de responder automaticamente

### RN-02 — Isolamento Multi-tenant
- Cada nutri só acessa seus próprios dados
- A IA só carrega contexto do plano do nutri responsável
- Nutris nunca veem dados de outros nutris
- Admin vê tudo (com logging de acesso)

### RN-02B — Privacidade da Conversa (Regra Central)
- O nutri **NUNCA** vê a conversa do paciente com a IA
- A conversa é privada — o paciente fala livremente sem medo de julgamento
- Do WhatsApp, o sistema **só extrai** dados estruturados de alimentação (refeições, quantidades, horários)
- O que o nutri vê: timeline de refeições extraídas, adesão, biometria — nunca o texto original
- O que o nutri **NÃO vê**: conteúdo das mensagens, contexto pessoal, rumores, desabafos
- Isso é um diferencial competitivo: o paciente é mais honesto sabendo que o nutri não lê
- A IA pode sinalizar alertas (ex: "paciente mencionou álcool", "possível transtorno alimentar") como metadados, sem revelar o texto
- LGPD: conversas são processadas e descartadas — só dados estruturados persistem

### RN-03 — Ciclo de Vida do Paciente na IA
- **Novo** → nutri cadastra, paciente ainda não falou com a IA
- **Conectado** → paciente mandou a 1ª mensagem, IA respondeu
- **Ativo** → paciente conversa regularmente (>3 msgs/semana)
- **Inativo** → >3 dias sem conversa, IA envia lembrete (1x/dia, máx 3 dias)
- **Arquivado** → nutri inativou, IA para de responder

### RN-04 — Limites por Plano
| Plano | Pacientes | Preço | Funcionalidades |
|-------|-----------|-------|-----------------|
| Free (trial) | 5 | R$0 (14 dias) | Completo, sem exportar PDF |
| Pro | 30 | R$97/mês | Completo |
| Clínica | Ilimitado | R$247/mês | Multi-nutri + API + relatórios avançados |

### RN-05 — Pagamento
- Cobrança recorrente (mensal)
- Gateway: Asaas ou Pagar.me (pra boleto + PIX + cartão)
- 14 dias grátis (não precisa de cartão pra trial)
- Inadimplência: +7 dias tolerância, depois IA para de responder
- Downgrade: pacientes acima do limite ficam readonly

### RN-06 — WhatsApp Gateway
- Infra: Evolution API (Baileys), self-hosted
- 1 número centralizado, gerenciado pelo admin
- Novos números adicionados quando volume exige
- QR code pairing: responsabilidade do admin
- Se conexão cai: alerta admin + notificação no app do nutri
- Backup/restore de sessão: automático

### RN-07 — Pipeline de IA
- Recebe mensagem do paciente via webhook
- Consulta plano + contexto do paciente no DB
- LLM (GPT-4o-mini ou equivalente) extrai refeição estruturada
- Resposta ao paciente: confirmação + orientação leve
- Dados estruturados salvos automaticamente na timeline
- Nutri vê extração em tempo real no painel

### RN-08 — LGPD / Regulamentação
- Termo de consentimento no cadastro do paciente
- Dados de saúde criptografados em repouso
- Direito de exclusão: paciente pode solicitar remoção
- Retenção mínima: 5 anos (exigência CFM prontuário)
- Log de acesso a dados sensíveis
- DPA (Data Processing Agreement) com provedores de IA

### RN-09 — Onboarding do Paciente via WhatsApp
- Nutri copia link personalizado e manda pro paciente
- Paciente clica → abre WhatsApp com mensagem pré-preenchida
- 1ª mensagem: IA se apresenta, confirma nome e nutri
- IA pede confirmação: "Você é paciente da Dra. Helena?"
- Confirmado → conversa começa, status muda pra "Conectado"
- Negado → "Entre em contato com seu nutricionista"

### RN-10 — Exportar PDF
- Disponível nos planos Pro e Clínica
- Gera PDF com header do consultório (nome, CRN, logo)
- Inclui: dados do paciente, plano por refeição, observações
- Rodapé com data e "Gerado por NutriAI"

### RN-11 — Canal Único do Paciente: WhatsApp
- O paciente **nunca** acessa o NutriAI por web/app
- Toda interação é via WhatsApp com a IA
- O paciente pode pedir pela IA:
  - "Me manda meu plano" → IA envia PDF do plano alimentar
  - "Qual o jantar de hoje?" → IA responde com a refeição do plano
  - "Dica pra lanche" → IA sugere com base no plano e extras autorizados
  - "O que comi ontem?" → IA recupera o registro da timeline
- O paciente **não** tem dashboard, login, app
- Isso reduz fricção: zero onboarding pro paciente, só conversa
- Sem desenvolvimento de app mobile — IA é a interface

---

## Telas que faltam no protótipo atual

| Prioridade | Tela | Complexidade |
|-----------|------|-------------|
| P0 | Landing Page | Média |
| P0 | Cadastro do Nutri | Baixa |
| P0 | Login | Baixa |
| P0 | Onboarding | Média |
| P1 | Painel Admin | Alta |
| P1 | Tela de Pagamento | Média |
| P1 | Ajustes do Nutri (expandir) | Baixa |
| P2 | Convite do Paciente | Baixa |
| P2 | Status IA no paciente | Baixa |
| P2 | Recuperação de senha | Baixa |
| P2 | Relatório do paciente | Média |
| P2 | Notificações globais | Baixa |
| P2 | Checkout + Pós-checkout | Média |
| P3 | Perfil público do Nutri | Média |
| ~~P3~~ | ~~Painel do paciente (web/app)~~ | Removido — paciente só interage via WhatsApp |
| P3 | Webhooks/Integrações | Média |
| P3 | Alertas da IA (metadados) | Média |
| P3 | Logs de auditoria (admin) | Média |

---

## Open Questions (precisam decisão)

1. Gateway de pagamento: Asaas vs Pagar.me vs Stripe?
2. Nome do número de WhatsApp: "NutriAI" ou nome do nutri?
3. A IA se apresenta como "sua assistente" ou como "NutriAI"?
4. Multi-moeda? Só BRL por enquanto?
5. Trial pede cartão ou não?
6. Período de retenção: 5 anos CFM ou mais?
7. ~~Quem responde se a IA erra a extração?~~ → Resolvido pela RN-02B: o nutri vê só os dados extraídos e pode corrigir manualmente. Nunca vê a conversa.
8. Notificações pro nutri: push, e-mail, ou só in-app?
9. A IA deve informar ao paciente que os dados são extraídos e compartilhados com o nutri? (transparência)
10. Se o paciente menciona algo de risco (suicídio, abuso), a IA quebra a privacidade e alerta o nutri? (obrigação ética)

---

## Próximos passos

1. Decidir open questions acima
2. Prototipar Landing Page + Cadastro + Login
3. Prototipar Painel Admin (mínimo viável)
4. Configurar Evolution API em VPS de teste
5. Provar de conceito: 1 paciente real → WhatsApp → IA → dados estruturados