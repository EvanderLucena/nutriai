# GSD Quickstart — NutriAI

Canonical guide for developers to bootstrap and use the GSD (Get Shit Done) workflow in this repository.

## What is GSD?

GSD is a project management system for solo developers working with AI coding agents. It provides structured workflows: plan → execute → verify → ship. All planning artifacts live in `.planning/`.

## Prerequisites

### 1. OpenCode Runtime

GSD commands run inside **OpenCode** (the AI coding CLI). Install it from <https://opencode.ai>.

Verify:
```
opencode --version
```

### 2. GSD Skill + Command Pack

GSD is installed globally on this machine at:

| Component | Location |
|-----------|----------|
| Skill (SKILL.md) | `~/.agents/skills/majiayu000-gsd/SKILL.md` |
| Slash commands | `~/.config/opencode/commands/gsd/` |
| Workflows + agents | `~/.config/opencode/get-shit-done/` |
| Tools (gsd-tools.cjs) | `~/.config/opencode/get-shit-done/bin/gsd-tools.cjs` |
| Version | See `~/.config/opencode/get-shit-done/VERSION` (currently 1.35.0) |

These are **not** versioned in the repo. They are installed via the GSD CLI installer. If you're on a fresh machine, install GSD first (see Fallback below).

### 3. Project Initialization

The repo already has `.planning/` with:
- `PROJECT.md` — project context and vision
- `ROADMAP.md` — 10-phase breakdown (6 completed)
- `STATE.md` — current position (Phase 06 complete, Phase 07 next)
- `config.json` — workflow preferences
- `phases/` — per-phase plans, summaries, reviews

No re-initialization needed. GSD commands will pick up the existing setup.

## Canonical Workflow

### Entry Points (slash commands in OpenCode)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:execute-phase 7` | Execute a planned phase with all its plans | Starting phase work |
| `/gsd:plan-phase 7` | Create execution plans for a phase | Before executing a new phase |
| `/gsd:discuss-phase 7` | Gather context and surface gray areas | Before planning, when scope is unclear |
| `/gsd:research-phase 7` | Research technical approaches for a phase | Before planning, when implementation is unclear |
| `/gsd-quick <description>` | Small ad-hoc task with GSD guarantees | Bug fixes, doc updates, small features |
| `/gsd-debug <description>` | Systematic debugging | Investigating bugs |
| `/gsd:verify-work 7` | Goal-backward verification of phase completion | After execution, before marking done |
| `/gsd:code-review` | Review source files for issues | After implementation |
| `/gsd:progress` | Show current project position | Anytime, to check status |
| `/gsd:next` | Show what to work on next | Anytime, to find next action |

### Common Workflows

#### Starting a new phase (e.g. Phase 7 — WhatsApp Intelligence)

```
1. /gsd:discuss-phase 7     — surfaces gray areas, captures decisions
2. /gsd:research-phase 7    — investigates technical approaches
3. /gsd:plan-phase 7        — creates execution plans
4. /gsd:execute-phase 7     — executes plans with atomic commits
5. /gsd:verify-work 7       — verifies goal achievement
```

#### Ad-hoc task (bug fix, doc update)

```
1. /gsd-quick Fix login error on expired tokens
   (add --full for discussion+research+validation pipeline)
```

#### Debugging an issue

```
1. /gsd-debug Biometry form not saving — hypothesis-driven debugging
```

### Flags for `/gsd-quick`

| Flag | Effect |
|------|--------|
| `--full` | Discussion + research + plan-checking + verification |
| `--discuss` | Lightweight discussion before planning |
| `--research` | Spawn researcher before planning |
| `--validate` | Plan-checking + post-execution verification |

## .planning/ Structure

```
.planning/
├── PROJECT.md           # Project context and vision
├── REQUIREMENTS.md      # Scoped requirements
├── ROADMAP.md          # Phase structure (10 phases)
├── STATE.md            # Project memory — current position, decisions, progress
├── config.json         # Workflow preferences
├── research/            # Domain research outputs
├── phases/              # Per-phase artifacts
│   └── XX-name/
│       ├── XX-YY-PLAN.md       # Execution plan
│       ├── XX-YY-SUMMARY.md    # Execution summary
│       ├── XX-CONTEXT.md       # Phase context
│       ├── XX-RESEARCH.md      # Phase research
│       ├── XX-REVIEW.md        # Code review findings
│       └── XX-UI-SPEC.md       # UI specification (if applicable)
├── quick/               # Quick task artifacts
│   └── YYMMDD-xxx-slug/
│       ├── YYMMDD-xxx-PLAN.md
│       └── YYMMDD-xxx-SUMMARY.md
└── codebase/            # Codebase analysis
    ├── STACK.md
    ├── ARCHITECTURE.md
    └── CONVENTIONS.md
```

## Fallback: When Slash Commands Don't Work

If you're using Claude Code (not OpenCode) or another runtime where `/gsd:*` slash commands are unavailable:

1. **Read the GSD SKILL.md** directly: `~/.agents/skills/majiayu000-gsd/SKILL.md`
2. **Read the relevant workflow file** in `~/.config/opencode/get-shit-done/workflows/` (e.g. `execute-phase.md`, `quick.md`, `debug.md`)
3. **Follow the process manually** — each workflow file contains a complete `<process>` section with step-by-step instructions that can be executed by any AI agent
4. **Use OpenCode as primary** — the slash commands are convenience wrappers; the workflows work in any agent that can read files and use tools

### For Claude Code specifically

Claude Code loads `CLAUDE.md` → `AGENTS.md`. The GSD skill is not auto-loaded in Claude Code. To use GSD workflows in Claude Code:

1. Manually paste the relevant workflow content as your prompt, or
2. Reference the workflow file: "Read and follow the process in `~/.config/opencode/get-shit-done/workflows/execute-phase.md`"

### Verification that GSD is working

Run `/gsd:health` in OpenCode. It should report the GSD version and project state.

## Key Conventions

- **Plans are prompts** — `XX-YY-PLAN.md` files are execution prompts, not documentation
- **Goal-backward planning** — start from "what must be TRUE", derive what to build
- **Atomic commits** — each task commits independently
- **Context budget** — plans target ~50% context usage; stop before quality degrades
- **Wave-based execution** — independent plans run in parallel waves
- **STATE.md is the memory** — always read it before starting work

## Current Project State

- **Phase**: 06 completed, 07 next (WhatsApp Intelligence)
- **Progress**: 60% (6/10 phases)
- **Next action**: `/gsd:plan-phase 7` to plan Phase 07

---

Last updated: 2026-04-28