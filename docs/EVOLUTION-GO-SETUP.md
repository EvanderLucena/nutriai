# Setup do Evolution Go (WhatsApp Gateway)

## Introducao
O NutriAI usa o **Evolution Go** como gateway WhatsApp. E uma API de alta performance escrita em Go, que substitui a versao anterior em NodeJS/Baileys.

## Iniciar com Docker Compose

O servico `evolution-go` esta incluido no `docker/docker-compose.yml`. Para iniciar:

```bash
cd docker/
docker compose up -d evolution-go
```

## Variaveis de Ambiente

As seguintes variaveis devem estar no seu `.env`:

```env
# Evolution Go (WhatsApp Gateway)
EVOLUTION_API_KEY=your-secure-evolution-global-api-key-here
# URL usada pelo backend NutriAI para enviar mensagens via Evolution Go
EVOLUTION_API_URL=http://localhost:8081
# URL publica para receber webhooks do Evolution Go.
# Em desenvolvimento local, use ngrok:
# EVOLUTION_WEBHOOK_URL=https://abcd.ngrok.io/api/v1/webhooks/whatsapp
EVOLUTION_WEBHOOK_URL=
```

## Passo a Passo para Conectar um Numero

### 1. Criar uma Instancia

POST para `POST http://localhost:8081/instance/create`:
```json
{
  "instanceName": "nutriai",
  "integration": "WHATSAPP-BAILEYS"
}
```

**Headers:**
- `Content-Type: application/json`
- `apikey: <EVOLUTION_API_KEY>`

Use o Postman ou `curl`:
```bash
curl -X POST http://localhost:8081/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"instanceName":"nutriai","integration":"WHATSAPP-BAILEYS"}'
```

### 2. Conectar a Instancia com Webhook

POST para `POST http://localhost:8081/instance/connect`:
```json
{
  "webhookUrl": "https://sua-url-publica.com/api/v1/webhooks/whatsapp",
  "subscribe": ["ALL"],
  "immediate": true
}
```

**Headers:**
- `Content-Type: application/json`
- `apikey: <EVOLUTION_API_KEY>`
- `instanceId: <UUID_DA_INSTANCIA>`

### 3. Ler o QR Code

Faca uma requisicao GET para pegar o QR code:
```bash
curl http://localhost:8081/instance/nutriai/qrcode \
  -H "apikey: $EVOLUTION_API_KEY"
```

A resposta sera:
```json
{
  "code": "2@DoOPPlssTlSoDDdtPFXDXNp24ImY0bxwSivPLNbNLtCgXOYGFnsCN1Y64QYQB/r5tAmNqt0zhaf3TyOydXGZYGnKqB3UNTPDx1M=,...",
  "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA..."
}
```

A propriedade `qrcode` contem a imagem base64 do QR code. Copie o valor e use uma ferramenta online para decodifica-lo e escanear com o WhatsApp do seu celular.

**Fluxo de ativacao:**
1. Abra o WhatsApp no celular
2. Toque em `Configuracoes > Dispositivos conectados > Conectar dispositivo`
3. Escaneie o QR code exibido
4. Aguarde os eventos `PairSuccess -> Connected -> OfflineSyncCompleted` no seu webhook

## Diferencas da Versao Anterior (NodeJS)

| Caracteristica | Versao Antiga (NodeJS) | Evolution Go |
|---|---|---|
| HMAC Webhook | Sim (`X-Hub-Signature-256`) | **Nao suportado** |
| Payload | `data.key.remoteJid` | `data.info.sender` |
| Evento | `MESSAGES_UPSERT` | `Message` |
| Envio de texto | `{"number":"...","text":"..."}` | `{"number":"...","textMessage":{"text":"..."}}` |
| Auth Header | `apikey` | `apikey` (mesmo nome) |
| Performance | Boa | Superior (menor RAM, startup rapido) |

## Seguranca

O Evolution Go **nao oferece assinatura de webhook** por padrao. A seguranca e garantida atraves de:

1. **Deduplicacao**: Mensagens sao identificadas pelo campo unico `messageId` do WhatsApp. Mensagens duplicadas sao ignoradas.
2. **Matching de Telefone**: O processamento so ocorre se o numero do remetente (`sender`) bater com o campo `whatsapp` de um paciente ativo existente no banco de dados.
3. **Instancia Unica**: O nome da instancia (ex: `nutriai`) e configurado estaticamente via `nutriai.evolution.instance-name`.

**Nota sobre env vars:**
As variaveis `EVOLUTION_API_KEY` e `GLOBAL_API_KEY` dentro do container do Evolution Go devem ter o **mesmo valor** para que a autenticacao funcione corretamente.

## Solucao de Problemas

| Problema | Causa Provavel | Solucao |
|------|--------|-------|
| `403 Forbidden` no webhook | URL invalida ou secret errado | Certifique-se de que a URL do webhook publico (`EVOLUTION_WEBHOOK_URL`) esta acessivel pela internet. |
| Instance `not found` no envio | Instancia nao criada ou nome errado | Verifique se a instancia foi criada via `POST /instance/create` e se o nome corresponde ao valor de `nutriai.evolution.instance-name`. |
| Mensagens nao chegam | ngrok nao esta rodando | Em desenvolvimento, o `ngrok` e essencial. Certifique-se de que ele esta rodando e a URL foi atualizada na conexao da instancia. |
| QR code nao gera | Instancia ja conectada | Tente desconectar `DELETE /instance/nutriai` e criar novamente. |
