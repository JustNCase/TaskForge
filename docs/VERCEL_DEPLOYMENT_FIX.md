# Vercel Deployment Fix

## Monorepo Configuration

Root Directory:
apps/dashboard

Framework:
Next.js

Install Command (set in vercel.json at apps/dashboard/vercel.json):
cd ../.. && npx pnpm install --no-frozen-lockfile

Build Command (set in vercel.json):
npx next build

## Critical Notes

- The `apps/dashboard/vercel.json` file handles the monorepo install by cd-ing two levels up to the root.
- Vercel's Root Directory setting must be `apps/dashboard` (not the repo root).
- Must use pnpm (not npm) — `apps/dashboard/vercel.json` runs `npx pnpm install`.

## Environment Variables (set in Vercel Dashboard)

Required:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- OPENAI_API_KEY (for AI features)
- NEXT_PUBLIC_SITE_URL (https://taskforge.vercel.app)

Optional:
- SUPABASE_SERVICE_ROLE_KEY (for admin operations)

## Verification

- Confirm Vercel project Root Directory = `apps/dashboard`
- Confirm Install Command = `cd ../.. && npx pnpm install --no-frozen-lockfile`
- Confirm Build Command = `npx next build`
- Check production build logs
- Confirm routes work
- Confirm environment variables are injected
- Redeploy after changes
