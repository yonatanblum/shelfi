---
name: user-facing-error-messages
description: Never surface raw logs, stack traces, Prisma/SQL fragments, env var names, or internal diagnostics in UI or user-visible API error strings. Use short, safe copy; log technical detail only via console/server logging. Use when implementing error handling, alerts, toast messages, or JSON error fields returned to browsers.
---

# User-facing error messages

## Rules

1. **UI (React, alerts, toasts, form errors)**  
   Show only brief, actionable, non-technical text (e.g. "Something went wrong. Please try again.").  
   Never include: file paths, `pnpm` commands, `V1_BACKEND_ORIGIN`, Docker hints, raw `fetch` errors, **Playwright `page.goto` / Call log / `net::ERR_` lines**, or messages copied from server logs.

2. **Browser-consumed JSON (`error` / `message` on `ApiResponse`)**  
   Same as UI: safe, generic phrases only (or **empty** `message` so the web app uses localized copy from `apps/web/config/content`).  
   Operational detail belongs in **server logs** and **monitoring**, not in the response body read by the client.

3. **Development**  
   Developers may see technical hints in **`console.error` / `console.warn`** (or structured server logs), not in strings shown to the user.

4. **502 / proxy / “cannot reach API”**  
   Treat as a generic outage message for users. Document setup (Docker, `V1_BACKEND_ORIGIN`, starting Fastify) in `.env.example`, README, or internal runbooks only.

## Checklist

- [ ] No log line or stack trace is assigned to a user-visible `message` / `error` field without sanitization.
- [ ] Network and 5xx paths use a small set of approved generic strings.
- [ ] Technical context is logged, not displayed.
