# Vercel Troubleshooting

## Common Fixes

1. Confirm project Root Directory is `apps/dashboard`.
2. Confirm Install Command in vercel.json matches monorepo root.
3. Confirm environment variables exist in Vercel Dashboard (not just .env.local).
4. If build fails with "module not found", check that `transpilePackages` in next.config.ts includes all workspace deps.
5. If install fails, verify `npx pnpm install --no-frozen-lockfile` can run from monorepo root.
6. Review build logs after deployment.
7. Redeploy after configuration updates via GitHub push or Vercel Dashboard.

## TaskForge Deployment Target

- Frontend: Vercel (apps/dashboard — Next.js 16)
- Backend services: Docker (services/ — Express + WebSocket)
- Database: Supabase (PostgreSQL)
- AI: OpenAI API (server-side only, never exposed to client)

## Vercel Dashboard Settings

When creating/changing the Vercel project:
1. Import git repo: github.com/JustNCase/Taskforge
2. Root Directory: `apps/dashboard`
3. Framework Preset: Next.js
4. Build Command: `npx next build` (defined in apps/dashboard/vercel.json)
5. Install Command: `cd ../.. && npx pnpm install --no-frozen-lockfile` (defined in vercel.json)
6. Output Directory: `.next` (default, defined in vercel.json)

## Build Errors

| Error | Likely Fix |
|---|---|
| `Cannot find module '@taskforge/...'` | transpilePackages in next.config.ts missing the package |
| `pnpm: command not found` | Use `npx pnpm` in install command |
| `Lockfile has different format` | Commit pnpm-lock.yaml at root |
| `Build failed: command not found` | Root Directory must be `apps/dashboard` to find next.config.ts |
