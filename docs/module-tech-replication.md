# Modula Tech Architecture Replication

This document records what was replicated from `/Users/yonatanblum4/projects/modula_tech/apps` (and repo-level agent config) into the Shelfi POC **without modifying the source Modula Tech repository**.

## Source Analysis

### Modula Tech monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js App Router frontend |
| `apps/server` | Fastify API (not replicated — POC uses server actions) |
| `packages/*` | Shared UI, types, config (not replicated — POC is standalone) |
| `AGENTS.md` | Agent standards (code, security, testing, design) |
| `.cursor/rules/` | Cursor always-on and scoped rules |
| `.cursor/skills/` | Reusable agent skills |

### Modula Tech `apps/web` frontend structure

- `app/` — routes and layouts
- `components/` — `ui/`, `sections/`, `providers/`, `shared/`
- `config/content/` — content-driven UI copy
- `constants/` — routes, breakpoints, app config
- `contexts/` — React context
- `hooks/` — client hooks (often feature-scoped subfolders)
- `lib/` — utilities, API clients, domain logic
- `e2e/` — Playwright tests

## What Was Replicated

### Agent instructions

- **`AGENTS.md`** — full standards adapted for standalone Next.js + Prisma (removed monorepo-only items: `pnpm dev:stack`, graphify, `@repo/types`, changelog sync)
- **`GEMINI_PROJECT_CONTEXT.md`** — project-specific context for AI tools
- **`CLAUDE.md`** — unchanged pointer to `AGENTS.md`

### Cursor rules (`.cursor/rules/`)

Copied Modula Tech rules relevant to this stack:

- `common-*` — agents, coding-style, development-workflow, git-workflow, patterns, security, testing, code-review, performance, hooks
- `web-*` — coding-style, patterns, design-quality, performance, security, testing, hooks
- `typescript-*` — coding-style, patterns, security, testing, hooks
- `user-facing-copy.mdc`

Not copied: language-specific rules (Kotlin, Rust, PHP, etc.), `local-dev-stack.mdc`, `graphify.mdc`, `changelog-git-sync.mdc`.

### Cursor skills (`.cursor/skills/`)

- `api-design`
- `backend-patterns`
- `coding-standards`
- `e2e-testing`
- `frontend-patterns`
- `nextjs-turbopack`
- `tdd-workflow`
- `user-facing-error-messages`

### Application folder scaffolding

| Added path | Purpose |
|------------|---------|
| `constants/routes.ts` | Central route constants |
| `constants/app-config.ts` | App-wide config |
| `config/content/common.ts` | Shared UI copy |
| `config/content/index.ts` | Content barrel export |
| `components/providers/RootClientProviders.tsx` | Client provider root |
| `contexts/.gitkeep` | Placeholder for future context |
| `hooks/.gitkeep` | Placeholder for future hooks |

### Documentation

- `docs/technical-architecture.md` — Shelfi-specific architecture
- This file — replication audit trail

## Intentionally Not Replicated

- Monorepo tooling (`pnpm-workspace`, Turborepo, `apps/server`)
- Shared packages (`@repo/ui`, `@repo/types`)
- Modula Tech product routes, content files, and domain modules
- Graphify knowledge graph
- PostHog, Stripe, Redis/BullMQ infrastructure
- Full `.cursor/agents/` and hooks from Modula Tech ECC install

## Integrity Preserved

- Existing routes (`/`, `/upload`) and components unchanged in behavior
- Prisma schema and server actions untouched
- `.env` / secrets not copied from Modula Tech
