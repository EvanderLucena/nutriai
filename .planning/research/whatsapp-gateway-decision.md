# WhatsApp Gateway: Decisão Arquitetural Final

## Decisão

**Gateway escolhido: API Oficial do WhatsApp (Meta — WhatsApp Business Platform)**

**Provedor:** Meta Business Manager / WhatsApp Business Platform REST API
**Registro:** CPF pessoa física (até 2 números permitidos)
**Modelo:** Inbound-only (apenas respostas, nunca iniciamos conversa)

---

## Por que API Oficial (Revisão Final)

| Critério | API Oficial | Evolution Go (descartado) |
|----------|-------------|---------------------------|
| **Custo mensagens** | **ZERO** (conversa iniciada pelo usuário = sessão gratuita) | Zero |
| **Custo número** | **ZERO** (usa chip próprio cadastrado) | R$40/mês (chip + plano) |
| **Risco de ban** | **ZERO** (oficial da Meta) | Baixo, mas existe |
| **Hardware 24/7** | **NENHUM** (cloud) | Celular/Raspberry ligado o tempo todo |
| **Confiabilidade webhook** | **Garantido** pela Meta | Depende do Evolution estar online |
| **Escalabilidade** | Infinita | Limitada por hardware |
| **Manutenção** | Zero | Reboot, QR code expirando, desconexões |
| **Setup inicial** | Requer Meta Business Manager verificado | Instantâneo |
| **Limite números (CPF)** | **Até 2 números** | Infinito (cada chip é um número) |

## O que muda na arquitetura NutriAI

### Antes (Evolution Go)
```
Paciente → WhatsApp → Chip físico → Evolution Go container → Webhook NutriAI
Resposta: NutriAI → Evolution Go → Chip físico → WhatsApp → Paciente
```

### Depois (API Oficial)
```
Paciente → WhatsApp Infraestrutura Meta → Webhook NutriAI (configurado no Business Manager)
Resposta: NutriAI → API Meta (HTTPS) → WhatsApp Infraestrutura Meta → Paciente
```

### Diferenças de implementação

| Componente | Evolution Go | API Oficial Meta |
|-----------|-------------|------------------|
| Webhook endpoint | `/api/v1/webhooks/whatsapp` | `/api/v1/webhooks/whatsapp` **(mesmo!)** |
| Payload recebido | Schema Evolution Go | Schema Meta (diferente, ver abaixo) |
| Envio de mensagem | `POST /message/sendText/{instance}` | `POST https://graph.facebook.com/v18.0/{phone-number-id}/messages` |
| Auth | Header `apikey` | Header `Authorization: Bearer {access-token}` |
| Body envio | `{"number":"...","textMessage":{"text":"..."}}` | `{"messaging_product":"whatsapp","to":"...","type":"text","text":{"body":"..."}}` |
| Config app | `application.yml` (URL + key) | `application.yml` (URL + token + phone-number-id) |

---

## Schema do Webhook da Meta (API Oficial)

### Recebimento (paciente envia mensagem)

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511900000000",
          "phone_number_id": "123456789"
        },
        "contacts": [{
          "profile": { "name": "Ana Silva" },
          "wa_id": "55119999887766"
        }],
        "messages": [{
          "from": "55119999887766",
          "id": "wamid.ABC123...",
          "timestamp": "1694568200",
          "type": "text",
          "text": { "body": "Oi, comi arroz e frango" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Mapping para nosso DTO:**
- `entry[0].changes[0].value.messages[0].from` → `data.info.sender` (número do paciente)
- `entry[0].changes[0].value.messages[0].id` → `data.info.id` (message ID da Meta, usar para dedup)
- `entry[0].changes[0].value.messages[0].timestamp` → `data.info.timestamp`
- `entry[0].changes[0].value.messages[0].type` → `data.info.type`
- `entry[0].changes[0].value.contacts[0].profile.name` → PushName do remetente
- `entry[0].changes[0].value.metadata.display_phone_number` → Número do gateway que recebeu

**Novos campos (não existiam no Evolution Go):**
- `phone_number_id` — identifica qual dos seus números recebeu (essencial para multi-number pool)
- `business_account_id` — conta do Business Manager

### Envio (resposta da IA)

```bash
curl -X POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "55119999887766",
    "type": "text",
    "text": { "body": "Oi Ana! Registrei seu almoço: arroz e frango. Fico feliz que você está seguindo o plano!" }
  }'
```

---

## Multi-Number Pool com API Oficial

Com o modelo de pool, a infraestrutura é **mais simples** ainda:

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP GATEWAY POOL                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Número #1    │  │ Número #2    │                        │
│  │ 55119999..   │  │ 55118888..   │                        │
│  │ phone_id: A  │  │ phone_id: B  │                        │
│  │ ● Ativo      │  │ ● Ativo      │                        │
│  │ 50 pacientes │  │ 48 pacientes │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                             │
│  Limite CPF: 2 números                                    │
│  Pool Manager: aloca paciente → número com menor carga    │
│  Fallback: banimento impossível, mas número pode ser    │
│            suspenso (raro). Reassign nesse caso.          │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** Com API oficial, fallback é **quase desnecessário** (sem ban), mas mantemos para:
- Número suspenso pela Meta (violação de política — raríssimo)
- Manutenção no número (troca de chip)
- Escala futura quando ultrapassar 2 números (CPF → CNPJ)

---

## Rate Limiting

A API oficial tem rate limits generosos:

| Limite | Valor |
|--------|-------|
| Mensagens por minuto | 80/min por número |
| Mensagens por dia | 1000 por número |
| Webhook retries | Automático (5x em 30 min) |

Como somos inbound-only e respostas são ~2-5 segundos, **nunca vamos chegar perto**. Não precisa de rate limiter complexo.

---

## Migração Evolution Go → API Oficial (quando houver conta Meta)

### Esforço estimado: 2-3 horas

1. **Novo Serviço:** `MetaWhatsAppService` (substitui `EvolutionApiService`)
2. **Atualizar DTO:** `WhatsAppWebhookDTO` para schema da Meta
3. **Atualizar Envio:** endpoint de `POST /message/sendText/...` para `POST graph.facebook.com/{phone_id}/messages`
4. **Atualizar Auth:** de `apikey` para `Bearer` token
5. **Atualizar Config:** `application.yml` (nova env: `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`)
6. **Atualizar Docker:** remover container `evolution-go`
7. **Testes:** webhook recebendo e respondendo

---

## Decisões Atualizadas

| Decisão | Valor Anterior | Valor Atual |
|---------|---------------|-------------|
| Gateway | Evolution Go (self-hosted) | **API Oficial Meta (cloud)** |
| Número de entrada | Chip físico em celular | **Chip próprio cadastrado na Meta** |
| Custo operacional | R$40/mês/chip | **ZERO** (após número cadastrado) |
| Risco de ban | Baixo | **ZERO** |
| Hardware 24/7 | Necessário | **Nenhum** |
| Limite de números (CPF) | Infinito (cada chip é 1) | **2 números** |
| Quando implementar | Agora | **Depois da conta Meta verificada** |

---

## O que fazer AGORA (antes da conta Meta)

1. **Cadastrar na Meta Business Manager** (meta.com/business) com seu CPF
2. **Verificar identidade** (CPF + comprovante de endereço)
3. **Comprar chip** (Vivo, Claro, TIM) e cadastrar na plataforma
4. **Migrar código:** `EvolutionApiService` → `MetaWhatsAppService`
5. **Testar:** enviar mensagem para o número → receber resposta da IA

---

## Checklist de Implementação

- [ ] Criar conta Meta Business Manager (CPF)
- [ ] Verificar identidade na Meta
- [ ] Cadastrar número de chip na plataforma
- [ ] Implementar `MetaWhatsAppService.java`
- [ ] Adaptar `WhatsAppWebhookDTO` para schema Meta
- [ ] Atualizar `application.yml` com credenciais Meta
- [ ] Remover Evolution Go do Docker Compose
- [ ] Testar end-to-end
- [ ] Documentar setup

---

*Documento revisado em: 2026-05-06*
*Decisão final: API Oficial Meta com CPF (até 2 números)*
*Próxima ação: Aguardar founder criar conta Meta e verificar identidade*
