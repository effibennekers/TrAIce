# TrAIce

TrAIce is a frontend-only prototype dashboard for exploring enterprise AI usage
and its energy footprint. It was built by contributors from ING, RVO, UWV, DNB,
UvA, and the University of Twente during a TNO challenge on measuring the
energy footprint of AI.

The app ships with a synthetic sample dataset and lets users upload their own
CSV to explore charts, breakdowns, and trends. All data processing happens in
the browser — there is no backend, database, or authentication.

## Features

- Interactive dashboards for AI usage, cost, and energy metrics
- Bundled synthetic sample dataset (anchored to 15 June 2026 by default)
- Client-side CSV upload — data never leaves the browser
- Responsive UI built with shadcn/ui, Radix, Tailwind CSS v4, and Recharts
- File-based routing via TanStack Router / TanStack Start

## Tech stack

- React 19 + TypeScript
- TanStack Start v1 (Vite 7) with file-based routing
- Tailwind CSS v4 + shadcn/ui + Radix primitives
- Recharts for visualisations
- PapaParse for client-side CSV parsing
- Framer Motion for animations

## Project structure

```
public/                  Static assets (incl. sample-ai-usage.csv)
src/
  components/            UI + feature components (shadcn/ui in components/ui)
  hooks/                 Reusable React hooks
  lib/                   Data model, mock data, CSV parsing, helpers
  routes/                File-based routes (TanStack Router)
  router.tsx             Router bootstrap
  routeTree.gen.ts       AUTO-GENERATED — do not edit
  styles.css             Tailwind v4 entry
```

## Requirements

- Node.js 20+ (22 recommended)
- npm, pnpm, or bun

## Installation

```bash
# with bun (recommended, matches the lockfile)
bun install

# or with npm
npm install
```

## Local development

```bash
bun dev        # or: npm run dev
```

The app runs at http://localhost:8080.

## Build

```bash
bun run build         # production build
bun run build:dev     # dev-mode build (source maps, unminified)
bun run preview       # preview the production build locally
```

## Environment variables

None are required. See `.env.example` for the current (empty) contract and
guidance for adding future variables.

## Data model

The sample CSV in `public/sample-ai-usage.csv` uses fully synthetic data
(fictional user ids like `u1000`, made-up department/provider labels). See
`src/lib/csv-parser.ts` and `src/lib/mock-data.ts` for column definitions and
the types used across the dashboard.

When no CSV has been uploaded, the dashboard "today" is anchored to
**15 June 2026** so the sample charts always show a consistent view. Uploading
a real CSV disables that override and uses the current date.

## Deployment

Any static-friendly Node host works. Two common options:

- **Cloudflare Workers** — a `wrangler.jsonc` is included. Deploy with
  `bunx wrangler deploy` after `bun run build`.
- **Vercel / Netlify / Cloudflare Pages** — point the platform at this repo,
  set the build command to `bun run build` (or `npm run build`), and serve
  the generated `.output/` directory as documented by TanStack Start.

## Migrating from Lovable

If you exported this repository from Lovable, read `MIGRATION.md` for the
one-time steps to make the project fully standalone (Vite config swap, etc.).

## License

Prototype — no license granted by default. Contact the contributors before
reusing beyond evaluation.
