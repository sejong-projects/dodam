---
title: Task 6 — Dashboard Layout (Sidebar + Header) Design
date: 2026-03-04
branch: feature/metadata-platform
status: draft
---

## Overview

Build the authenticated dashboard layout with a sidebar navigation and top header bar. This layout wraps all protected pages (`/standards`, `/domains`, `/codes`, `/workflow`, `/admin`) using a Next.js route group `(dashboard)`.

## Architecture

``` markdown
src/app/layout.tsx              ← Root (fonts, globals.css, QueryProvider)
├── (auth)/layout.tsx           ← Centered card (login/signup)
└── (dashboard)/layout.tsx      ← NEW: Sidebar + Header (authenticated)
    ├── standards/page.tsx      ← (Task 8)
    ├── domains/page.tsx        ← (Task 7)
    ├── codes/page.tsx          ← (Task 9)
    ├── workflow/page.tsx       ← (Task 10)
    └── admin/users/page.tsx    ← (Task 11)
```

## Layout Wireframe

``` markdown
┌─────────────────────────────────────────────────────────┐
│ [≡ Trigger]  │  메타데이터 관리 플랫폼          [Avatar] │  ← Header (h-14)
├──────────────┼──────────────────────────────────────────┤
│ 메타데이터 관리 │                                        │
│  □ 표준 용어   │                                        │
│  □ 표준 도메인  │           Main Content Area            │
│  □ 표준 코드   │              (p-6)                     │
│  □ 승인 관리   │                                        │
│              │                                        │
│ 관리자 (ADMIN) │                                        │
│  □ 사용자 관리  │                                        │
│              │                                        │
├──────────────┤                                        │
│  Sidebar     │                                        │
│  (16rem)     │                                        │
└──────────────┴──────────────────────────────────────────┘
```

- Sidebar uses shadcn/ui `<Sidebar>` component (collapsible, mobile-responsive via Sheet)
- Header contains `SidebarTrigger` (toggle), app title, and user avatar dropdown
- Admin menu group is only visible to users with `ADMIN` role

## Files to Create (5)

### 1. `src/lib/auth/get-session.ts` — Server-Side Session Helper

Fetches the current session via Better Auth's server API, retrieves user roles from DB, and redirects to `/login` if unauthenticated. Also provides `hasRole()` and `hasAnyRole()` utility functions for role checks.

```typescript
// Returns: SessionUser { id, email, name, roles: RoleName[] }
// Redirects to /login if no session
export async function getSession(): Promise<SessionUser>
export function hasRole(user: SessionUser, role: RoleName): boolean
export function hasAnyRole(user: SessionUser, roles: RoleName[]): boolean
```

### 2. `src/components/layout/app-sidebar.tsx` — Sidebar Navigation (Client)

Uses shadcn `Sidebar*` components with two menu groups:
- **메타데이터 관리**: 표준 용어, 표준 도메인, 표준 코드, 승인 관리
- **관리자** (ADMIN only): 사용자 관리

Active menu item is highlighted based on `usePathname()`.

Props: `{ userRoles: string[] }` — used to conditionally render admin section.

### 3. `src/components/layout/user-nav.tsx` — User Avatar Dropdown (Client)

Avatar with user initials + dropdown menu showing:
- User name and email
- Logout button (calls `authClient.signOut()` → redirect to `/login`)

Props: `{ userName: string, userEmail: string }`

### 4. `src/components/layout/app-header.tsx` — Top Header Bar (Server)

Fixed-height (h-14) header containing:
- Left: `SidebarTrigger` + vertical separator + app title
- Right: `UserNav` component

Props: `{ userName: string, userEmail: string }`

### 5. `src/app/(dashboard)/layout.tsx` — Dashboard Layout (Server)

Composes all layout components:

``` markdown
SidebarProvider
├── AppSidebar (userRoles)
└── flex container
    ├── AppHeader (userName, userEmail)
    └── <main>{children}</main>
```

Calls `getSession()` server-side to get user data, then passes it to child components as props.

**Note:** `QueryProvider` is NOT included here — it's already in root `layout.tsx`. No duplication needed.

## Refinement from Implementation Plan

The v2 plan wraps `QueryProvider` inside `(dashboard)/layout.tsx`, but since it's already in `src/app/layout.tsx` (root), this would create a nested `QueryClient`. We keep it only in root layout to avoid duplication.

## Navigation Items

| Label | Route | Icon (lucide-react) | Group |
| ------- | ------- | --------------------- | ------- |
| 표준 용어 | `/standards` | BookOpen | 메타데이터 관리 |
| 표준 도메인 | `/domains` | Layers | 메타데이터 관리 |
| 표준 코드 | `/codes` | Code | 메타데이터 관리 |
| 승인 관리 | `/workflow` | CheckSquare | 메타데이터 관리 |
| 사용자 관리 | `/admin/users` | Settings | 관리자 (ADMIN only) |

## Data Flow

``` markdown
(dashboard)/layout.tsx [Server]
  │
  ├─ getSession()  →  auth.api.getSession(headers)  →  Better Auth
  │                    getUserRoles(userId)           →  Prisma DB
  │                    Returns: SessionUser { id, email, name, roles }
  │
  ├─ <AppSidebar userRoles={user.roles} />  [Client]
  │     └─ usePathname() for active state
  │
  └─ <AppHeader userName={user.name} userEmail={user.email} />
       └─ <UserNav />  [Client]
             └─ authClient.signOut() on logout
```

## Success Criteria

- Login → redirects to `/standards` → sidebar + header visible
- Sidebar shows 4 menu items for all users
- Admin users see additional "사용자 관리" menu item
- Clicking avatar shows dropdown with user info + logout
- Logout redirects to `/login`
- Mobile: sidebar becomes a sheet overlay
- Sidebar can be collapsed/expanded via trigger button
