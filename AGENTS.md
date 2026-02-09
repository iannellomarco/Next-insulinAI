# InsulinAI - Agent Guide

## Project Overview

**InsulinAI** is an AI-powered insulin dosage calculator web application built with Next.js. It helps people with diabetes make informed insulin dosing decisions through food image analysis and nutritional data.

**Key Capabilities:**
- 📸 Food image analysis (AI-powered carb counting)
- ✍️ Manual food entry
- 🧮 Smart insulin dosing calculations
- 🍕 Split bolus detection for high-fat meals
- 📊 History tracking with cloud sync
- 📈 Advanced reporting with charts
- ⏱️ 2-hour post-meal glucose tracking
- 🔄 Multi-device synchronization

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Auth | Clerk |
| Database | PostgreSQL (Prisma Postgres) |
| ORM | Drizzle ORM |
| AI | Perplexity AI (sonar-pro model), OpenAI |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Deployment | Vercel |

---

## Project Structure

```
/Users/marcoiannello/.gemini/antigravity/scratch/insulin-calc-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions.ts          # Server actions for auth/sync
│   │   ├── actions/libre.ts    # Libre CGM integration
│   │   ├── api/
│   │   │   ├── analyze/route.ts          # Web food analysis (Perplexity)
│   │   │   └── mobile/
│   │   │       ├── analyze/route.ts      # Mobile API (Perplexity)
│   │   │       ├── analyze-openai/route.ts # Mobile API (OpenAI)
│   │   │       ├── history/route.ts      # Mobile history sync
│   │   │       ├── key-exchange/route.ts # E2E encryption keys
│   │   │       ├── ping/route.ts         # Health check
│   │   │       └── settings/route.ts     # Mobile settings sync
│   │   ├── sign-in/[[...rest]]/
│   │   ├── sign-up/[[...rest]]/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React components
│   │   ├── ui/                 # UI primitives
│   │   ├── AppLogic.tsx        # Main app logic
│   │   ├── HistoryView.tsx     # History/reporting UI
│   │   ├── ResultsView.tsx     # Analysis results display
│   │   ├── SettingsModal.tsx   # Settings UI
│   │   └── [...].tsx
│   ├── db/
│   │   ├── index.ts            # Drizzle client
│   │   └── schema.ts           # Database schema
│   ├── lib/
│   │   ├── ai-service.ts       # AI analysis client
│   │   ├── crypto.ts           # Encryption utilities
│   │   ├── favorites-algorithm.ts # Smart favorites
│   │   ├── off-service.ts      # Offline food analysis
│   │   ├── store.tsx           # Zustand state store
│   │   ├── translations.ts     # i18n (en/it)
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── middleware.ts           # Clerk auth middleware
├── drizzle/                    # Migration files
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── .env.local                  # Environment variables
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

---

## Key Files Reference

### Core Application
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with Clerk provider |
| `src/app/page.tsx` | Main page (redirects to app) |
| `src/components/AppLogic.tsx` | Main application component |
| `src/lib/store.tsx` | Zustand store (state management) |

### API Routes
| Route | Purpose |
|-------|---------|
| `/api/analyze` | Web food analysis (Perplexity AI) |
| `/api/mobile/analyze` | Mobile food analysis (Perplexity) |
| `/api/mobile/analyze-openai` | Mobile food analysis (OpenAI fallback) |
| `/api/mobile/history` | Sync history data |
| `/api/mobile/settings` | Sync user settings |
| `/api/mobile/key-exchange` | E2E encryption key exchange |

### Database
| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Table definitions (history_items, user_settings) |
| `src/db/index.ts` | Drizzle ORM client |

### Types
| File | Purpose |
|------|---------|
| `src/types/index.ts` | Core types: Settings, AnalysisResult, HistoryItem, etc. |

---

## Environment Variables

Required in `.env.local`:

```bash
# Perplexity AI
PERPLEXITY_API_KEY=your_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

# Database (Prisma Postgres)
POSTGRES_URL=your_postgres_url
PRISMA_DATABASE_URL=your_prisma_accelerate_url
DATABASE_URL=your_postgres_url
```

---

## Database Schema

### `history_items`
- `id` (text, PK)
- `userId` (text) - Clerk user ID
- `timestamp` (timestamp)
- `data` (jsonb) - Full HistoryItem object
- `createdAt` (timestamp)

### `user_settings`
- `userId` (text, PK) - Clerk user ID
- `carbRatio` (double)
- `carbRatios` (jsonb) - Per-meal ratios
- `useMealSpecificRatios` (boolean)
- `correctionFactor` (double)
- `targetGlucose` (integer)
- `highThreshold` / `lowThreshold` (integer)
- `smartHistory` (boolean)
- `libreUsername` / `librePassword` (text)
- `language` (text) - 'en' or 'it'
- `analysisMode` (text) - 'pplx_only', 'off_only', 'hybrid'
- `aiProvider` (text) - 'perplexity' or 'openai'
- `mealRemindersEnabled` (boolean)
- `reminderTimes` (jsonb)
- `updatedAt` (timestamp)

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Database
npx drizzle-kit push # Push schema changes to DB
npx drizzle-kit pull # Pull schema from DB

# Build & Deploy
npm run build        # Production build
npm run start        # Start production server
```

---

## Key Concepts

### Meal Periods
- **Breakfast**: 5:00 - 11:00
- **Lunch**: 11:00 - 16:00
- **Dinner**: 16:00 - 5:00 (next day)

### Split Bolus Detection
Triggered when `fat > 20g AND protein > 25g`. Recommends 50% upfront, 50% extended over 2-3 hours.

### Analysis Modes
- `pplx_only`: Use Perplexity AI only
- `off_only`: Use offline algorithm only
- `hybrid`: Combine both (not fully implemented)

### Mobile API Encryption
Mobile endpoints use E2E encryption via `/api/mobile/key-exchange`. See `src/lib/crypto.ts`.

---

## Coding Guidelines

1. **TypeScript**: Use strict types. Define interfaces in `src/types/index.ts`.
2. **Components**: Use functional components with hooks. Keep UI components in `src/components/`.
3. **State**: Use Zustand for global state (see `src/lib/store.tsx`).
4. **API Routes**: Use `src/app/api/*/route.ts` pattern. Handle auth via Clerk.
5. **Database**: Use Drizzle ORM. Schema changes require `npx drizzle-kit push`.
6. **Translations**: Support English (`en`) and Italian (`it`). Add strings to `src/lib/translations.ts`.
7. **Environment**: Never commit `.env.local`. Use Vercel env vars for production.

---

## Mobile App Integration

This web app provides backend APIs for the iOS companion app (`insulinAI-iOS`). Mobile endpoints:
- Use E2E encryption (RSA key exchange)
- Sync history and settings
- Support both Perplexity and OpenAI for analysis

See mobile API routes in `src/app/api/mobile/`.
