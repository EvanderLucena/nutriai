# Phase 5: Meal Plans & Food Catalog - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 05-meal-plans-food-catalog
**Areas discussed:** Meal plan data model, Food catalog & macros, Plan-patient linking, API & store design

---

## Meal Plan Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Reference Food catalog | MealFood rows reference foodId, macros auto-calculated from per100 data | ✓ |
| Snapshot macros on add | Macros frozen from catalog at add-time, no link back | |
| Reference + snapshot (hybrid) | foodId reference for lookups, macros frozen in plan row, badge for updates | |

**User's choice:** Reference Food catalog — auto-calc macros from per100 data
**Notes:** User confirmed macros should be calculated automatically from the per100 data. When问到about what happens when catalog data changes, user chose to freeze macros in existing plans.

---

## Plan Versioning

| Option | Description | Selected |
|--------|-------------|----------|
| Single plan per episode | No versioning, in-place edits, episode model provides lifecycle | ✓ |
| Plan versioning with history | Each edit creates new version, nutritionist can browse history | |

**User's choice:** Single plan per episode
**Notes:** Episode model from Phase 4 provides natural versioning through reactivation — old plan stays with old episode, new episode gets new plan.

---

## Meal Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Slots within plan | Predefined meal slots (café, almoço, jantar), add/remove/edit | ✓ |
| Independent meal entities | Meals are reusable recipe-like entities sharable across plans | |

**User's choice:** Slots within plan
**Notes:** Matches prototype behavior and clinical workflow.

---

## Multiple Options per Meal

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple options per meal | Opção 1·Clássico, Opção 2·Peixe — matches prototype | ✓ |
| Single option per meal | Simplified data model, loses flexibility | |

**User's choice:** Multiple options per meal

---

## MealFood Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text qty + numeric grams | qty for human readability ("4 col. sopa"), grams for calculation. Portion refs convert to grams. | ✓ |
| Numeric grams only | Just grams field, loses clinical notation | |

**User's choice:** Free-text qty + numeric grams
**Notes:** User asked about non-gram units (colheres, unidades) → portion references convert to grams.

---

## Portion Picking

| Option | Description | Selected |
|--------|-------------|----------|
| Portion picker + grams adjust | Pick from portion references, optionally adjust grams. All calculation through per100 × grams | ✓ |
| Grams entry only | Direct numeric input only, no portion shortcuts | |

**User's choice:** Portion references convert to grams (1 colher de sopa = 20g, 1 unidade = 50g). Nutritionist can pick a portion or type grams directly.
**Notes:** User initially confused about how macros flow — clarified that per100 data is the source of truth, portions are shortcuts that set the grams value.

---

## Display Units

| Option | Description | Selected |
|--------|-------------|----------|
| Medida caseira + gramas | "1 unidade (120g)" — patient reads medida caseira, system uses grams | ✓ |
| Só medida caseira visível | Display "1 unidade" only, grams internal | |
| Só gramas | Display "120g" only, loses clinical language | |

**User's choice:** Medida caseira + gramas
**Notes:** User felt that showing only "120g" for banana would be confusing for patients — "1 unidade" is more intuitive. Both displayed: "1 unidade (120g)".

---

## Extras Model

| Option | Description | Selected |
|--------|-------------|----------|
| Separate extras list in plan | Extras have category, macros, AI note — "authorized outside plan" | |
| Extras as special meal slot | Extras as a MealSlot with type "extra" | |
| Extras simple — just name + qty + macros | No categories, no AI notes, no "authorized" framing. Reference foods for the diet. | ✓ |

**User's choice:** Extras simple (name + qty + macros)
**Notes:** User explicitly rejected "authorized outside plan" framing and AI notes. Extras are reference foods in the diet — the AI will use them with a harm-reduction approach (Phase 7), not as restrictions.

---

## Food Catalog Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Private per nutritionist | Each nutri has own food catalog, isolated by nutritionist_id | ✓ |
| Global + private hybrid | Shared TACO base + private custom foods | |

**User's choice:** Private per nutritionist
**Notes:** Same isolation pattern as patients (D-10 from Phase 4).

---

## Food Types

| Option | Description | Selected |
|--------|-------------|----------|
| Base + Preset (both) | Base foods (per100 + portions) and Presets (pre-calculated packages like "Omelete 2 ovos") | ✓ |
| Base foods only | Only per100 items, no preset shortcut packages | |

**User's choice:** Keep both Base and Preset food types

---

## Catalog Edit Impact on Plans

| Option | Description | Selected |
|--------|-------------|----------|
| Plans freeze macros | Editing a food in the catalog does NOT update existing plans | ✓ |
| Plans auto-update | All plans referencing the food update automatically | |

**User's choice:** Plans freeze macros at add-time
**Notes:** Consistent with D-01 (MealFood stores frozen macro values).

---

## Plans Per Patient

| Option | Description | Selected |
|--------|-------------|----------|
| 1 plan per episode | One plan per patient episode, in-place edits | ✓ |
| Multiple plans per patient | Nutritionist can create multiple plans (weekly, transition) | |

**User's choice:** 1 plan per episode
**Notes:** Plan auto-created with patient. When episode closes, plan preserved in history.

---

## Plan Creation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-create with 6-meal template | Patient created → episode opened → plan created with template of 6 meals | ✓ |
| Auto-create empty | Plan created empty, nutritionist adds meals manually | |

**User's choice:** Auto-create plan with template of 6 meal slots
**Notes:** Template: Café (07:00), Lanche manhã (10:00), Almoço (12:30), Lanche tarde (15:30), Jantar (19:30), Ceia (22:00). Macro targets distributed by objective.

---

## Plan Editing Location

| Option | Description | Selected |
|--------|-------------|----------|
| Inside PatientView, Plans tab | Plan is contextual to the patient | ✓ |
| Standalone Plans page in sidebar | Separate plans management page | |

**User's choice:** Inside PatientView, Plans tab

---

## Episode Close Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve plan in old episode | Plan stays with episode, visible in History tab | ✓ |
| Archive as read-only | Plan becomes read-only, nutritionist can copy foods to new plan | |

**User's choice:** Preserve plan in old episode
**Notes:** When patient reactivated, new episode = new plan.

---

## Macro Targets

| Option | Description | Selected |
|--------|-------------|----------|
| Targets on plan + per meal | Total daily macros + per-meal-slot targets (Café 380kcal, Almoço 620kcal) | ✓ |
| Targets only on plan total | Only total daily macros, meals just accumulate | |

**User's choice:** Targets on plan (total daily) + per meal slot
**Notes:** Matches prototype behavior — each meal slot has target kcal/prot/carb/fat.

---

## Plan Save UX

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save per action | Each edit (add food, change qty, remove meal) saves immediately. No save button. | ✓ |
| Save button with batch | Edit freely, then click Save to batch all changes | |

**User's choice:** Auto-save per action
**Notes:** With granular CRUD endpoints, each action persists immediately. Discrete toast confirmation. No bulk Save button.

---

## API Design

| Option | Description | Selected |
|--------|-------------|----------|
| CRUD endpoints for foods + plan components | Separate endpoints for meals, options, items, extras | ✓ |
| Single PATCH for entire plan | One endpoint to update entire plan payload | |

**User's choice:** CRUD endpoints for foods and plan components
**Notes:** Aligned with auto-save per action UX. Each edit is a targeted API call.

---

## Macro Calculation Location

| Option | Description | Selected |
|--------|-------------|----------|
| Backend calculates | Frontend sends foodId + grams, backend calculates and freezes macros | ✓ |
| Frontend calculates | Frontend calculates from per100 data, sends results to backend | |

**User's choice:** Backend calculates macros
**Notes:** Backend looks up per100 data, calculates macros (per100 × grams / 100), and stores frozen values in MealFood row.

---

## OpenCode's Discretion
- Exact JPA entity shapes and column types
- Flyway migration V5 specifics
- TanStack Query hook structure
- planStore (Zustand) internal shape
- Toast component for auto-save confirmations
- Meal template initialization (macro distribution by objective)
- Food search/pagination UX details
- Error handling for auto-save failures

## Deferred Ideas
- TACO database import — P2, already noted in TASKS.md
- AI notes on extras — Phase 7 (WhatsApp Intelligence)
- Macro target auto-calculation from biometrics — nice-to-have for later
- Meal plan PDF export — out of scope per TASKS.md
- Food catalog sharing between nutritionists — future feature
- Full recipe builder (ingredient-level composition) — v2 feature