# NICE Data Platform CoE

A comprehensive data platform vendor intelligence hub built with Next.js. Browse, compare, and evaluate 100+ data platform vendors across 12 categories with AI-powered insights, automated news collection, and detailed scoring.

## Features

- **Vendor Hub** -- Browse 100+ vendors with filtering, search, and tier badges
- **Vendor Comparison** -- Side-by-side radar charts, feature matrices, and benchmark results
- **Scoring Engine** -- Weighted multi-criteria scoring with confidence levels
- **News Feed** -- Aggregated industry news with sentiment analysis and category filtering
- **AI Assistant** -- Chat with an AI analyst powered by Claude (Anthropic)
- **Agent System** -- Automated vendor scouting, news collection, and data refresh via SSE streaming
- **Standards Hub** -- Track compliance standards (SOC 2, ISO 27001, GDPR, etc.)
- **Pricing Calculator** -- Estimate costs across vendors with usage profiles
- **Rankings** -- Dynamic vendor rankings by category with recalculation
- **Evaluations** -- Structured vendor evaluation workflows
- **Dark Mode** -- Full dark/light theme support via next-themes
- **Global Search** -- Search across vendors, products, news, and categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Database | PostgreSQL via Prisma 7 (PrismaPg adapter) |
| AI | Anthropic Claude SDK |
| Charts | Recharts, Nivo (radar) |
| Testing | Vitest, React Testing Library |

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (local or hosted, e.g. Supabase)
- **Anthropic API key** (for AI assistant -- optional for other features)

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd nice-data-platform-
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nice_dp_coe"
ANTHROPIC_API_KEY="sk-ant-..."   # Get from https://console.anthropic.com/
```

### 3. Set up the database

```bash
# Create the database (if using local PostgreSQL)
createdb nice_dp_coe

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data (12 categories, 100+ vendors, news, benchmarks)
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) to view the app.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3005 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Main app pages
│   │   ├── page.tsx          # Dashboard home
│   │   ├── vendors/          # Vendor hub, detail, compare
│   │   ├── categories/       # Category browsing
│   │   ├── news/             # News feed
│   │   ├── assistant/        # AI chat assistant
│   │   ├── rankings/         # Vendor rankings
│   │   ├── standards/        # Compliance standards
│   │   ├── evaluations/      # Vendor evaluations
│   │   └── pricing/          # Pricing calculator
│   └── api/                  # API routes
│       ├── agents/           # Agent triggers (scout, news, refresh)
│       ├── assistant/        # AI chat endpoint
│       ├── vendors/          # Vendor CRUD + compare
│       ├── news/             # News API
│       └── ...
├── components/ui/            # shadcn/ui components
├── lib/
│   ├── prisma.ts             # Database client
│   ├── scoring/              # Scoring engine
│   └── agents/               # Agent implementations
└── test/                     # E2E and integration tests
prisma/
├── schema.prisma             # Database schema (15 models)
└── seed.ts                   # Seed data
```

## Agent System

The platform includes three automated agents:

| Agent | Endpoint | Description |
|-------|----------|-------------|
| Vendor Scout | `POST /api/agents/vendor-scout/trigger` | Discovers and scores new vendors |
| News Collector | `POST /api/agents/news-collector/trigger` | Aggregates industry news with AI categorization |
| Data Refresh | `POST /api/agents/refresh-all` | Full pipeline refresh via SSE stream |

Trigger agents from the Dashboard page using the action buttons.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key for AI features |
| `GITHUB_TOKEN` | No | GitHub token for repo metrics (vendor scout) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase URL for realtime features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `NEXT_PUBLIC_BASE_URL` | No | App base URL (defaults to http://localhost:3005) |

*Required only for AI assistant and agent features that use Claude.

## Testing

```bash
# Run all tests
npm run test:run

# Watch mode
npm test
```

The test suite includes unit tests, component tests, API route tests, and E2E flow tests.
