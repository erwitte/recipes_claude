# Recipes

A personal recipe box with albums. See `CONTEXT.md` for domain vocabulary and `CLAUDE.md` for tech stack / scope.

## Layout

- `backend/` — Bun + TypeScript, tRPC API, Drizzle ORM over Postgres, Clerk auth, MinIO-backed image storage.
- `frontend/` — React + TypeScript (Vite), tRPC client, Clerk.

## Setup

```
bun install
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, filling in Clerk keys and MinIO credentials.

### Database

Point `DATABASE_URL` at a Postgres instance, then run migrations:

```
cd backend
bun run db:migrate
```

### Tests

Backend tests run against a real Postgres database (not mocked). Start one and point `TEST_DATABASE_URL` at it:

```
docker run -d --name recipes_test_pg -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=recipes_test -p 5433:5432 postgres:17-alpine
cd backend
DATABASE_URL="postgres://test:test@localhost:5433/recipes_test" bunx drizzle-kit generate
DATABASE_URL="postgres://test:test@localhost:5433/recipes_test" bun run src/db/migrate.ts
TEST_DATABASE_URL="postgres://test:test@localhost:5433/recipes_test" bun test
```

Auth and image storage are faked in tests (fixed `userId`, in-memory `ImageStorage`) — no live Clerk or MinIO calls.

### Dev servers

```
cd backend && bun run dev
cd frontend && bun run dev
```
