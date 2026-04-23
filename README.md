# NutriAI

Painel clínico para nutricionistas solo (Brasil) que gerencia pacientes, planos alimentares, catálogo de alimentos e insights — com IA respondendo ao paciente via WhatsApp com base no plano alimentar.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Java 21 + Spring Boot 3.5 + PostgreSQL |
| Auth | JWT (jjwt 0.12) + Spring Security |
| DB Migrations | Flyway |
| Testes Front | Vitest + Testing Library + Playwright |
| Testes Back | JUnit 5 + Mockito + Testcontainers |
| CI | GitHub Actions (lint, typecheck, test, E2E) |
| WhatsApp | Evolution API (planejado) |

## Estrutura

```
frontend/          React + TypeScript + Vite
backend/           Spring Boot + Gradle
docker/            Docker Compose para dev
scripts/           Utilitários
.planning/         Roadmap, planos por fase, research
brainstorms/       Documentos de ideiação
```

## Desenvolvimento

### Pré-requisitos

- Node.js 20+
- Java 21
- Docker Desktop (para PostgreSQL e E2E)
- Gradle (via wrapper incluído)

### Backend

```bash
# PostgreSQL via Docker
docker compose -f docker/docker-compose.dev.yml up -d postgres

# Rodar o backend
cd backend && ./gradlew bootRun

# Testes unitários
./gradlew test

# Testes de integração (requer Docker)
./gradlew integrationTest
```

### Frontend

```bash
cd frontend && npm install

# Dev server
npm run dev

# Build produção
npm run build

# Lint + typecheck
npx tsc --noEmit && npm run lint

# Testes unitários
npm test

# Testes E2E (requer backend + frontend rodando)
npm run test:e2e
```

## Variáveis de Ambiente

Copie `.env.example` e preencha os valores. Nunca commite secrets.

| Variável | Uso |
|----------|-----|
| `NUTRIAI_DATASOURCE_PASSWORD` | Senha do PostgreSQL |
| `NUTRIAI_JWT_SECRET` | Chave de assinatura JWT |
| `NUTRIAI_SEED_ADMIN_PASSWORD` | Senha do admin de seed |

## Progresso

| Fase | Status |
|------|--------|
| 1. Monorepo & Infra | ✅ |
| 2. Frontend Migration | ✅ |
| 3. Auth & Onboarding | ✅ |
| 4. Patient Management | ✅ |
| 5. Meal Plans & Food Catalog | ✅ |
| 6. Dashboard & Biometry | 🔜 |
| 7. WhatsApp Intelligence | Planejada |
| 8. Billing & Subscriptions | Planejada |
| 9. LGPD Compliance | Planejada |
| 10. CI/CD & Deployment | Planejada |

## Licença

Proprietário. Todos os direitos reservados.