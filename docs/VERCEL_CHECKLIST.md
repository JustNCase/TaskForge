# Vercel Production Checklist

- Project: taskforge (team: JustNCase)
- Root directory: apps/dashboard
- Framework: Next.js
- Install command: `cd ../.. && npx pnpm install --no-frozen-lockfile`
- Build command: `cd ../.. && npx pnpm --filter @taskforge/dashboard build`
- Output directory: apps/dashboard/.next
- Verify environment variables set in Vercel dashboard
- Verify production build with `pnpm --filter @taskforge/dashboard build`
- Redeploy after configuration changes
