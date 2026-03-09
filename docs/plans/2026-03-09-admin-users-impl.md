---
title: 관리자 페이지 구현 계획 — 사용자 목록 및 역할 관리
date: 2026-03-09
version: "1.0"
branch: feature/metadata-platform
design_doc: docs/plans/2026-03-09-admin-users-design.md
---

## Step 1: Query Keys 확장 + Validation Schema

### 1a. `src/lib/query/keys.ts` 수정

```typescript
users: {
  all: ['users'] as const,
  list: (params?: Record<string, string>) => [...queryKeys.users.all, 'list', params] as const,
},
```

### 1b. `src/lib/validations/admin.ts` 생성

```typescript
import { z } from 'zod'
import { RoleName } from '@/generated/prisma/client'

export const roleUpdateSchema = z.object({
  roles: z.array(z.nativeEnum(RoleName)).min(1, '최소 1개의 역할을 선택하세요'),
})

export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>
```

## Step 2: API Routes

### 2a. `src/app/api/admin/users/route.ts` — GET

- `requireRole([RoleName.ADMIN])`
- Query: `page`, `size`, `search`
- Prisma: `user.findMany` with `include: { roles: { include: { role: true } } }`
- search 시 `OR: [{ name: contains }, { email: contains }]`
- Response: 사용자 목록 + roles 매핑 (`user.roles.map(ur => ur.role.name)`)

### 2b. `src/app/api/admin/users/[id]/role/route.ts` — PUT

- `requireRole([RoleName.ADMIN])`
- Validate body with `roleUpdateSchema`
- Self-lockout 방지: 요청자 === 대상 && ADMIN 역할 미포함 시 400
- `$transaction`:
  1. `userRole.deleteMany({ where: { userId } })`
  2. 역할명 → Role ID 조회 (`role.findMany({ where: { name: { in: roles } } })`)
  3. `userRole.createMany` 새 역할 부여
- Response: 갱신된 사용자 + 역할

## Step 3: UI Components

### 3a. `src/components/admin/user-status-badge.tsx`

- ACTIVE → '활성' / default variant
- INACTIVE → '비활성' / secondary variant

### 3b. `src/components/admin/user-table.tsx`

- Columns: 이름, 이메일, 부서, 역할(배지 목록), 상태, 역할 변경(버튼)
- RoleName 한글 매핑: ADMIN→관리자, STANDARD_MANAGER→표준담당자, APPROVER→승인자, VIEWER→조회자
- Row별 "역할 변경" 버튼 → `onEditRole(user)` callback

### 3c. `src/components/admin/user-table-skeleton.tsx`

- 5행 × 6컬럼 스켈레톤 (DomainTableSkeleton 패턴)

### 3d. `src/components/admin/role-edit-dialog.tsx`

- Props: `user`, `open`, `onOpenChange`
- 4개 역할 체크박스 (ADMIN, STANDARD_MANAGER, APPROVER, VIEWER)
- `useMutation` → `PUT /api/admin/users/${user.id}/role`
- 성공 시 `invalidateQueries(queryKeys.users.all)` + Dialog 닫기
- 에러 표시 (self-lockout 등)

### 3e. `src/components/admin/admin-users-client.tsx`

- 검색 (useDebounce 300ms) + 페이지네이션
- `useQuery(queryKeys.users.list(params))`
- Loading → UserTableSkeleton, Error → Alert, Data → UserTable + DataTablePagination
- `useState` for RoleEditDialog open/selected user

## Step 4: Page

### 4a. `src/app/(dashboard)/admin/users/page.tsx` 수정

```typescript
import { getSession, hasRole } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { RoleName } from '@/generated/prisma/client'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const user = await getSession()
  if (!hasRole(user, RoleName.ADMIN)) redirect('/standards')

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">사용자 관리</h2>
      <AdminUsersClient />
    </div>
  )
}
```

## Step 5: shadcn/ui Checkbox

- `npx shadcn@latest add checkbox` (role-edit-dialog에서 사용)

## File Manifest

**Create (8 files):**
- `src/lib/validations/admin.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/role/route.ts`
- `src/components/admin/user-status-badge.tsx`
- `src/components/admin/user-table.tsx`
- `src/components/admin/user-table-skeleton.tsx`
- `src/components/admin/role-edit-dialog.tsx`
- `src/components/admin/admin-users-client.tsx`

**Modify (2 files):**
- `src/lib/query/keys.ts` — users 키 추가
- `src/app/(dashboard)/admin/users/page.tsx` — 서버 컴포넌트로 리팩토링

## Verification

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — successful
3. Manual test:
   - ADMIN 로그인 → `/admin/users` → 사용자 목록 표시
   - 비ADMIN 로그인 → `/admin/users` → `/standards`로 리다이렉트
   - 역할 변경 버튼 → Dialog → 체크박스 변경 → 저장 → 목록 갱신 확인
   - 자기 자신 ADMIN 역할 제거 시도 → 에러 메시지
