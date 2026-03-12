---
title: 관리자 사용자 관리 페이지 구현 계획 (Elevated)
date: 2026-03-10
version: "2.0"
branch: feature/metadata-platform
design_doc: docs/plans/2026-03-09-admin-users-design.md
---

# Admin Users Page Implementation Plan (Elevated)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the admin users management page with elevated UI polish — color-coded role badges, dot-indicator status badges, search with icon/clear button, role descriptions in edit dialog, and smooth transitions.

**Architecture:** Server component page with ADMIN guard → client list component with TanStack Query → table with role/status badges → role edit dialog with checkboxes. Two API routes: GET list with search/pagination, PUT role update with self-lockout prevention.

**Tech Stack:** Next.js App Router, TanStack Query, Prisma 7, Zod, shadcn/ui (Dialog, Checkbox, Table, Badge, Skeleton, Alert, Button, Input), Lucide icons

---

### Task 1: Query Keys + Validation Schema

**Files:**
- Modify: `src/lib/query/keys.ts`
- Create: `src/lib/validations/admin.ts`

**Step 1: Add users query key factory**

In `src/lib/query/keys.ts`, add `users` entry after `workflow`:

```typescript
users: {
  all: ['users'] as const,
  list: (params?: Record<string, string>) =>
    [...queryKeys.users.all, 'list', params] as const,
},
```

**Step 2: Create admin validation schema**

Create `src/lib/validations/admin.ts`:

```typescript
import { z } from 'zod'
import { RoleName } from '@/generated/prisma/client'

export const roleUpdateSchema = z.object({
  roles: z.array(z.nativeEnum(RoleName)).min(1, '최소 1개의 역할을 선택하세요'),
})

export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 4: Commit**

```bash
git add src/lib/query/keys.ts src/lib/validations/admin.ts
git commit -m "feat: add users query keys and admin validation schema"
```

---

### Task 2: GET /api/admin/users API Route

**Files:**
- Create: `src/app/api/admin/users/route.ts`

**Step 1: Implement GET endpoint**

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { RoleName } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN])
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '20')
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.user.count({ where }),
    ])

    const users = data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
      roles: user.roles.map((ur) => ur.role.name),
      createdAt: user.createdAt.toISOString(),
    }))

    return NextResponse.json({
      data: users,
      pagination: { page, size, total },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '사용자 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/app/api/admin/users/route.ts
git commit -m "feat: add admin users list API endpoint"
```

---

### Task 3: PUT /api/admin/users/[id]/role API Route

**Files:**
- Create: `src/app/api/admin/users/[id]/role/route.ts`

**Step 1: Implement PUT endpoint with self-lockout prevention**

Create `src/app/api/admin/users/[id]/role/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { roleUpdateSchema } from '@/lib/validations/admin'
import { RoleName } from '@/generated/prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN])
    if ('error' in authResult) return authResult.error

    const { id: userId } = await params

    const body = await request.json()
    const parsed = roleUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    // Self-lockout prevention: cannot remove own ADMIN role
    if (authResult.user.id === userId && !parsed.data.roles.includes(RoleName.ADMIN)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '자신의 관리자 역할은 제거할 수 없습니다' } },
        { status: 400 },
      )
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    // Get role IDs for requested role names
    const roles = await prisma.role.findMany({
      where: { name: { in: parsed.data.roles } },
    })

    // Transaction: delete existing roles → create new ones
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id })),
      }),
    ])

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    })

    return NextResponse.json({
      data: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        department: updatedUser!.department,
        status: updatedUser!.status,
        roles: updatedUser!.roles.map((ur) => ur.role.name),
        createdAt: updatedUser!.createdAt.toISOString(),
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '역할 변경에 실패했습니다' } },
      { status: 500 },
    )
  }
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/app/api/admin/users/\[id\]/role/route.ts
git commit -m "feat: add admin user role update API with self-lockout prevention"
```

---

### Task 4: User Status Badge (Elevated)

**Files:**
- Create: `src/components/admin/user-status-badge.tsx`

**Step 1: Implement status badge with dot indicator**

Create `src/components/admin/user-status-badge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'

const statusConfig = {
  ACTIVE: { label: '활성', dotClass: 'bg-emerald-500', variant: 'outline' as const },
  INACTIVE: { label: '비활성', dotClass: 'bg-gray-400', variant: 'secondary' as const },
}

export function UserStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig]
    ?? { label: status, dotClass: 'bg-gray-400', variant: 'outline' as const }

  return (
    <Badge variant={config.variant} className="gap-1.5 font-normal">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </Badge>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/admin/user-status-badge.tsx
git commit -m "feat: add user status badge with dot indicator"
```

---

### Task 5: User Table (Elevated)

**Files:**
- Create: `src/components/admin/user-table.tsx`

**Step 1: Implement elevated user table with color-coded role badges**

Create `src/components/admin/user-table.tsx`:

```tsx
'use client'

import { Settings2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserStatusBadge } from './user-status-badge'

export interface AdminUser {
  id: string
  name: string
  email: string
  department: string | null
  status: string
  roles: string[]
  createdAt: string
}

const roleConfig: Record<string, { label: string; className: string }> = {
  ADMIN: { label: '관리자', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  STANDARD_MANAGER: { label: '표준담당자', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  APPROVER: { label: '승인자', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  VIEWER: { label: '조회자', className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700' },
}

function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] ?? { label: role, className: '' }
  return (
    <Badge variant="outline" className={`font-normal ${config.className}`}>
      {config.label}
    </Badge>
  )
}

interface UserTableProps {
  users: AdminUser[]
  onEditRole: (user: AdminUser) => void
}

export function UserTable({ users, onEditRole }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>부서</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Users className="h-8 w-8" />
                <p>등록된 사용자가 없습니다</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id} className="transition-colors duration-150">
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>{user.department ?? '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('ko-KR')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditRole(user)}
                  title="역할 변경"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/admin/user-table.tsx
git commit -m "feat: add user table with color-coded role badges"
```

---

### Task 6: User Table Skeleton

**Files:**
- Create: `src/components/admin/user-table-skeleton.tsx`

**Step 1: Implement skeleton with staggered widths**

Create `src/components/admin/user-table-skeleton.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

const widths = [
  ['w-16', 'w-32', 'w-14', 'w-24', 'w-14', 'w-20', 'w-8'],
  ['w-14', 'w-36', 'w-12', 'w-20', 'w-14', 'w-20', 'w-8'],
  ['w-20', 'w-28', 'w-16', 'w-28', 'w-14', 'w-20', 'w-8'],
  ['w-12', 'w-32', 'w-14', 'w-16', 'w-14', 'w-20', 'w-8'],
  ['w-18', 'w-30', 'w-10', 'w-24', 'w-14', 'w-20', 'w-8'],
]

export function UserTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>부서</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {widths.map((row, i) => (
          <TableRow key={i}>
            {row.map((w, j) => (
              <TableCell key={j}>
                <Skeleton className={`h-4 ${w}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/admin/user-table-skeleton.tsx
git commit -m "feat: add user table skeleton with staggered widths"
```

---

### Task 7: Role Edit Dialog (Elevated)

**Files:**
- Create: `src/components/admin/role-edit-dialog.tsx`

**Step 1: Implement role edit dialog with descriptions**

Create `src/components/admin/role-edit-dialog.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { AdminUser } from './user-table'

const roleOptions = [
  {
    value: 'ADMIN',
    label: '관리자',
    description: '시스템 전체 관리 및 사용자 역할 변경',
  },
  {
    value: 'STANDARD_MANAGER',
    label: '표준담당자',
    description: '표준 용어, 도메인, 코드 등록 및 수정',
  },
  {
    value: 'APPROVER',
    label: '승인자',
    description: '등록 요청 검토 및 승인/반려',
  },
  {
    value: 'VIEWER',
    label: '조회자',
    description: '데이터 조회만 가능',
  },
] as const

interface RoleEditDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleEditDialog({ user, open, onOpenChange }: RoleEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setSelectedRoles([...user.roles])
      setError(null)
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (roles: string[]) =>
      apiClient(`/api/admin/users/${user!.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roles }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role],
    )
    setError(null)
  }

  const hasChanges =
    user &&
    (selectedRoles.length !== user.roles.length ||
      selectedRoles.some((r) => !user.roles.includes(r)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>역할 변경</DialogTitle>
          <DialogDescription>
            {user?.name} ({user?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={selectedRoles.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium leading-none">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate(selectedRoles)}
            disabled={mutation.isPending || selectedRoles.length === 0 || !hasChanges}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/admin/role-edit-dialog.tsx
git commit -m "feat: add role edit dialog with descriptions and change detection"
```

---

### Task 8: Admin Users Client Component (Elevated)

**Files:**
- Create: `src/components/admin/admin-users-client.tsx`

**Step 1: Implement client component with elevated search**

Create `src/components/admin/admin-users-client.tsx`:

```tsx
'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { UserTable, type AdminUser } from './user-table'
import { UserTableSkeleton } from './user-table-skeleton'
import { RoleEditDialog } from './role-edit-dialog'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { useDebounce } from '@/hooks/use-debounce'

export function AdminUsersClient() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<AdminUser[]>(`/api/admin/users?${qs}`)
    },
  })

  const handleEditRole = (user: AdminUser) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름 또는 이메일 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 pr-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => { setSearch(''); setPage(1) }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <UserTableSkeleton />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '데이터를 불러오는 데 실패했습니다'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <UserTable users={data?.data ?? []} onEditRole={handleEditRole} />
          {data?.pagination && (
            <DataTablePagination
              page={data.pagination.page}
              size={data.pagination.size}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <RoleEditDialog
        user={editingUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/admin/admin-users-client.tsx
git commit -m "feat: add admin users client with search icon and clear button"
```

---

### Task 9: Admin Users Page (Server Component)

**Files:**
- Modify: `src/app/(dashboard)/admin/users/page.tsx`

**Step 1: Refactor to server component with ADMIN guard**

Replace `src/app/(dashboard)/admin/users/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

import { getSession, hasRole } from '@/lib/auth/get-session'
import { RoleName } from '@/generated/prisma/client'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const user = await getSession()
  if (!hasRole(user, RoleName.ADMIN)) redirect('/standards')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">사용자 관리</h2>
        <p className="text-muted-foreground">
          시스템 사용자 목록을 조회하고 역할을 관리합니다
        </p>
      </div>
      <AdminUsersClient />
    </div>
  )
}
```

**Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors, successful build

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/admin/users/page.tsx
git commit -m "feat: add admin users page with ADMIN guard and elevated header"
```

---

### Task 10: Final Verification + Release Notes

**Files:**
- Create: `docs/releases/2026-03-10-metadata-platform-v0.7.0.md`

**Step 1: Full verification**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors, successful build

**Step 2: Write release notes**

Create `docs/releases/2026-03-10-metadata-platform-v0.7.0.md` with:
- Summary of admin users page features
- List of new/modified files
- Elevated UI enhancements noted
- Verification results

**Step 3: Commit**

```bash
git add docs/releases/2026-03-10-metadata-platform-v0.7.0.md
git commit -m "docs: add v0.7.0 release notes for admin users management"
```
