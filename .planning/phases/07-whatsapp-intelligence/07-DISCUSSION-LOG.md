# Phase 7: WhatsApp Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 07-whatsapp-intelligence
**Areas discussed:** Integração com IA, Arquitetura de webhook, Modelo de dados e extração, Ativação e experiência do paciente

---

## Integração com IA

### Q1: Abordagem de IA para processar mensagens

| Option | Description | Selected |
|--------|-------------|----------|
| Chamadas LLM diretas | Enviar mensagem + contexto do plano. LLM classifica intenção e responde/extrai em uma chamada. | ✓ |
| Pipeline multi-etapa | Classificação, extração, e resposta em etapas separadas. | |
| Agentes / function calling | Tool calling para LLM decidir quando extrair vs. responder. | |

**User's choice:** Chamadas LLM diretas (Recommended)
**Notes:** Simplicidade é prioridade. Única chamada LLM resolve classificação + extração/ou/resposta.

### Q2: Provedor de LLM

| Option | Description | Selected |
|--------|-------------|----------|
| Ollama Cloud | Já usado no AI reviewer. Evita diversificar provedores. | ✓ |
| Provedor externo dedicado | OpenAI, Claude, DeepSeek — possível qualidade melhor para pt-BR. | |
| OpenCode decide | Deixar pesquisador/planner definir baseado em custo/latência/qualidade. | |

**User's choice:** Ollama Cloud inicialmente, mas arquitetura preparada para migrar. Ollama tem limite por instância rodando — limitado para produção.
**Notes:** A arquitetura DEVE abstrair o provedor atrás de uma interface. Migração futura deve ser config change apenas, não code change.

### Q3: Contexto do plano no prompt

| Option | Description | Selected |
|--------|-------------|----------|
| Plano completo no prompt | Refeições, opções, porções, macros, extras — tudo enviado. | |
| Busca semântica / RAG | Indexar alimentos para busca. LLM recebe só partes relevantes. | |
| Contexto resumido | Objetivo, faixas de macro, lista de extras. Mais barato e rápido. | |

**User's choice:** Contexto resumido como base, plano completo SOB DEMANDA (quando paciente pergunta algo específico do plano).
**Notes:** O paciente vai usar a IA como auxiliador humano, não pergunta-resposta. A IA tem base nos dados do nutricionista, mas nem sempre vai ser possível responder só com o plano. Exemplo: paciente informa "carne cozida no almoço" — se não está no plano, a IA NÃO repreende. Pergunta quantidade, sugere cortes menos gordurosos, evitar caldo gorduroso. Abordagem de redução de danos.

### Q4: Extração e resposta — mesma chamada ou separadas?

| Option | Description | Selected |
|--------|-------------|----------|
| Única chamada LLM | Mensagem → LLM decide se é dúvida ou refeição → extrai e/ou responde. | ✓ |
| Duas chamadas | Extrair refeição + gerar resposta separadas. Validação intermediária. | |

**User's choice:** Única chamada LLM (Recommended)

---

## Arquitetura de webhook

### Q5: Estrutura do endpoint de webhook

| Option | Description | Selected |
|--------|-------------|----------|
| Endpoint único público | Um endpoint recebe todos webhooks. Backend faz lookup paciente por telefone. | ✓ |
| Endpoint por instância/nutri | Cada instância Evolution API tem token diferente. Mais seguro, mais complexo. | |

**User's choice:** Endpoint único público (Recommended)

### Q6: Segurança do webhook

| Option | Description | Selected |
|--------|-------------|----------|
| HMAC / signature | HMAC no payload — compartilhado entre backend e Evolution API. | ✓ |
| API key em header | Token fixo no header. Simples, mais frágil. | |
| IP whitelist | Aceitar apenas IPs conhecidos. Frágil — IPs podem mudar. | |

**User's choice:** HMAC / signature (Recommended)

### Q7: Síncrono ou assíncrono

| Option | Description | Selected |
|--------|-------------|----------|
| Processamento síncrono | Receber → processar IA → responder. Webhook caller espera. | |
| Processamento assíncrono | Receber → enfileirar → responder 200 → worker processa → envia resposta. | ✓ |

**User's choice:** Processamento assíncrono (Recommended)

### Q8: Mecanismo de fila

| Option | Description | Selected |
|--------|-------------|----------|
| Fila em memória | Spring @Async + ThreadPool. Simples, sem dependência extra. | |
| Fila externa (Redis/RabbitMQ) | Fila persistente. Mensagens sobrevivem a restart. | |
| OpenCode decide | Deixar pesquisador/planner definir. | |

**User's choice:** Fila externa (Redis/RabbitMQ)

### Q9: Redis/RabbitMQ — agora ou depois?

| Option | Description | Selected |
|--------|-------------|----------|
| Agora | Implementar fila externa desde o início. | ✓ |
| Deferir | Começar com @Async em memória, migrar quando necessário. | |

**User's choice:** Agora
**Notes:** Redis preferido para fila (mais simples que RabbitMQ, também útil como cache futuramente).

---

## Modelo de dados e extração

### Q10: Onde armazenar dados de WhatsApp

| Option | Description | Selected |
|--------|-------------|----------|
| Reaproveitar EpisodeHistoryEvent | eventType='WHATSAPP_MESSAGE', metadataJson armazena payload. | |
| Tabelas dedicadas | conversation, message, extraction_meal — separação clara, consultas diretas. | ✓ |
| OpenCode decide | Deixar pesquisador/planner decidir. | |

**User's choice:** Tabelas dedicadas (Recommended)

### Q11: Extração autoritativa ou com revisão

| Option | Description | Selected |
|--------|-------------|----------|
| Extração é autoritativa | LLM extrai → salva direto na timeline como confirmed. Paciente vê na resposta. | ✓ |
| Extração com revisão do nutricionista | Dados marcados pendentes → nutricionista revisa → confirma. Adiciona atrito. | |

**User's choice:** Extração é autoritativa (Recommended)

### Q12: Correção de extração errada

| Option | Description | Selected |
|--------|-------------|----------|
| Correção manual | Nutricionista clica "Corrigir extração" → edita dados → salva. ExtractionEditor já existe. | ✓ |
| Re-extração via IA | IA tenta extrair de novo com prompt revisado. | |
| Ambos | Manual como padrão + opção de re-extração. | |

**User's choice:** Correção manual (Recommended)

---

## Ativação e experiência do paciente

### Q13: Como funciona a ativação

| Option | Description | Selected |
|--------|-------------|----------|
| Link único por paciente | Nutricionista gera link → paciente clica → abre WhatsApp. Token reutilizável. | ✓ |
| Link expirável | Link que expira em 24h. Precisa gerar novo se perder. | |
| Número direto (zero-setup) | Nutricionista informa número. Paciente manda mensagem. Backend associa. | |

**User's choice:** Link único por paciente, MAS com preocupação: "tem como validarmos se esse link + número do paciente ativo? Não seria interessante o paciente informar esse link para outras pessoas e elas usarem."
**Notes:** Preocupação válida. O link é só conveniência (atalho wa.me). A autenticação real é: backend só responde via IA se o número do remetente bater com Patient.whatsapp. O link não autentica ninguém.

### Q14: Como garantir que o link não seja usado por outra pessoa

| Option | Description | Selected |
|--------|-------------|----------|
| Número pré-cadastrado | Link é atalho wa.me. Backend só responde se número bater com Patient.whatsapp. | ✓ |
| Token + verificação web | Link contém JWT → página web verifica token → associa WhatsApp → redireciona. Mais seguro, adiciona etapa. | |

**User's choice:** Número pré-cadastrado (Recommended)

### Q15: Primeira interação

| Option | Description | Selected |
|--------|-------------|----------|
| IA inicia a conversa | Paciente manda mensagem → IA se apresenta com saudação contextual. | ✓ |
| Mensagem fixa de boas-vindas | Template fixo. Consistente, impessoal. | |
| Sem mensagem de boas-vindas | IA só responde quando perguntam. Paciente inicia. | |

**User's choice:** IA inicia a conversa (Recommended)

### Q16: Nutricionista vê conversas brutas ou só dados extraídos?

| Option | Description | Selected |
|--------|-------------|----------|
| Só dados extraídos | Timeline mostra refeições extraídas. Conversas brutas não visíveis. | ✓ |
| Dados extraídos + resumo da IA | Timeline + resumo semanal + mensagens que precisam de atenção. | |
| Conversas completas visíveis | Histórico completo disponível. Transparência total. | |

**User's choice:** Só dados extraídos (Recommended)
**Notes:** Preserva o princípio do produto: "nutricionista vê resultados, não conversas."

---

## OpenCode's Discretion

Areas onde o usuário explicitamente delegou ao OpenCode:
- Schemas exatos das tabelas (WhatsAppMessage, WhatsAppResponse, MealExtraction)
- Prompt engineering do LLM (system prompt, contexto, formato de output)
- Evolution API Docker Compose config
- Redis queue implementation details
- HMAC signature verification implementation
- Normalização de número de telefone
- UI de link de ativação
- Dashboard WhatsApp KPIs
- Manuseio de mensagens de áudio/foto
- Error recovery quando Evolution API send-message falha

## Deferred Ideas

- WhatsApp conversation history view (WA-06) — v2
- AI-generated weekly patient summary (WA-07) — v2
- Manual nutritionist intervention (WA-08) — v2
- Multi-instance Evolution API — avaliar após shared-number provado
- Patient-initiated activation — v1 requer pre-registro
- Audio transcription / photo analysis — v2
- WebSocket/SSE real-time updates — v1 usa polling
- Provider migration mechanism (hot-swap, A/B test) — arquitetura preparada, migração é manual
