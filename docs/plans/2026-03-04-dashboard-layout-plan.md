---
title: Task 6 — Dashboard Layout Implementation Plan
date: 2026-03-04
branch: feature/metadata-platform
design_doc: docs/plans/2026-03-04-dashboard-layout-design.md
---

# Task 6: Dashboard Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the authenticated dashboard layout with sidebar navigation, top header bar, and user menu for all protected pages.

**Architecture:** Next.js App Router `(dashboard)` route group with server-side session fetching. Server component layout passes user data as props to client components (sidebar, user-nav). shadcn/ui Sidebar component handles collapse/expand and mobile responsiveness.

**Tech Stack:** Next.js 16.1 (App Router), shadcn/ui Sidebar, Better Auth (server-side session), lucide-react icons, TypeScript

**Working Directory:** `.worktrees/metadata-platform/metadata-platform/`

---

### Task 1: Create server-side session helper

Files:
- Create: `src/lib/auth/get-session.ts`

Step 1: Create get-session.ts

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SessionUser } from '@/types/auth'
import { RoleName } from '@/generated/prisma/client'
import { getUserRoles } from './actions'

export async function getSession(): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const roles = await getUserRoles(session.user.id)
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles,
  }
}

export function hasRole(user: SessionUser, role: RoleName): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: SessionUser, roles: RoleName[]): boolean {
  return roles.some((role) => user.roles.includes(role))
}
```

Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors related to get-session.ts

Step 3: Commit

```bash
git add src/lib/auth/get-session.ts
git commit -m "feat: add server-side session helper with role utilities"
```

---

### Task 2: Create user navigation dropdown

Files:
- Create: `src/components/layout/user-nav.tsx`

Step 1: Create user-nav.tsx

```typescript
'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

interface UserNavProps {
  userName: string
  userEmail: string
}

export function UserNav({ userName, userEmail }: UserNavProps) {
  const router = useRouter()
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut()
            router.push('/login')
          }}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors

Step 3: Commit

```bash
git add src/components/layout/user-nav.tsx
git commit -m "feat: add user navigation dropdown with avatar and logout"
```

---

### Task 3: Create app header

Files:
- Create: `src/components/layout/app-header.tsx`

Step 1: Create app-header.tsx

```typescript
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserNav } from './user-nav'

interface AppHeaderProps {
  userName: string
  userEmail: string
}

export function AppHeader({ userName, userEmail }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-sm font-semibold">메타데이터 관리 플랫폼</h1>
      </div>
      <UserNav userName={userName} userEmail={userEmail} />
    </header>
  )
}
```

Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors

Step 3: Commit

```bash
git add src/components/layout/app-header.tsx
git commit -m "feat: add app header with sidebar trigger and user nav"
```

---

### Task 4: Create app sidebar

Files:
- Create: `src/components/layout/app-sidebar.tsx`

Step 1: Create app-sidebar.tsx

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { BookOpen, Layers, Code, CheckSquare, Settings } from 'lucide-react'

const menuItems = [
  { title: '표준 용어', href: '/standards', icon: BookOpen },
  { title: '표준 도메인', href: '/domains', icon: Layers },
  { title: '표준 코드', href: '/codes', icon: Code },
  { title: '승인 관리', href: '/workflow', icon: CheckSquare },
]

const adminItems = [
  { title: '사용자 관리', href: '/admin/users', icon: Settings },
]

interface AppSidebarProps {
  userRoles: string[]
}

export function AppSidebar({ userRoles }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRoles.includes('ADMIN')

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메타데이터 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>관리자</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
```

Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors

Step 3: Commit

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat: add sidebar navigation with role-based admin section"
```

---

### Task 5: Create dashboard layout and placeholder pages

Files:
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/standards/page.tsx`
- Create: `src/app/(dashboard)/domains/page.tsx`
- Create: `src/app/(dashboard)/codes/page.tsx`
- Create: `src/app/(dashboard)/workflow/page.tsx`
- Create: `src/app/(dashboard)/admin/users/page.tsx`

Step 1: Create dashboard layout

`src/app/(dashboard)/layout.tsx`:
```typescript
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { getSession } from '@/lib/auth/get-session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRoles={user.roles} />
        <div className="flex flex-1 flex-col">
          <AppHeader userName={user.name} userEmail={user.email} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
```

Step 2: Create placeholder pages

Each placeholder page follows this pattern — a simple heading so we can test navigation:

`src/app/(dashboard)/standards/page.tsx`:
```typescript
export default function StandardsPage() {
  return <h1 className="text-2xl font-bold">표준 용어 관리</h1>
}
```

`src/app/(dashboard)/domains/page.tsx`:
```typescript
export default function DomainsPage() {
  return <h1 className="text-2xl font-bold">표준 도메인 관리</h1>
}
```

`src/app/(dashboard)/codes/page.tsx`:
```typescript
export default function CodesPage() {
  return <h1 className="text-2xl font-bold">표준 코드 관리</h1>
}
```

`src/app/(dashboard)/workflow/page.tsx`:
```typescript
export default function WorkflowPage() {
  return <h1 className="text-2xl font-bold">승인 관리</h1>
}
```

`src/app/(dashboard)/admin/users/page.tsx`:
```typescript
export default function AdminUsersPage() {
  return <h1 className="text-2xl font-bold">사용자 관리</h1>
}
```

Step 3: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors

Step 4: Verify in browser

Run: `npm run dev` (if not already running)
1. Navigate to `http://localhost:3000` — should redirect to `/login`
2. Login with `admin@example.com` / `admin1234`
3. Should redirect to `/standards` with sidebar + header visible
4. Click each sidebar menu item — page heading should change
5. Admin user should see "사용자 관리" in sidebar
6. Click avatar → dropdown with name/email and logout
7. Click logout → redirects to `/login`
8. Click sidebar trigger (hamburger) → sidebar collapses/expands

Step 5: Commit

```bash
git add src/app/(dashboard)/
git commit -m "feat: add dashboard layout with sidebar, header, and placeholder pages"
```
