# Pinkplan

Pinkplan is a Next.js + TypeScript workspace for product planning, collaboration, intelligence features, and scale-oriented operations.

## Stack In Use

- Next.js + React + TypeScript
- Tailwind CSS + shadcn/Radix UI
- Genkit for AI flows
- PostgreSQL via Prisma
- Redis for caching and runtime infrastructure support

## Infrastructure Setup

Create a local environment file from the example values and point it at your PostgreSQL and Redis instances.

Required variables:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH` (server-side, path to Firebase Admin JSON file)

Example workflow:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## API Endpoints

- `GET /api/infra/health` checks PostgreSQL and Redis connectivity.
- `GET /api/projects` returns projects from PostgreSQL and caches the response in Redis.
- `POST /api/projects` creates a project in PostgreSQL and invalidates the cached list.
# airtyn
