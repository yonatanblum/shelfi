# Shelfi

Pharmacy shelf image analysis dashboard (Next.js + Prisma + Gemini).

## Getting Started

```bash
git clone <repository-url>
cd shelfi
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (runs Prisma generate first) |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Prisma migrations |

See `docs/technical-architecture.md` and `AGENTS.md` for architecture and agent standards.
