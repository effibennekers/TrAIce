# Migrating from Lovable to GitHub

This project was originally built on [Lovable](https://lovable.dev). The
repository is ready to run standalone on GitHub, but a few Lovable-specific
plumbing files remain so the live Lovable preview keeps working while both
environments are used in parallel. Complete the steps below **once** after
you no longer need the Lovable preview.

## 1. Install dependencies

```bash
bun install     # or: npm install
```

Requires Node.js 20+.

## 2. Run locally

```bash
bun dev
```

The app should come up at http://localhost:8080 with the sample dashboard.

## 3. Replace the Lovable Vite config (one-way)

`vite.config.ts` currently imports `defineConfig` from
`@lovable.dev/vite-tanstack-config`. That package bundles the plugins TanStack
Start needs. To remove the Lovable dependency entirely:

1. Remove the dependency:

   ```bash
   bun remove @lovable.dev/vite-tanstack-config
   ```

2. Replace `vite.config.ts` with:

   ```ts
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import tsconfigPaths from "vite-tsconfig-paths";
   import tailwindcss from "@tailwindcss/vite";
   import { tanstackStart } from "@tanstack/react-start/plugin/vite";
   import { cloudflare } from "@cloudflare/vite-plugin";

   export default defineConfig({
     server: { host: "::", port: 8080 },
     plugins: [
       tsconfigPaths(),
       tailwindcss(),
       tanstackStart({ target: "cloudflare-module" }),
       react(),
       cloudflare({ viteEnvironment: { name: "ssr" } }),
     ],
   });
   ```

   Adjust the `tanstackStart` target if you deploy somewhere other than
   Cloudflare (e.g. `"node-server"` for a plain Node host).

3. Verify: `bun run build` and `bun dev`.

Once this swap is done, the two-way sync with the Lovable editor will stop
working — this is a one-way export.

## 4. Remove other Lovable artefacts (optional)

- Delete `.lovable/` if the folder is still present.
- Remove any residual `author: "Lovable"` / `twitter:site: "@Lovable"` meta
  tags — this repo already updated them, but re-check `src/routes/__root.tsx`
  after future edits.

## 5. Configure hosting

Pick a host and wire it up:

- **Cloudflare Workers** — `bunx wrangler deploy` (uses `wrangler.jsonc`).
- **Vercel / Netlify / Cloudflare Pages** — build with `bun run build`, then
  serve TanStack Start's `.output/` per the platform's Node/edge instructions.

## 6. Environment variables

None are needed at the moment. Copy `.env.example` to `.env` when you add any,
and never commit `.env`.

## 7. Sanity checklist

- [ ] `bun install` succeeds
- [ ] `bun dev` serves the dashboard at http://localhost:8080
- [ ] `bun run build` completes without errors
- [ ] `bun run lint` passes
- [ ] No `Lovable` strings remain in `src/`
- [ ] `.env` is git-ignored (already covered by `.gitignore`)
