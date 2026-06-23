# WhatsApp Gateway: Decisão Arquitetural Final

## Decisão

**Gateway escolhido: Evolution API (open-source, self-hosted)**

**Provedor:** Evolution API v2.3.x — Docker container, REST API sobre protocolo Baileys (WhatsApp Web)
**Repositório:** https://github.com/EvolutionAPI/evolution-api (~7.9k stars, ativo)
**Modelo:** Inbound-only (apenas respostas, nunca iniciamos conversa)
**Hardware:** chip físico (Vivo/Claro/TIM) hospedado em VPS ou Raspberry 24/7

---

## Histórico — tentativa de migração para API Oficial Meta (DESCARTADA)

Em 2026-05-06 registramos decisão de migrar para a **API Oficial do WhatsApp Business Platform (Meta)**, com argumentos de custo zero, zero risco de ban e sem hardware 24/7. **Esta decisão foi revertida** porque:

- **Aprovação Meta Business Manager não foi obtida** — founder não passou na verificação de identidade/business após múltiplas tentativas.
- **Setup indesejado para MVP solo** — Meta Business Manager exige verificação de negócio que é fricção alta para um produto em validação.
- **Bloqueio de roadmap** — Fase 10 (WhatsApp Gateway Admin) estava esperando "founder criar conta Meta e verificar identidade" (cheklist final do doc anterior). Sem aprovação, todo o restante do projeto (Fases 8-11) ficava parado sem motivo técnico.

A Evolution API permanece como decisão técnica original do projeto (`PROJECT.md`, `STACK.md`, `docker/docker-compose.dev.yml`) e a Fase 7 já foi implementada sobre ela. **Reverter é o caminho mais curto e desbloqueia imediatamente as Fases 8-11.**

---

## Por que Evolution API (decisão final)

| Critério | Evolution API (escolhido) | API Oficial Meta (descartada) |
|----------|---------------------------|------------------------------|
| **Custo mensagens** | Zero | Zero (sessão gratuita iniciada pelo usuário) |
| **Custo número** | R$40/mês (chip + plano) | Zero (chip próprio cadastrado) |
| **Risco de ban** | Baixo (inbound-only, rate limit, mesmo padrão humano) | Zero |
| **Hardware 24/7** | Sim (chip hospedado em VPS/Raspberry) | Nenhum (cloud) |
| **Confiabilidade webhook** | Depende do container estar online | Garantido pela Meta |
| **Escalabilidade** | Limitada por hardware | Infinita |
| **Manutenção** | Reboot, QR code expirando, desconexões | Zero |
| **Setup inicial** | Instantâneo (Docker + QR code) | Requer Meta Business Manager verificado ❌ |
| **Limite números (CPF)** | Infinito (cada chip é um número) | Até 2 números |
| **Status (2026-06-23)** | **Funciona hoje (Fase 7 operacional)** | **Bloqueado — aprovação Meta negada** |

O trade-off aceito: custo R$40/mês/chip + manutenção de hardware vs. **desbloqueio imediato do roadmap**. Para um MVP solo em validação, seguir com Evolution API é tecnicamente mais rápido e remove a dependência de uma plataforma externa (Meta) que não aprovou a conta.

## Arquitetura NutriAI (Evolution API — já implementada na Fase 7)

```
Paciente → WhatsApp → Chip físico → Evolution API container → Webhook NutriAI
Resposta: NutriAI → Evolution API (POST /message/sendText/{instance}) → Chip físico → WhatsApp → Paciente
```

### Componentes já implementados

| Componente | Localização | Status |
|-----------|-------------|--------|
| `EvolutionApiService` | `backend/.../service/EvolutionApiService.java` | ✅ Fase 7 |
| `WhatsAppWebhookDTO` (schema Evolution) | `backend/.../dto/WhatsAppWebhookDTO.java` | ✅ Fase 7 |
| `WebhookController` (`/api/v1/webhooks/whatsapp`) | `backend/.../controller/WebhookController.java` | ✅ Fase 7 |
| Container `evolution-api` | `docker/docker-compose.dev.yml` | ✅ desde Fase 1 |
| Config `application.yml` (URL + apikey) | `backend/.../application.yml` | ✅ |
| `useWhatsAppStatus()` no HomeView | `frontend/src/stores/whatsappStore.ts` | ✅ Fase 7 |
| Body envio | `{"number":"...","textMessage":{"text":"..."}}` | `{"messaging_product":"whatsapp","to":"...","type":"text","text":{"body":"..."}}` |
| Config app | `application.yml` (URL + key) | `application.yml` (URL + token + phone-number-id) |

---

## Schema do Webhook da Evolution API (já em produção Fase 7)

### Recebimento (paciente envia mensagem)

```json
{
  "event": "messages.upsert",
  "instance": "nutriai",
  "data": {
    "key": { "remoteJid": "55119999887766@s.whatsapp.net", "id": "ABC123..." },
    "message": { "conversation": "Oi, comi arroz e frango" },
    "messageTimestamp": 1694568200,
    "pushName": "Ana Silva"
  }
}
```

**Mapping já implementado em `WhatsAppWebhookDTO`:**
- `data.key.remoteJid` (antes do `@`) → número do paciente
- `data.key.id` → message ID (dedup)
- `data.messageTimestamp` → timestamp
- `data.message.conversation` (texto) / `data.message.audioMessage` (áudio) / `data.message.imageMessage` (foto) → conteúdo
- `data.pushName` → nome do remetente
- `instance` → identifica qual chip/gateway recebeu (essencial para multi-number pool da Fase 10)

### Envio (resposta da IA)

```bash
curl -X POST http://evolution-api:8085/message/sendText/nutriai \
  -H "apikey: {EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "55119999887766",
    "textMessage": { "text": "Oi Ana! Registrei seu almoço: arroz e frango. Fico feliz que você está seguindo o plano!" }
  }'
```

---

## Multi-Number Pool com Evolution API (Fase 10)

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP GATEWAY POOL                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Instance #1  │  │ Instance #2  │  │ Instance #N  │       │
│  │ nutriai-a    │  │ nutriai-b    │  │ nutriai-c    │       │
│  │ chip: 5511.. │  │ chip: 5521.. │  │ chip: 5531.. │       │
│  │ ● Ativo      │  │ ● Ativo      │  │ ⚠ Banido     │       │
│  │ 50 pacientes │  │ 48 pacientes │  │ 0 pacientes  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  Pool Manager: aloca paciente → instance com menor carga    │
│  Fallback: instance banida → reassign pacientes + novos links│
│  Rate limit: 2-5s delay por resposta (inbound-only)         │
└─────────────────────────────────────────────────────────────┘
```

Cada chip físico vira uma "instance" no Evolution API (instance name único: `nutriai-a`, `nutriai-b`, etc.). A Fase 10 implementará o `GatewayPoolService` que gerencia essas instances, com `evolution_instance_name` persistido no banco (ver `whatsapp-gateway-admin.md:63`).

**Fallback é central com Evolution API** (ao contrário da Meta onde era quase desnecessário):
- Chip banido pelo WhatsApp (risco real, mitigado por rate limit + inbound-only)
- QR code expirado / chip desconectado → reassign pacientes para instance ativa
- Manutenção do chip (troca física) → pause temporário

---

## Rate Limiting (Evolution API)

A Evolution API não impõe rate limits próprios — o limite é o do próprio WhatsApp, que pune mensagens em massa com banimento.

| Prática | Valor |
|---------|-------|
| Delay por resposta | 2-5 segundos aleatório (Fase 10) |
| Inbound-only | nunca iniciamos conversa (já regra desde Fase 7) |
| Volume por dia | <100 msgs/dia/instance (seguro) |
| Verificação | `RateLimiter` service (Fase 10) |

---

## Roadmap atualizado

| Fase | Antes (decisão Meta) | Agora (decisão Evolution) |
|------|---------------------|---------------------------|
| 7 — WhatsApp Intelligence | ✅ Implementada sobre Evolution API | ✅ Mantida como está |
| 8 — Billing | Dependia da conta Meta? Não. Desbloqueada. | ✅ Pronta para planejar |
| 9 — LGPD | Independente de gateway | ✅ Pronta |
| 10 — WhatsApp Gateway Admin | Esperava phone_number_id Meta | Pool de instances Evolution (`evolution_instance_name`) |
| 11 — CI/CD & Deployment | Esperava Meta estável | ✅ Pronta para planejar |

**Nenhuma mudança de código necessária na Fase 7** — `EvolutionApiService` já está operacional. A Fase 10 passa a ter escopo mais bem definido: gerenciar pool de instances Evolution em vez de phone_numbers Meta.

---

## Checklist de Implementação (atualizado)

- [x] Container `evolution-api` no `docker/docker-compose.dev.yml`
- [x] `EvolutionApiService` implementado (Fase 7)
- [x] `WhatsAppWebhookDTO` com schema Evolution (Fase 7)
- [x] `WebhookController` ativo em `/api/v1/webhooks/whatsapp`
- [x] `useWhatsAppStatus()` no HomeView mostrando KPIs
- [ ] Comprar chip físico (Vivo/Claro/TIM) e planos
- [ ] Provisionar Evolution API em VPS (ou usar container local para dev)
- [ ] Conectar chip via QR code no painel Evolution
- [ ] Testar end-to-end: paciente real envia msg → IA responde → timeline atualiza
- [ ] Fase 10: implementar `GatewayPoolService` para multi-chip

---

*Documento revisado em: 2026-06-23*
*Decisão final: Evolution API (open-source, self-hosted) — revertida da tentativa de API Oficial Meta*
*Motivo da reversão: aprovação Meta Business Manager não obtida após múltiplas tentativas; Evolution API é a decisão original do projeto e já está operacional na Fase 7*
*Próxima ação: planejar Fase 8 (Billing) ou Fase 10 (Gateway Admin com pool de instances Evolution)*
