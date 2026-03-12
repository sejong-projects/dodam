---
title: "E2E 테스트 설계"
date: 2026-03-12
version: "1.0"
branch: feature/metadata-platform
task: "Task 12 from metadata-platform-impl-v2"
---

# E2E Tests Design (Playwright)

## Overview

Playwright E2E tests for the dodam metadata management platform. Full coverage of all major features: auth, 3 CRUD entities (domains, terms, codes), approval workflow, and admin user management. This is the final quality gate before PR'ing `feature/metadata-platform` to `main`.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full coverage (~23 tests, 6 specs) | Last task before PR — need confidence in all features |
| Database strategy | Fresh DB per run (push --force-reset + seed) | Eliminates flakiness from leftover data |
| Auth state | Playwright storageState per role | Idiomatic, fast — avoids login per test |
| Browser | Chromium only | Internal tool, cross-browser not needed at MVP |
| Architecture | Project-based auth setup, flat specs | Right balance without over-engineering (no POM) |

## Prerequisites

- Install `@playwright/test` as devDependency: `npm install -D @playwright/test`
- Install Chromium browser: `npx playwright install chromium`
- Add `e2e/.auth/` to `.gitignore` (storageState files contain session cookies)

## File Structure

```
playwright.config.ts
e2e/
├── global-setup.ts           # DB reset + seed
├── setup/
│   └── auth.setup.ts         # Authenticate 3 roles → save storageState
├── fixtures/
│   └── test-data.ts          # Shared constants & factory functions
├── auth.spec.ts              # Auth flow (no pre-auth)
├── domains.spec.ts           # Domain CRUD (admin state)
├── standards.spec.ts         # Standard term CRUD (manager state)
├── codes.spec.ts             # Code group CRUD (manager state)
├── workflow.spec.ts          # Approval lifecycle (manager + approver)
├── admin.spec.ts             # Admin user management (admin state)
└── .auth/                    # gitignored — storageState JSON files
```

## Infrastructure

### playwright.config.ts

- `testDir: './e2e'`
- `globalSetup: './e2e/global-setup.ts'`
- `fullyParallel: true` (except workflow spec)
- `forbidOnly: !!process.env.CI`
- `retries`: 2 on CI, 0 locally
- Projects:
  1. `setup` — runs `auth.setup.ts`
  2. `chromium` — depends on `setup`, default storageState: admin, runs all specs except workflow
  3. `workflow` — depends on `chromium`, runs only `workflow.spec.ts` serially
- `use: { baseURL: 'http://localhost:3000' }`
- `webServer`: `npx next dev --webpack` on port 3000, reuses existing server

### global-setup.ts

Runs sequentially before all tests:
1. `npx prisma db push --force-reset` — drops and recreates all tables
2. `npm run db:seed` — seeds roles + 3 test users + sample domain

Working directory: the metadata-platform worktree root.

**Safety note:** `--force-reset` destroys all data in the target database. Ensure `DATABASE_URL` points to a local/test database (e.g., `localhost:5433`), never a shared or production instance. Consider using a `.env.test` override or adding a hostname assertion in global-setup.

### auth.setup.ts

Logs in as each seeded user via the login page and saves cookies:
- `admin@example.com` / `admin1234` → `e2e/.auth/admin.json`
- `manager@example.com` / `manager1234` → `e2e/.auth/manager.json`
- `approver@example.com` / `approver1234` → `e2e/.auth/approver.json`

### fixtures/test-data.ts

Exports:
- `USERS` — credentials and names for admin, manager, approver
- Factory functions that generate unique entity names with timestamps:
  - `testDomain()` → `{ name: "E2E-도메인-{ts}", description, dataType }`
  - `testTerm()` → `{ termName: "E2E-용어-{ts}", termEnglishName, termDescription }`
  - `testCodeGroup()` → `{ name: "E2E-코드그룹-{ts}", englishName, description, items }`

## Test Specs

### auth.spec.ts (no pre-auth)

| # | Test | Action |
|---|------|--------|
| 1 | 로그인 페이지 표시 | `/login` → heading "로그인" visible |
| 2 | 시드 계정으로 로그인 | Fill email/password → click → redirect to `/standards` |
| 3 | 잘못된 비밀번호 | Wrong password → "올바르지 않습니다" error shown |
| 4 | 보호된 경로 리다이렉트 | Visit `/domains` → redirected to `/login` |
| 5 | 회원가입 페이지 표시 | `/signup` → heading "회원가입" visible |
| 6 | 로그아웃 | Login → user menu → "로그아웃" → redirect to `/login` |

### domains.spec.ts (admin storageState)

| # | Test | Action |
|---|------|--------|
| 1 | 도메인 목록 표시 | Heading "표준 도메인" visible, seed domain in table |
| 2 | 새 도메인 등록 | Fill form → submit → redirect to list, new row appears |
| 3 | 도메인 상세 조회 | Click row → detail page shows name/description/dataType |
| 4 | 도메인 수정 | Detail → edit → change description → save → updated |
| 5 | 도메인 검색 | Type in search → table filters results |

### standards.spec.ts (manager storageState)

| # | Test | Action |
|---|------|--------|
| 1 | 용어 목록 표시 | Heading "표준 용어" visible |
| 2 | 새 용어 등록 | Fill form (select domain) → submit → appears in list |
| 3 | 용어 상세 조회 | Click row → detail with name/englishName/domain |
| 4 | 용어 수정 | Edit description → save → updated |

### codes.spec.ts (manager storageState)

| # | Test | Action |
|---|------|--------|
| 1 | 코드 목록 표시 | Heading "표준 코드" visible |
| 2 | 코드 그룹 등록 | Fill group form + add 2 items → submit → appears in list |
| 3 | 코드 그룹 상세 | Click row → detail shows group info + items |
| 4 | 코드 그룹 수정 | Edit description → save → updated |

### workflow.spec.ts (manager + approver storageState, serial)

| # | Test | Action |
|---|------|--------|
| 1 | 등록 시 승인 요청 자동 생성 | Manager creates domain → "내 요청" tab shows PENDING |
| 2 | 승인자가 승인 대기 확인 | Switch to approver context → "승인 대기" tab shows request |
| 3 | 승인 처리 | Approver opens → "승인" → status "승인", entity ACTIVE |
| 4 | 반려 처리 | Manager creates entity → Approver "반려" → enter reason → status "반려" |

### admin.spec.ts (admin storageState)

| # | Test | Action |
|---|------|--------|
| 1 | 사용자 목록 표시 | Heading "사용자 관리" visible, seeded users in table |
| 2 | 사용자 검색 | Type name → table filters |
| 3 | 역할 변경 | Click icon button (title="역할 변경") → toggle role checkbox → save → badge updated |
| 4 | 비관리자 접근 차단 | Use manager state → `/admin/users` → server-side `redirect()` to `/standards` (page-level RBAC guard, not proxy) |

## Execution Order

```
global-setup.ts (DB reset + seed)
       ↓
auth.setup.ts (login 3 roles → save storageState)
       ↓
┌─────────────────────────────────────┐
│  Parallel:                          │
│  auth.spec.ts     (no auth)         │
│  domains.spec.ts  (admin state)     │
│  standards.spec.ts (manager state)  │
│  codes.spec.ts    (manager state)   │
│  admin.spec.ts    (admin state)     │
└─────────────────────────────────────┘
       ↓
  workflow.spec.ts (serial — creates then approves/rejects)
```

### Why workflow runs last

Workflow tests create entities and then act on approval requests from a different role. This requires:
1. `test.describe.configure({ mode: 'serial' })` — tests run in order (create → approve → create → reject)
2. Role switching via `browser.newContext({ storageState })` mid-test

To enforce ordering, `playwright.config.ts` defines a third project `workflow` that depends on the `chromium` project, ensuring workflow specs only start after all other specs complete.

### Test data isolation

Each spec uses uniquely named entities with timestamps (e.g., `"E2E-도메인-1710234567890"`) so parallel specs don't collide.

## UI Selectors Reference

Key Korean text strings used for Playwright selectors:

### Pages & Headings
- Login: `"로그인"`, Signup: `"회원가입"`
- Domains: `"표준 도메인"`, Terms: `"표준 용어"`, Codes: `"표준 코드"`
- Workflow: `"승인 관리"`, Admin: `"사용자 관리"`

### Form Labels
- Auth: `"이메일"`, `"비밀번호"`, `"이름"`
- Domain: `"도메인명 *"`, `"도메인 설명 *"`, `"데이터 타입 *"`
- Term: `"용어명 *"`, `"영문 용어명 *"`, `"용어 설명 *"`, `"도메인 *"`
- Code: `"코드 그룹명 *"`, `"코드 그룹 영문명 *"`, `"코드 그룹 설명 *"`

### Buttons
- Submit: `"등록"` (new), `"수정"` (edit), `"로그인"`, `"회원가입"`
- Cancel: `"취소"`
- Workflow: `"승인"`, `"반려"`, `"반려 확인"`
- Admin: `"역할 변경"` (icon button title), `"저장"`

### Status Badges
- Standard: `"초안"` (DRAFT), `"활성"` (ACTIVE), `"폐기"` (DEPRECATED)
- Approval: `"대기"` (PENDING), `"검토중"` (REVIEWING), `"승인"` (APPROVED), `"반려"` (REJECTED)

### Navigation
- Sidebar: `"표준 용어"`, `"표준 도메인"`, `"표준 코드"`, `"승인 관리"`, `"사용자 관리"`
- User menu: `"로그아웃"`

### Error Messages
- Auth: `"이메일 또는 비밀번호가 올바르지 않습니다"`
- Form: `"저장에 실패했습니다"`
- Workflow reject dialog: `"반려 사유 입력"`, `"반려 사유를 입력하세요..."`

## Seed Data (for reference)

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@example.com | admin1234 | ADMIN | 시스템 관리자 |
| manager@example.com | manager1234 | STANDARD_MANAGER | 표준 담당자 |
| approver@example.com | approver1234 | APPROVER | 승인 담당자 |

Sample domain: `"한글명"` (ACTIVE status)
