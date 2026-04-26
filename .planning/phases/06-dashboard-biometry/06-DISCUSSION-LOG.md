# Phase 6: Dashboard & Biometry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `06-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 06-dashboard-biometry
**Areas discussed:** Dashboard scope, biometric capture scope, status review, episode history behavior

---

## Dashboard scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep WhatsApp block | Preserve the "Refeições reportadas" area with placeholder/empty state until Phase 7 | |
| Replace with biometry-only block | Swap the WhatsApp area for a 100% biometrics-focused section | |
| Replace with broader clinical context | Remove WhatsApp and use data that better reflects the nutritionist's current portfolio and recent assessments | ✓ |

**User's choice:** Remove the WhatsApp block from the dashboard entirely. The dashboard should be grounded in the nutritionist's real context, with room to include recent evaluations and stronger portfolio-level data.
**Notes:** The user called the current dashboard vague and preferred data that reflects the nutritionist's overall context instead of future WhatsApp behavior.

---

## New assessment scope

| Option | Description | Selected |
|--------|-------------|----------|
| Quick assessment only | Save only a small set of core biometrics in the first release | |
| Full assessment required | Force all planned fields in one mandatory form | |
| Full assessment available, partial completion allowed | Keep the full field set, but let the nutritionist save incomplete evaluations and edit later | ✓ |

**User's choice:** Keep the full planned scope, but allow partial capture and later editing.
**Notes:** The user emphasized that filling the parameters is in the nutritionist's interest, so the product should not over-police optional data entry.

---

## Save validation

| Option | Description | Selected |
|--------|-------------|----------|
| Date plus any one metric | Minimal gate for the first version | |
| Date plus weight | Require at least date and weight | |
| Date plus weight and body fat | Require date, weight, and `% gordura` | ✓ |

**User's choice:** Require `data`, `peso`, and `% gordura`.
**Notes:** Other fields remain optional.

---

## Status handling after save

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt manual review | Ask the nutritionist to review/update patient status after saving | ✓ |
| Keep current status silently | Save without any follow-up prompt | |
| Suggest status with confirmation | Pre-suggest a status but require confirmation | |

**User's choice:** Prompt the nutritionist to review/update status manually after saving.
**Notes:** This matches the earlier Phase 4 preference that status is manual.

---

## Episode review model

| Option | Description | Selected |
|--------|-------------|----------|
| Active episode selector inside Biometria | Switch between current and previous cycles from the biometry tab | |
| Past cycles inside Histórico | Keep active work in Biometria and use Histórico to inspect prior episodes | ✓ |
| Global episode dropdown | Switch the whole patient context across episodes | |

**User's choice:** Historical episodes should be explored from Histórico, while Biometria stays focused on the active episode.
**Notes:** The user wanted to explore older periods without confusing how to return to the current one.

---

## Historical episode content

| Option | Description | Selected |
|--------|-------------|----------|
| Summary only | Show a compact recap of the closed cycle | |
| Full read-only context | Show plan, past biometry, and what happened in the period, all without editing | ✓ |
| Editable historical cycles | Allow retrospective edits in previous episodes | |

**User's choice:** Show the whole context of the closed period, read-only.
**Notes:** The user explicitly mentioned diet, past biometry, and everything that happened in the period as view-only content.

---

## Empty or short episodes

| Option | Description | Selected |
|--------|-------------|----------|
| Hide them | Avoid showing thin historical cycles | |
| Show them with explicit sparse-state messaging | Keep the cycle visible and explain that little happened in that period | ✓ |
| Merge them automatically | Collapse short cycles into adjacent periods | |

**User's choice:** Keep past short/sparse periods visible and label them honestly.
**Notes:** The follow-up clarified that every episode will at least have an auto-created base plan, even if it remains nearly empty.

---

## Active episode visibility in Histórico

| Option | Description | Selected |
|--------|-------------|----------|
| Show active plus past cycles together | Historical page includes everything | |
| Show only past cycles | Histórico is archival only; the active cycle stays in the operational tabs | ✓ |
| User-toggle between active and archived | Let the user choose in Histórico | |

**User's choice:** Histórico should not show active episodes.
**Notes:** Active work remains in Hoje/Plano/Biometria/Inteligência.

---

## the agent's Discretion

- Exact dashboard KPI composition after removing the WhatsApp area
- Exact sparse-state copy for short or data-light historical cycles
- Whether past-cycle inspection is inline expansion or drill-down inside Histórico

## Deferred Ideas

- WhatsApp dashboard activity before Phase 7
- Automatic status calculation from biometrics
