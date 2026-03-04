---
title: "dodam — CLAUDE.md"
description: "Development instruction for Claude Code working in the dodam repository"
version: "1.0"
date: "2026-03-04"
language: "en"
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dodam** is a metadata management platform for governing standard terms, domains, and codes with an approval workflow. It provides a web-based CRUD interface for managing data standards and a role-based approval process for changes.

**Tech Stack:** Next.js 16.1 (App Router), TypeScript 5.9 (strict), PostgreSQL 18, Prisma 7 (Driver Adapter), Better Auth, shadcn/ui, Tailwind CSS 4, TanStack Query v5, Vitest 4, Playwright

**Working directory:** The app lives in `.worktrees/metadata-platform/metadata-platform/` (git worktree on `feature/metadata-platform` branch). All commands run from there.

## Commands

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run
npx tsc --noEmit         # Type-check without emitting

npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Create/apply migrations
npm run db:push          # Push schema (no migration)
npm run db:seed          # Seed data (npx tsx prisma/seed.ts)
npm run db:studio        # Prisma Studio GUI
```

## Architecture

### Data Flow

```
Browser → proxy.ts (route protection) → App Router pages
  ↓ client components use:
  TanStack Query (QueryProvider in root layout)
    → apiClient (src/lib/api/client.ts) → fetch
      → API Routes (src/app/api/...)
        → Prisma (Driver Adapter + PrismaPg) → PostgreSQL
```

### Authentication

- **Server:** Better Auth with Prisma adapter (`src/lib/auth/index.ts`)
- **Client:** `createAuthClient` from `better-auth/react` (`src/lib/auth/client.ts`)
- **Route protection:** `src/proxy.ts` (Next.js 16 pattern, replaces middleware)
  - Protected: `/standards`, `/domains`, `/codes`, `/workflow`, `/admin`
  - Auth pages (`/login`, `/signup`) redirect authenticated users to `/standards`
- **RBAC:** 4 roles — ADMIN, STANDARD_MANAGER, APPROVER, VIEWER
  - Server actions: `assignDefaultRole()`, `getUserRoles()` in `src/lib/auth/actions.ts`

### Prisma 7 Specifics

- **Import from `@/generated/prisma/client`** — NOT `@prisma/client`. Prisma 7 generates to `src/generated/prisma/` and has no `index.ts`, so directory imports fail.
- **Driver Adapter pattern:** Uses `PrismaPg` adapter for flexible deployment (`src/lib/db/prisma.ts`)
- **Config:** `prisma.config.ts` requires `import "dotenv/config"` (dotenv is a dev dependency)
- **Docker PostgreSQL uses port 5433** (avoids local PG 5432 conflict)

### Data Models

RBAC: User, Role, UserRole, Session, Account, Verification
Standards: StandardDomain, StandardTerm, CodeGroup, CodeItem
Workflow: ApprovalRequest, ApprovalHistory (PENDING → REVIEWING → APPROVED/REJECTED)

### TanStack Query

- `QueryProvider` wraps root layout with `staleTime: 60s`, `retry: 1`
- Query key factory at `src/lib/query/keys.ts` — use `queryKeys.domains.all` for invalidation, `queryKeys.domains.list(params)` for filtered queries
- API client at `src/lib/api/client.ts` — typed fetch wrapper

## Code Style

- **File naming:** kebab-case (`query-keys.ts`, `auth-client.ts`)
- **Exports:** named exports only. Exception: `page.tsx`, `layout.tsx` use default export (Next.js requirement)
- **`'use client'`:** Apply at the smallest component level that needs interactivity, not at page level
- **Import order** (groups separated by blank line):
  1. React / Next.js
  2. External libraries
  3. Internal modules (`@/...`)
  4. Relative imports (`./...`)

### API Response Format

```typescript
// Success
NextResponse.json({ data: T, pagination?: { page, size, total } })

// Error — use matching HTTP status codes
NextResponse.json(
  { error: { code: 'NOT_FOUND', message: '...' } },
  { status: 404 }
)
// Error codes: VALIDATION_ERROR(400), UNAUTHORIZED(401), FORBIDDEN(403), NOT_FOUND(404), INTERNAL_ERROR(500)
```

All API Routes use try-catch with this format. Validate inputs with Zod.

## Testing

- **Unit tests:** `tests/` directory (mirrors src structure). Vitest + jsdom + @testing-library/react
- **E2E tests:** `e2e/` directory. Playwright
- **Coverage target:** 70%

## Git Conventions

- **Branches:** `feature/`, `fix/`, `docs/`, `refactor/`, `chore/` + description
- **Commits:** English, Conventional Commits — `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Documentation

- All markdown docs use YAML frontmatter for metadata (`title`, `date`, `version`, etc.) — never bold text in body for metadata
- Implementation plans: `docs/plans/YYYY-MM-DD-<topic>-impl.md`
- Design docs: `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Release notes: `docs/releases/YYYY-MM-DD-<project>-v<X.Y.Z>.md`
- Code comments only where business logic is non-obvious

## Boundaries

**Always:** TypeScript strict mode, standard API response format, Zod input validation, error handling in all API routes, YAML frontmatter in docs

**Ask First:** New external packages, Prisma schema changes, new/modified environment variables, API request/response format changes

**Never:** Commit `.env`, use `@ts-ignore` or `as any`, delete or skip tests, hardcode credentials, directly modify `node_modules/`, `.next/`, or `dist/`

## Workflow

- Before each task: run `superpowers:brainstorming`
- After each task: update release notes in `docs/releases/`
- Before claiming completion: run `npx tsc --noEmit` and `npm run build` to verify
