---
title: "dodam — CLAUDE.md"
description: "Development instruction for Claude Code working in the dodam repository"
version: "1.4"
date: "2026-03-10"
language: "en"
---

## CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dodam** is a metadata management platform for governing standard terms, domains, and codes with an approval workflow. It provides a web-based CRUD interface for managing data standards and a role-based approval process for changes.

**Tech Stack:** Next.js 16.1 (App Router), TypeScript 5.9 (strict), PostgreSQL 18, Prisma 7 (Driver Adapter), Better Auth, shadcn/ui, Tailwind CSS 4, TanStack Query v5, Vitest 4, Playwright

**Working directory:** The app lives in `.worktrees/metadata-platform/metadata-platform/` (git worktree on `feature/metadata-platform` branch). All commands run from there.

## Commands

```bash
npm run dev              # Dev server (Turbopack)
# NOTE: In git worktrees, Turbopack fails to resolve tailwindcss.
# Use `npx next dev --webpack` as a workaround.
npm run build            # Production build (uses --webpack, same workaround)
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run
npx tsc --noEmit         # Type-check without emitting

npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Create/apply migrations
npm run db:push          # Push schema (no migration)
npm run db:seed          # Seed data (npx tsx prisma/seed.ts)
npm run db:studio        # Prisma Studio GUI

npx shadcn@latest add <name>  # Add shadcn/ui component (new-york style, lucide icons)
```

## Environment Setup

Copy `.env.example` to `.env` and fill in values. Required vars:

- `DATABASE_URL` — PostgreSQL connection (default port 5433 for Docker)
- `BETTER_AUTH_SECRET` — auth signing secret
- `BETTER_AUTH_URL` — app base URL (`http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` — same, exposed to client
- `NEXT_PUBLIC_APP_NAME` — app display name (Korean default: "메타데이터 관리 플랫폼")

## Architecture

### Data Flow

``` markdown
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
Workflow: ApprovalRequest, ApprovalHistory (PENDING → REVIEWING → APPROVED/REJECTED). Entity POST auto-creates ApprovalRequest; approval transitions entity DRAFT → ACTIVE.

### TanStack Query

- `QueryProvider` wraps root layout with `staleTime: 60s`, `retry: 1`
- Query key factory at `src/lib/query/keys.ts` — use `queryKeys.domains.all` for invalidation, `queryKeys.domains.list(params)` for filtered queries
- API client at `src/lib/api/client.ts` — typed fetch wrapper

### Component Organization

- `components/ui/` — shadcn/ui primitives (do not edit manually)
- `components/layout/` — app shell: sidebar, header, user-nav
- `components/{domain,standard,code}/` — entity-specific: `<entity>-table.tsx`, `<entity>-form.tsx`
- `components/shared/` — cross-entity reusables (`data-table-pagination.tsx`, `status-badge.tsx`)
- `components/workflow/` — approval workflow: request table, timeline, detail actions, status badge

### CRUD Page Routes

Each entity under `(dashboard)/<entity>/`: `page.tsx` (list), `new/page.tsx` (create), `[id]/page.tsx` (detail), `[id]/edit/page.tsx` (edit)

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
// Error codes: VALIDATION_ERROR(400), UNAUTHORIZED(401), FORBIDDEN(403), NOT_FOUND(404), DUPLICATE(409), INTERNAL_ERROR(500)
```

All API Routes use try-catch with this format. Validate inputs with Zod.
API user-facing error messages are written in Korean (한국어).

### Validation Schemas

Located in `src/lib/validations/<entity>.ts`. Pattern:

```typescript
export const entityCreateSchema = z.object({ ... })
export const entityUpdateSchema = entityCreateSchema.partial()
```

Forms use `react-hook-form` with `@hookform/resolvers/zod` for Zod schema integration.

### API Auth Guards

Use `requireAuth()` for read endpoints, `requireRole([...])` for write endpoints (from `src/lib/auth/require-role.ts`).
Pattern: `const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER]); if ('error' in authResult) return authResult.error`

## Testing

- **Unit tests:** Vitest + jsdom + @testing-library/react. Intended dir: `tests/` (mirror src structure, not yet created). `globals: true` — no need to import describe/it/expect
- **Vitest setup:** `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` (custom matchers)
- **E2E tests:** Playwright (planned, `e2e/` directory)
- **Coverage target:** 70%

## Git Conventions

- **Branches:** `feature/`, `fix/`, `docs/`, `refactor/`, `chore/` + description
- **Commits:** English, Conventional Commits — `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Strategy

- **Feature branches** (`feature/*`): Create a PR to `main` only after ALL tasks are complete and integration/E2E tests pass. Do not create intermediate PRs per task — accumulate commits on the feature branch.
- **Global config changes** (CLAUDE.md, .gitignore, CI configs): These are branch-independent. Create a separate short-lived branch (e.g. `docs/...`, `chore/...`) off `main`, PR immediately, and merge.
- **Before creating any PR:** Run `npx tsc --noEmit`, `npm run build`, and `npm run test:run` to verify. All must pass.
- **PR format:** Use `gh pr create` with `## Summary` (bullet points) and `## Test plan` (checklist) sections.

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
- When creating or modifying frontend UI components/pages: run `frontend-design:frontend-design` skill
- After each task: update release notes in `docs/releases/`
- Before claiming completion: run `npx tsc --noEmit` and `npm run build` to verify
