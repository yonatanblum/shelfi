# Shelfi — Gemini Project Context

## Overview

Shelfi is a standalone Next.js application for pharmacy shelf image analysis and retail intelligence. Architecture patterns are aligned with the Modula Tech `apps/web` frontend conventions (content config, constants, hooks, providers) without the monorepo or separate API server.

## Workspace Structure

- `app/` — Next.js App Router pages, layouts, server actions
- `components/` — feature UI (`dashboard/`, `upload/`, `layout/`, `ui/`, `providers/`)
- `config/content/` — centralized copy for content-driven UI
- `constants/` — routes, app config
- `contexts/` — React context for shared client state
- `hooks/` — reusable client hooks
- `lib/` — Prisma client, Gemini integration, types, utilities
- `prisma/` — SQLite schema and migrations
- `docs/` — architecture and replication notes
- `.cursor/` — agent rules and skills (ported from Modula Tech)

## Frontend Architecture

- **Framework:** Next.js App Router + React 19
- **Styling/UI:** Tailwind CSS v4 + shadcn/ui components
- **Content strategy:** centralized config under `config/content/*`
- **Routing:** page routes in `app/*`, constants in `constants/routes.ts`
- **Data layer:** Prisma + SQLite via server actions in `app/actions/`
- **AI:** Google Gemini for shelf image extraction (`lib/gemini/`)

## Core Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — metrics, brand chart, products table |
| `/upload` | Shelf image upload and extraction review |

## Environment Variables

See `.env.example` for required keys (database URL, Gemini API key).

## Agent Instructions

See `AGENTS.md` for coding standards, security checks, testing workflow, and design quality requirements. Cursor rules live in `.cursor/rules/`; skills in `.cursor/skills/`.
