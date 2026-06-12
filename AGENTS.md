<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## dev server

Local development: **`npm run dev`** (Next.js on port 3000).

Rules:
- After code changes that affect routing or server actions, verify the app loads at `http://localhost:3000`.
- Prisma schema changes require `npx prisma migrate dev` before relying on new fields.

## code standards

### 500-Line Rule (Strict Limit)
- No single code file shall exceed 500 lines of code.
- If a component or file approaches 400-450 lines, it must be refactored.
- Refactoring strategy: Split UI into sub-components, move business logic to Custom Hooks, and move math/pure functions to utility files.

### Structural Organization (Object-Oriented & Modular)
- **Separation of Concerns**: Keep UI (JSX), logic (Hooks), and math (Utils) in separate files.
- **Custom Hooks**: Complex state management and event listeners must be encapsulated in Custom Hooks (e.g., `useUploadDropzone.ts`).
- **Utility Functions**: All calculations, parsing, and data transforms must reside in pure TypeScript utility files under `lib/`.

### Folder Layout (Modula Tech pattern, adapted for standalone app)
- `app/` — Next.js App Router pages, layouts, and server actions
- `components/` — UI organized by feature (`dashboard/`, `upload/`, `layout/`, `ui/`, `providers/`)
- `config/content/` — centralized copy and content-driven UI strings
- `constants/` — routes, app config, breakpoints
- `contexts/` — React context providers for cross-cutting client state
- `hooks/` — reusable client hooks
- `lib/` — server utilities, Prisma client, external integrations (Gemini), shared types

### TypeScript & Standards
- **Strict Typing**: No use of `any`. Every domain object must have a clear Interface/Type.
- **Shared Types**: Use definitions from `lib/types/` instead of duplicating local types.
- **Naming Conventions**: Use descriptive, self-documenting names (e.g., `analyzeShelfImage` instead of `runAI`).

### Documentation & Language
- **No Hebrew in Code**: All comments, variable names, and documentation must be in English only.
- **Dead Code**: Automatically identify and remove unused functions or variables.

### Refactoring Instructions for AI
- When asked to add a feature to a file that is near the 500-line limit, your first priority is to suggest a refactoring plan to split the file before adding new code.

## security

### Mandatory Checks (Before Every Commit)
- [ ] No hardcoded secrets (API keys, passwords, tokens) — use environment variables only
- [ ] All user inputs validated (prefer Zod schemas for TypeScript)
- [ ] SQL injection prevention: parameterized queries only via Prisma — never string concatenation
- [ ] XSS prevention: never use `innerHTML` / `dangerouslySetInnerHTML` without sanitization
- [ ] Error messages must not leak sensitive data (stack traces, paths, keys)
- [ ] **User-visible** strings (UI + JSON to the browser): never paste internal diagnostics — use product copy or empty `message` + localized content (see `.cursor/rules/user-facing-copy.mdc`).

### Secret Management
- NEVER hardcode secrets in source code
- ALWAYS use `process.env` or a secret manager
- Validate required secrets exist at startup
- Rotate any secrets that may have been exposed

### Security Breach Protocol
- If security issue found: STOP → fix CRITICAL issues first → review entire codebase for similar patterns

## testing

### Minimum Coverage: 80%
Test types (all required as the project matures):
1. **Unit Tests** — Individual functions, utilities, hooks, components
2. **Integration Tests** — Server actions, database operations
3. **E2E Tests** — Critical user flows (use Playwright)

### TDD Workflow (Mandatory)
1. Write test first → it FAILS (RED)
2. Write minimal implementation → test PASSES (GREEN)
3. Refactor with tests as safety net (IMPROVE)
4. Verify coverage ≥ 80%

## git workflow

### Commit Message Format
```
<type>: <description>
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### Pull Request Process
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to review all changes
3. Draft comprehensive PR summary with test plan
4. Push with `-u` flag if new branch

## agent & parallelism

### Parallel Execution
ALWAYS execute independent operations in parallel. Never run them sequentially when they don't depend on each other.

### Multi-Perspective Analysis
For complex problems, analyze from multiple angles: correctness, security, performance, consistency, redundancy.

## patterns

### Immutability (Critical)
- ALWAYS create new objects, NEVER mutate existing ones
- Use spread operator for object/array updates
- Rationale: prevents hidden side effects, simplifies debugging

### API Response Format (server actions / route handlers)
```typescript
interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Repository Pattern
Encapsulate data access behind a consistent interface: `findAll`, `findById`, `create`, `update`, `delete`. Business logic depends on the abstract interface, not the storage mechanism.

### Stale-While-Revalidate
- Return cached data immediately, revalidate in background
- Prefer TanStack Query / SWR instead of rolling custom caching

### Optimistic Updates
- Snapshot current state → apply optimistic update → roll back on failure → emit visible error feedback

## web performance

### Bundle Budgets
| Page Type | JS Budget (gzipped) | CSS Budget |
|-----------|---------------------|------------|
| Landing page | < 150kb | < 30kb |
| App page | < 300kb | < 50kb |

### Image Optimization
- Explicit `width` and `height` on all images
- `loading="lazy"` for below-the-fold assets
- Prefer AVIF or WebP with fallbacks

### Animation Performance
- Animate only compositor-friendly properties: `transform`, `opacity`, `clip-path`
- Avoid animating layout-bound properties: `width`, `height`, `top`, `left`, `margin`, `padding`

## web design quality

### Anti-Template Policy
Do NOT ship generic-looking UI. Avoid: default card grids, stock hero sections with gradient blobs, uniform radius/spacing/shadows, safe gray-on-white styling, dashboard-by-numbers layouts.

### Required Qualities
Every meaningful surface must demonstrate at least 4 of:
1. Clear hierarchy through scale contrast
2. Intentional rhythm in spacing (not uniform padding everywhere)
3. Depth/layering (overlap, shadows, surfaces, motion)
4. Typography with character and real pairing strategy
5. Color used semantically, not just decoratively
6. Hover/focus/active states that feel designed
7. Grid-breaking editorial or bento composition where appropriate

### Semantic HTML First
Use `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` — never default to `<div>` when a semantic element exists. Include ARIA labels on landmark regions.

### CSS Custom Properties
Define design tokens as variables. Never hardcode palette, typography, or spacing repeatedly. Prefer `oklch()` for colors.
