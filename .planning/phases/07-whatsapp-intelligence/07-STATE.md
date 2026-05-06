# Phase 07 State

## Phase: 07-whatsapp-intelligence

## Overall Status: Mostly Complete (3 of 4 waves executed, 1 documented)

### Wave Execution

| Wave | Plan File | Status | Merged To Main | Notes |
|------|-----------|--------|----------------|-------|
| Wave 1: Backend Infrastructure | 07-01-PLAN.md | ✅ Complete | PR #94 | Schema V18, webhook, queue, async processing |
| Wave 2: LLM + Extraction + Evolution API | 07-02-PLAN.md | ✅ Complete | PR #94 | OllamaCloud, ConversationService, EvolutionApiService |
| Wave 3: Frontend + E2E | 07-03-PLAN.md | ✅ Complete | PR #96 | Timeline real, activation UI, dashboard KPIs, 6 E2E specs |
| Wave 4: IA Meal Suggestion Refinement | 07-04-PLAN.md | 📝 Documented | — | New intent `MEAL_SUGGESTION`, time-based suggestions, harm reduction. **Not executed.** |

### Additional PRs

| PR | Type | Status | Content |
|----|------|--------|---------|
| #94 | Feature | ✅ Merged | Waves 1-2: Backend WhatsApp pipeline |
| #96 | Feature | ✅ Merged | Wave 3: Frontend wiring + E2E |
| #98 | Fix | ✅ Merged | AI review fixes: @Valid, retry, tenant isolation |
| #101 | Migration | ✅ Merged | Evolution API (Node) → Evolution Go (Go) |

### Branch History

- `feat/07-whatsapp-backend` → merged via PR #94
- `feat/07-whatsapp-frontend` → merged via PR #96
- `fix/07-review-warnings` → merged via PR #98
- `feat/07-migrate-evolution-go` → merged via PR #101

### Pending Work (Wave 4)

**Not yet started.** Documented in `07-04-PLAN.md`.

When prioritized, execute in new branch `feat/07-ia-meal-suggestion`.

Key items:
- [ ] Add `MEAL_SUGGESTION` intent to `LlmIntent` enum
- [ ] Update `OllamaCloudLlmService.classifyIntent()` for suggestion keywords
- [ ] Add `buildSuggestionPrompt()` with current time + plan context
- [ ] Handle `MEAL_SUGGESTION` in `ConversationService` (no extraction, no history event)
- [ ] Update Timeline component to show suggestion events with 💡 icon
- [ ] E2E: 5 suggestion scenarios (hungry, out-of-plan, on-the-road, etc.)

### Architecture Decisions Recorded

| Decision | Location | Status |
|----------|----------|--------|
| D-01: Single LLM call per message | 07-CONTEXT.md | Implemented |
| D-02: Ollama Cloud with provider abstraction | 07-CONTEXT.md | Implemented |
| D-03: Minimal context for meal reports, full for plan questions | 07-CONTEXT.md | Implemented |
| D-04: Harm reduction persona | 07-CONTEXT.md | Implemented |
| D-05: Audio/photo acknowledgment only | 07-CONTEXT.md | Implemented |
| D-06-D-09: Webhook + HMAC + Redis queue | 07-CONTEXT.md | Implemented (HMAC removed for Evolution Go) |
| D-10-D-14: WhatsApp data model | 07-CONTEXT.md | Implemented |
| D-15-D-18: Activation + patient experience | 07-CONTEXT.md | Implemented |
| D-19-D-23: API + frontend endpoints | 07-CONTEXT.md | Implemented |
| **D-24: Inbound-only model (no proactive messages)** | 07-04-PLAN.md | **Documented** |
| **D-25: `MEAL_SUGGESTION` intent** | 07-04-PLAN.md | **Documented** |
| **D-26: Time-based meal suggestion** | 07-04-PLAN.md | **Documented** |

### Research Artifacts

- `.planning/research/whatsapp-gateway-admin.md` — Pool architecture, fallback, rate limiting, costs (420 lines)
- Documented during Phase 07 discussions, to be implemented as Phase 10 in roadmap.

### Next Action

When founder prioritizes Wave 4:
1. Create branch `feat/07-ia-meal-suggestion`
2. Execute tasks 1-4 from `07-04-PLAN.md`
3. Open PR, pass CI + AI review
4. Merge to main
5. Update this STATE.md to mark Wave 4 complete

---

*Last updated: 2026-05-06*
