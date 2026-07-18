# TaskForge-OS

A unified monorepo combining **TaskForgeAI** (business management for contractors) and **GenesisOS** (AI-powered voice-controlled dashboard). Manage jobs, clients, invoicing, scheduling, and finances — with AI assistants, voice control, and real-time analytics.

## Overview

TaskForge-OS is a full-stack platform built as a Turborepo monorepo with pnpm workspaces. It provides contractors, freelancers, and service businesses with tools to run their operations, augmented by AI-powered diagnostics, voice control, and multi-service architecture.

## Features

### TaskForgeAI — Business Management
- **Dashboard** — Real-time overview of jobs, revenue, invoices, and key metrics
- **Jobs** — Create, schedule, track, and manage service jobs with status workflows
- **Clients** — Client database with contact info, job history, and notes
- **Estimates & Invoices** — Create, send, and track estimates and invoices
- **Projects** — Organize work into projects with team collaboration
- **Teams** — Create teams, invite members, assign roles and hourly rates
- **Calendar** — Monthly calendar view for scheduling jobs and events
- **Wallet & Payments** — Track earnings, request payouts via Stripe/PayPal/bank transfer
- **Stripe Connect** — Marketplace seller onboarding for payouts
- **Subscriptions** — Starter and Pro plans with Stripe checkout
- **Referrals** — Unique referral codes with $5 reward per referral
- **AI Task Breakdown** — Break complex tasks into subtasks with AI
- **Marketplace** — Buy/sell digital products and templates
- **Admin Dashboard** — Platform-wide metrics (admin-only)
- **Auth** — Supabase auth with email/password, password reset, protected routes

### GenesisOS — AI Voice Dashboard
- **Voice Control** — Whisper STT + OpenAI TTS for hands-free interaction
- **AI Assistant** — Chat with AI, analyze images via vision, detect hardware faults
- **Vision Diagnostics** — Camera-based hardware inspection and repair guidance
- **Real-time Analytics** — Event streaming, metrics dashboards, trend analysis
- **Multi-Provider Integrations** — Webhooks, sync status, provider management
- **Notifications** — Real-time notification system with preferences
- **Security** — Auth, RBAC, rate limiting, audit logging, threat detection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15/16, React 19, Tailwind CSS |
| Backend | Node.js services, tsx runtime |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth, JWT, RBAC |
| Payments | Stripe (subscriptions + Connect) |
| AI | OpenAI (GPT-4, Whisper, TTS, Vision) |
| Real-time | WebSocket, Server-Sent Events |
| Package Manager | pnpm 9.15+ |
| Monorepo | Turborepo |

## Project Structure

```
├── apps/
│   ├── dashboard/           # TaskForgeAI main Next.js app
│   ├── web-genesisos/       # GenesisOS AI voice dashboard (Next.js 15)
│   ├── api/                 # Standalone API services
│   └── Web/                 # Marketing/landing pages
├── services/                # GenesisOS microservices
│   ├── ai/                  # AI pipeline — chat, vision, embeddings, task decomposition
│   ├── analytics/           # Real-time analytics, metrics, event streaming
│   ├── api/                 # Central API gateway, routing, auth middleware
│   ├── events/              # Event bus, pub/sub, WebSocket server
│   ├── integration/         # Multi-provider integration hub (webhooks, sync)
│   ├── notifications/       # Notification service (email, push, in-app)
│   ├── security/            # Auth, RBAC, rate limiting, threat detection, audit
│   ├── vision/              # Computer vision — image analysis, OCR, diagnostics
│   └── voice/               # Voice pipeline — Whisper STT, OpenAI TTS, wake word
├── packages/                # Shared libraries
│   ├── ai/                  # AI/ML utilities and model clients
│   ├── ai-core/             # Core AI task engine
│   ├── core/                # Core business logic, utilities, types
│   ├── database/            # Database utilities and Supabase client
│   ├── integration/         # Integration SDK and provider interfaces
│   ├── security/            # Security utilities and middleware
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   ├── vision/              # Vision processing utilities
│   └── voice/               # Voice processing utilities
├── database/
│   ├── schema.sql           # Base schema
│   ├── migrations/          # Migration files
│   └── supabase/            # Supabase-specific schemas
├── docs/                    # Architecture, deployment, security docs
├── scripts/                 # Setup and dev scripts
├── docker-compose.yml       # Service orchestration
├── turbo.json               # Turborepo task config
└── tsconfig.base.json       # Shared TypeScript config
```

## Getting Started

**Prerequisites:**
- Node.js 20+
- pnpm 9.15.4+
- Supabase project (free tier works)
- Stripe account (for payments)
- OpenAI API key (for AI features)

**Install:**
```bash
pnpm install
```

**Environment:**
```bash
cp .env.example .env.local
# Fill in Supabase, Stripe, and OpenAI keys
```

**Development:**
```bash
pnpm dev              # All apps
pnpm dev:dashboard    # TaskForgeAI dashboard only
pnpm dev:genesisos    # GenesisOS dashboard only
pnpm dev:voice        # Voice service only
pnpm dev:api          # API gateway only
```

**Database:**
Run all migration files in `database/migrations/` against your Supabase SQL editor, in order.

**Docker:**
```bash
docker compose up -d  # Start all services
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean build artifacts |

## Workspace Packages

24 workspace projects across 3 categories:

- **4 apps** — dashboard, web-genesisos, api, Web
- **10 packages** — shared libraries (core, ai, security, voice, etc.)
- **9 services** — GenesisOS microservices (ai, analytics, api, events, etc.)
- **1 root** — monorepo root

## Roadmap

- [x] v0.2 — Authentication, Wallet, Referrals, Withdrawals
- [x] v0.3 — Team management, Calendar, Stripe Connect
- [x] v0.4 — GenesisOS merge — AI voice, vision, analytics, microservices
- [ ] v0.5 — Mobile app, advanced analytics, automation workflows
- [ ] v0.6 — Plugin system, custom integrations, marketplace expansion
