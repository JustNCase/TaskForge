# TaskForgeAI

A comprehensive business management platform for contractors and service professionals. Manage jobs, clients, invoicing, estimates, team scheduling, and finances — all in one place with AI-powered assistance.

## Overview

TaskForgeAI is a full-stack SaaS application built as a Next.js monorepo. It provides contractors, freelancers, and service businesses with the tools they need to run their operations: from job scheduling and client management to invoicing, payments, team collaboration, and financial tracking.

## Features

### Core Business
- **Dashboard** — Real-time overview of jobs, revenue, outstanding invoices, and key metrics
- **Jobs** — Create, schedule, track, and manage service jobs with status workflows
- **Clients** — Client database with contact info, job history, and notes
- **Estimates** — Create and send estimates with line items, tax, and status tracking
- **Invoices** — Generate invoices from jobs/estimates, track payment status
- **Projects** — Organize work into projects with team collaboration

### Team & Scheduling
- **Teams** — Create teams, invite members, assign roles and hourly rates
- **Calendar** — Monthly calendar view for scheduling jobs and events with color coding
- **Job Assignments** — Assign team members to specific jobs

### Financial
- **Wallet** — Track earnings balance with full transaction history
- **Withdrawals** — Request payouts via bank transfer, PayPal, or Stripe
- **Referrals** — Unique referral codes, $5 reward per successful referral
- **Stripe Connect** — Marketplace seller onboarding for payouts
- **Subscriptions** — Starter ($49/mo) and Pro ($99/mo) plans with Stripe checkout
- **Income Tracking** — View income by category and time period

### AI & Productivity
- **AI Task Breakdown** — Break complex tasks into subtasks with AI
- **AI Assistant** — AI-powered suggestions and task management
- **Focus Mode** — Pomodoro timer linked to active tasks
- **Achievements** — Gamified progress tracking and milestones
- **Analytics** — Task completion rates, category breakdowns, difficulty stats

### Platform
- **Authentication** — Supabase auth with email/password, password reset, protected routes
- **Marketplace** — Buy/sell digital products and templates
- **Notifications** — In-app notifications with preferences
- **Admin Dashboard** — Platform-wide metrics (admin-only)
- **Theme Toggle** — Dark/light mode support
- **Keyboard Shortcuts** — Quick navigation and actions
- **Onboarding Tour** — Guided first-use experience
- **Settings** — Export data, manage preferences

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Payments | Stripe (subscriptions + Connect) |
| AI | OpenAI API |
| Package Manager | pnpm 9.15+ |
| Monorepo | Turborepo |

## Project Structure

```
├── apps/
│   ├── dashboard/     # Main Next.js app (UI + API routes)
│   ├── api/           # Standalone API services
│   └── web/           # Marketing/landing pages
├── packages/
│   ├── ai-core/       # AI task engine
│   ├── database/      # Database utilities
│   ├── types/         # Shared TypeScript types
│   └── ui/            # Shared UI components
├── database/
│   ├── schema.sql     # Base schema
│   ├── migrations/    # 14 migration files
│   └── supabase/      # Supabase-specific schemas
├── docs/              # Architecture, deployment, security docs
└── scripts/           # Setup and dev scripts
```

## Getting Started

**Prerequisites:**
- Node.js 20+
- pnpm 9.15.4+
- Supabase project (free tier works)
- Stripe account (for payments)

**Install:**
```bash
pnpm install
```

**Environment:**
```bash
cp .env.example .env.local
# Fill in Supabase and Stripe keys
```

**Run:**
```bash
pnpm dev
```

**Database:**
Run all migration files in `database/migrations/` against your Supabase SQL editor, in order.

## Roadmap

- [x] v0.2 — Authentication, Wallet, Referrals, Withdrawals
- [x] v0.3 — Team management, Calendar, Stripe Connect
- [ ] v0.4 — AI photo diagnostics, Mobile app
- [ ] v0.5 — Advanced analytics, Automation workflows
