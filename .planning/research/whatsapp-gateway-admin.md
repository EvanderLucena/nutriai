# WhatsApp Gateway Admin — Arquitetura & Planejamento

> **Contexto:** Decisao do founder de operar com chips fisicos como gateway WhatsApp. Este documento captura a arquitetura de pool de numeros, painel de admin, fallback anti-ban, e estrategias de rate-limiting.
>
> **Modelo de Interacao:** O NutriAI NUNCA inicia conversa com o paciente. A IA apenas RESPONDE quando o paciente envia mensagem primeiro. Nao ha envio proativo, lembretes, ou broadcast. Isso reduz drasticamente o risco de ban e simplifica o rate limiting.

---

## 1. Visao Geral do Problema

O NutriAI precisa de 1 ou mais numeros de WhatsApp funcionando como **gateway unico** para todos os nutricionistas da plataforma.

### Requisitos do Founder

| # | Requisito | Motivacao |
|---|-----------|-----------|
| R1 | Painel de admin **SEPARADO** do NutriAI principal | O admin (fundador/empresa) gerencia a infra de WhatsApp, nao os nutricionistas |
| R2 | Pool de numeros (nunca 1 numero fixo por nutricionista) | Resiliencia: se um numero cair, os pacientes nao ficam orfaos |
| R3 | Fallback automatico quando numero toma ban | Troca de link sem acao do nutricionista (ideally) ou com acao minima |
| R4 | Dashboard de mensagens, rate limit, health | Visibilidade operacional para prevenir bans |
| R5 | O nutricionista NUNCA configura WhatsApp | Ele so copia o link de ativacao no perfil do paciente |

---

## 2. Arquitetura de Pool de Numeros

### 2.1 Modelo Conceitual

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP GATEWAY POOL                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Gateway #1   │  │ Gateway #2   │  │ Gateway #N   │     │
│  │ 55119999..   │  │ 55118888..   │  │ 55117777..   │     │
│  │ ● Ativo      │  │ ● Ativo      │  │ ⚠ Banido     │     │
│  │ 34 pacientes │  │ 28 pacientes │  │ 0 pacientes  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Pool Manager: aloca paciente → gateway com menor carga     │
│  Health Monitor: detecta ban → migracao automatica           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND NUTRIAI                              │
│  - Recebe webhook do gateway ativo                            │
│  - Resolve paciente por telefone (ja existe)                  │
│  - Envia resposta pelo gateway do paciente (via instanceName) │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Entidades Novas (Backend)

```sql
-- Tabela: whatsapp_gateway
CREATE TABLE whatsapp_gateway (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,          -- Numero DDD+numero (55119999887766)
    instance_name VARCHAR(50) NOT NULL,         -- Nome da instancia no Evolution Go
    evolution_instance_id VARCHAR(100),         -- UUID retornado pelo Evolution Go
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, BANNED, SUSPENDED, PENDING_QR
    max_patients INT DEFAULT 100,               -- Limite de pacientes por gateway
    daily_message_limit INT DEFAULT 3000,       -- Limite de msgs enviadas/dia
    current_patient_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    banned_at TIMESTAMP,
    ban_reason TEXT,
    region_ddd VARCHAR(2),                      -- DDD (ex: 11, 21, 31) para routing local
    UNIQUE (phone_number)
);

-- Tabela: patient_gateway_assignment
-- Liga paciente ao gateway ativo. Muda quando gateway cai.
CREATE TABLE patient_gateway_assignment (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patient(id),
    gateway_id UUID NOT NULL REFERENCES whatsapp_gateway(id),
    assigned_at TIMESTAMP NOT NULL,
    replaced_at TIMESTAMP,                    -- Quando foi trocado (fallback)
    previous_gateway_id UUID REFERENCES whatsapp_gateway(id),
    reason VARCHAR(50),                        -- INITIAL, FALLBACK_BAN, REASSIGN_LOAD
    UNIQUE (patient_id, gateway_id)            -- Um paciente so esta em 1 gateway por vez
);

-- Tabela: gateway_health_log
CREATE TABLE gateway_health_log (
    id UUID PRIMARY KEY,
    gateway_id UUID NOT NULL,
    event_type VARCHAR(30),                    -- MESSAGE_SENT, MESSAGE_RECEIVED, RATE_LIMIT_HIT, BAN_DETECTED, QR_EXPIRED, DISCONNECTED
    event_data JSONB,
    created_at TIMESTAMP
);
```

---

## 3. Fluxo de Fallback (Anti-Ban)

### 3.1 Cenario: Gateway toma ban

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Paciente   │     │  Gateway #2  │     │   Gateway #3      │
│  (Ana)       │     │  (BANNED)    │     │  (ACTIVE)         │
│  wa: 11999.. │     │  wa: 11888.. │     │  wa: 11777..      │
└──────┬───────┘     └──────┬───────┘     └────────┬──────────┘
       │                    │                      │
       │  "Oi, comi arroz"  │                      │
       │───────────────────>│                      │
       │                    │  ❌ Nao entrega       │
       │                    │  (banido)             │
       │                    │                      │
┌──────┴────────────────────┴──────────────────────┴──────────┐
│                    HEALTH MONITOR                             │
│  - Detecta falha de entrega / status DISCONNECTED            │
│  - Marca gateway #2 como BANNED                              │
│  - Executa FALLBACK para todos os 28 pacientes do #2        │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  FALLBACK ENGINE                                            │
│  1. Para cada paciente no gateway banido:                   │
│     a. Encontra gateway ativo com menor carga               │
│     b. Atualiza patient_gateway_assignment                  │
│     c. Gera NOVO link de ativacao (wa.me/55{novo_numero})   │
│     d. Marca paciente com "link_desatualizado = true"       │
│  2. Notifica nutricionista (email/in-app)                   │
│     "O link de WhatsApp do paciente {nome} foi atualizado.   │
│      Copie o novo link no perfil dele."                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 O que o Nutricionista ve

**Cenario ideal (auto-migracao):**
- O paciente manda mensagem pro numero antigo
- Nao chega (numero banido)
- Paciente reclama pro nutricionista: "parou de funcionar"
- Nutricionista entra no NutriAI → perfil do paciente → clica "Copiar link"
- **O link JA e o novo** (o sistema trocou automaticamente)
- Nutricionista envia novo link pro paciente
- Paciente clica → abre WhatsApp com novo numero → funciona

**Cenario fallback manual:**
- Se a auto-migracao falhar, o admin pode forcar a troca global de um gateway
- Botao no admin panel: "Reatribuir todos os pacientes do Gateway X"

---

## 4. Painel de Admin (Features)

### 4.1 Dashboard Principal

| Widget | Dados |
|--------|-------|
| **Gateway Health** | Lista de gateways com status (● Ativo, ⚠ Banido, 🟡 Pendente QR) |
| **Volume de Mensagens** | Grafico de barras: enviadas/recebidas por gateway, ultimas 24h/7d/30d |
| **Taxa de Resposta IA** | % de mensagens processadas com sucesso / % de falhas LLM |
| **Pacientes por Gateway** | Distribuicao de carga (evitar gateway sobrecarregado) |
| **Rate Limit Gauge** | Quao proximo cada gateway esta do limite diario |

### 4.2 Gerenciamento de Gateways

- **Adicionar Gateway**: Formulario com numero, instance_name, DDD. Gera QR code para scan.
- **Remover Gateway**: Reatribui pacientes para outro gateway antes de remover.
- **Ver Logs**: Health log por gateway (eventos de conexao, mensagens, bans).
- **Testar Conexao**: Envia mensagem de teste via gateway para validar funcionamento.

### 4.3 Alertas & Notificacoes

| Condicao | Acao |
|----------|------|
| Gateway #X enviou >80% do limite diario | Alerta amarelo no dashboard + email admin |
| Gateway #X DISCONNECTED por >5 min | Alerta vermelho + inicia fallback automatico |
| Gateway #X BANNED detectado | Alerta vermelho critico + fallback + notificacao nutricionistas afetados |
| LLM API retornando erros >10% | Alerta amarelo (nao e gateway, mas afeta respostas) |

---

## 5. Estrategias Anti-Ban

### 5.1 Rate Limiting (Evitar Ban)

```java
// Pseudo-codigo para RateLimiter por gateway
public class GatewayRateLimiter {
    
    // Limite: max 20 mensagens/minuto, burst 50
    private Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();
    
    public boolean canSend(String gatewayId) {
        RateLimiter limiter = limiters.computeIfAbsent(
            gatewayId, 
            k -> RateLimiter.create(20.0) // 20 permits/minuto
        );
        return limiter.tryAcquire();
    }
    
    // Se nao pode enviar, enfileira com delay
    public void enqueueWithDelay(String gatewayId, MessageTask task) {
        long delayMs = calculateBackoff(gatewayId);
        delayedQueue.schedule(task, delayMs, TimeUnit.MILLISECONDS);
    }
}
```

### 5.2 Regras de Ouro para Nao Tomar Ban

| # | Regra | Implementacao |
|---|-------|---------------|
| 1 | **Nunca enviar >20 msgs/min por gateway** | RateLimiter por instancia |
| 2 | **Delay humanizado entre respostas** | 1-3 segundos de delay aleatorio antes de enviar resposta da IA |
| 3 | **Nao responder em horario noturno** | Silencioso 22h-07h (ou resposta agendada para manha) |
| 4 | **Mensagem de saudacao no primeiro contato** | IA sempre manda "Oi! Sou o assistente virtual..." antes de extrair |
| 5 | **Nao enviar links suspeitos** | Respostas da IA nao contem URLs externos |
| 6 | **Respeitar resposta do usuario** | Se paciente mandar "parar" ou "sair", desabilitar IA para ele |
| 7 | **Monitorar reportes** | Se varios pacientes reportarem o numero, trocar preventivamente |

### 5.3 Deteccao Pre-Ban

Sinais de alerta que um gateway esta prestes a ser banido:
- Taxa de falha de entrega >5%
- Mensagens ficando como "sent" mas nunca "delivered"
- Status da instancia Evolution Go indica "disconnected" frequentemente
- Pacientes reclamando que "nao chegou a resposta"

Acao: **Migracao preventiva** — mover pacientes para outro gateway antes do ban total.

---

## 6. Pool Manager — Algoritmo de Alocacao

### 6.1 Quando um novo paciente e cadastrado

```java
public Gateway selectGatewayForPatient(String patientPhoneDdd) {
    List<Gateway> activeGateways = gatewayRepository.findByStatus("ACTIVE");
    
    // 1. Filtrar por DDD match (preferencia local)
    List<Gateway> dddMatch = activeGateways.stream()
        .filter(g -> g.getRegionDdd().equals(patientPhoneDdd))
        .collect(toList());
    
    List<Gateway> candidates = dddMatch.isEmpty() ? activeGateways : dddMatch;
    
    // 2. Ordenar por carga (menor patient_count primeiro)
    candidates.sort(Comparator.comparingInt(Gateway::getCurrentPatientCount));
    
    // 3. Verificar se gateway nao esta proximo do limite
    for (Gateway g : candidates) {
        if (g.getCurrentPatientCount() < g.getMaxPatients()) {
            return g;
        }
    }
    
    // 4. Se todos cheios, logar alerta e usar o de menor carga mesmo assim
    log.warn("All gateways near capacity! Consider adding more.");
    return candidates.get(0);
}
```

### 6.2 Reatribuicao de carga (Load Balancing)

Periodicamente (diario/semanal), o sistema pode rebalancear:
- Se Gateway A tem 90 pacientes e Gateway B tem 10
- Mover 30 pacientes de A → B
- Gerar novos links para os 30 pacientes movidos
- Notificar nutricionistas dos 30 pacientes

---

## 7. Custos Operacionais Estimados

| Item | Custo Inicial | Custo Mensal | Notas |
|------|---------------|--------------|-------|
| Chip + Plano basico | R$15-30/chip | R$15-30/chip | Plano pre-pago com dados minimos |
| Celular/Raspberry | R$0 (usar velho) ou R$300-500 | — | 1 dispositivo por chip |
| VPS para Evolution Go | — | US$10-20 | Pode rodar na mesma VPS do NutriAI |
| Painel de Admin | — | — | Codigo proprio, sem custo extra |
| **Total (1 gateway)** | **R$15-30** | **R$15-30** | Inicio |
| **Total (5 gateways)** | **R$75-150** | **R$75-150** | Escala regional |

---

## 8. Proximos Passos (para roadmap)

### Opcao A: Fase dedicada "WhatsApp Gateway Admin"

| Task | Estimativa | Dependencias |
|------|------------|--------------|
| Schema V20 (whatsapp_gateway, patient_gateway_assignment) | 1h | — |
| Backend: GatewayRepository, AssignmentService, PoolManager | 4h | Schema |
| Backend: FallbackEngine, HealthMonitor, RateLimiter | 6h | PoolManager |
| Backend: Admin REST API (CRUD gateways, dashboard stats) | 4h | — |
| Frontend: Admin Panel (React app separada ou rota /admin) | 8h | API |
| Frontend: Dashboard widgets, gateway status, alerts | 6h | Panel |
| Integracao: Notificacao de fallback para nutricionista | 2h | FallbackEngine |
| Tests: E2E de fallback, rate limit, gateway CRUD | 4h | Tudo |
| **Total estimado** | **~35h** | |

### Opcao B: Feature incremental

Nao criar fase dedicada. Adicionar como parte da Phase 08 ou 09:
- Comecar com 1 gateway (como esta hoje)
- Adicionar suporte a multiplos gateways quando necessario
- O painel de admin pode ser um projeto separado (monorepo admin/)

---

## 9. Decisoes a Tomar

| # | Decisao | Opcoes |
|---|---------|--------|
| D1 | Painel de Admin e parte do NutriAI ou app separada? | Rota `/admin` no frontend atual vs. repo separado `nutriai-admin/` |
| D2 | Fallback e automatico ou manual? | Auto-reatribuicao + notificacao vs. admin clicar "migrar" |
| D3 | Quantos gateways no lancamento? | 1 (custo zero) vs. 3 (resiliencia imediata) |
| D4 | Rate limiter no backend ou no Evolution Go? | Backend (mais controle) vs. Redis (distribuido) |
| D5 | Notificacao de fallback: email, in-app, ou WhatsApp? | In-app toast (mais barato) vs. email (mais confiavel) |

---

## 10. Referencias

- Evolution Go docs: https://docs.evolutionfoundation.com.br/evolution-go
- WhatsApp Business API (Meta): nao aplicavel para SaaS pequeno
- Anotacoes desta conversa: migracao Phase 07, arquitetura pool, custos operacionais

---

## 11. Modelo de Interacao: Apenas Respostas (Inbound-Only)

### 11.1 Principio Fundamental

O NutriAI **NUNCA envia mensagem proativa** para o paciente. A IA apenas responde quando o paciente inicia a conversa.

```
PACIENTE                    GATEWAY                    BACKEND                    IA
   |                           |                          |                      |
   | "Oi, comi arroz hoje"     |                          |                      |
   |---------------------------|                          |                      |
   |                           | POST /webhooks/whatsapp  |                      |
   |                           |-------------------------->|                      |
   |                           |                          | processa             |
   |                           |                          |--------------------->|
   |                           |                          |                      | gera resposta
   |                           |                          |<---------------------|
   |                           | POST /message/sendText   |                      |
   |                           | (resposta da IA)         |                      |
   | "Oi! Registrei: Arroz..." |                          |                      |
   |<--------------------------|                          |                      |
```

**Nao existe:**
- ❌ Lembretes de refeicao
- ❌ Broadcast de "Bom dia!"
- ❌ Mensagens agendadas
- ❌ Notificacoes push via WhatsApp

**So existe:**
- ✅ Paciente envia mensagem → IA responde

### 11.2 Impacto na Arquitetura

| Aspecto | Se fosse proativo | Como e (apenas respostas) |
|---------|-------------------|--------------------------|
| Rate limiting | Complexo (filas, scheduling, burst control) | Simples (throttle de respostas) |
| Risco de ban | Alto (WhatsApp detecta envio em massa) | **Baixissimo** (comportamento natural) |
| Volume de mensagens | Alto (nutricionista x pacientes x lembretes) | **Baixo** (so respostas a iniciativas) |
| Custos LLM | Alto (envios frequentes) | **Baixo** (so quando paciente puxa) |
| Percepao do paciente | "Chatbot chato" | **"Assistente util"** |

### 11.3 Rate Limiting Simplificado

Como so respondemos, o rate limiter e muito mais simples:

```java
// Apenas 1 regra: nao enviar resposta rapido demais
public class ResponseRateLimiter {
    
    // Minimo 2 segundos entre respostas do mesmo gateway
    private Map<String, Instant> lastResponseTime = new ConcurrentHashMap<>();
    
    public void beforeSending(String gatewayId) {
        Instant last = lastResponseTime.get(gatewayId);
        if (last != null) {
            long millisSinceLast = Duration.between(last, Instant.now()).toMillis();
            if (millisSinceLast < 2000) {
                // Espera o tempo restante
                Thread.sleep(2000 - millisSinceLast);
            }
        }
        lastResponseTime.put(gatewayId, Instant.now());
    }
}
```

**Nao precisa de:**
- Limite diario de mensagens (dificil atingir com so respostas)
- Fila complexa de mensagens
- Scheduling/cron jobs

### 11.4 Deteccao de Ban Simplificada

Sem envio proativo, os sinais de ban sao mais claros:

| Sinal | Significado |
|-------|-------------|
| Mensagens do paciente chegam, mas IA nao consegue responder (erro 4xx/5xx do Evolution) | Gateway provavelmente banido |
| Evolution Go retorna `instance disconnected` | Numero desconectado (chip sem sinal, ban, ou QR expirado) |
| Respostas da IA ficam como `sent` mas paciente diz que nao recebeu | Shadow ban parcial |

**Nao precisa monitorar:**
- Taxa de rejeicao de envio (hard bounces) — raro com respostas
- Volume diario — irrelevante

---

## 12. Referencias

- Evolution Go docs: https://docs.evolutionfoundation.com.br/evolution-go
- WhatsApp Business API (Meta): nao aplicavel para SaaS pequeno
- Anotacoes desta conversa: migracao Phase 07, arquitetura pool, modelo inbound-only, custos operacionais

---

*Documento criado em: 2026-05-06*
*Revisado em: 2026-05-06 (adicionado modelo inbound-only)*
*Por: OpenCode (agente), baseado em discussao com founder*
*Revisar quando: antes de priorizar a fase de gateway admin no roadmap*
