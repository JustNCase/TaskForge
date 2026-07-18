# Getting Started with Genesis-OS

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (optional)
- pnpm or npm

## Quick Start

```bash
# Clone and install
git clone https://github.com/JustNCase/genesisos.git
cd genesisos
cp .env.example .env

# Install dependencies
npm install

# Start with Docker
docker-compose up -d

# Or start manually
npm run dev
```

## Development

```bash
# Web app
cd apps/web && npm run dev

# API service
cd services/api && npm run dev

# Voice service
cd services/voice && npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `OPENAI_API_KEY` — Required for AI features
- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Redis connection
