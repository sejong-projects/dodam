# 표준 코드 CRUD 리파인먼트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 표준 코드(codes) UI를 표준 용어(standards) 수준으로 리파인 — 스켈레톤 로딩, 디바운스 검색, 에러 Alert, TanStack Query 캐시 무효화, 수정 페이지 권한 가드

**Architecture:** 기존 코드 CRUD 페이지/컴포넌트를 수정하여 `standards/` 구현과 동일한 UX 패턴 적용. 신규 파일은 스켈레톤 컴포넌트 1개만 생성.

**Tech Stack:** Next.js 16.1, TanStack Query v5, shadcn/ui (Alert, Skeleton, Table), react-hook-form + Zod

**설계 문서:** `docs/plans/2026-03-06-codes-crud-refinement-design.md`

---

## Task 1: 코드 그룹 테이블 스켈레톤 컴포넌트

**Files:**
- Create: `src/components/code/code-group-table-skeleton.tsx`

**참고:** `src/components/standard/term-table-skeleton.tsx` 패턴을 따른다. 코드 테이블은 6개 컬럼 (코드 그룹명, 영문명, 코드 항목 수, 상태, 등록자, 등록일).

**Step 1: 스켈레톤 컴포넌트 작성**

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

export function CodeGroupTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>코드 그룹명</TableHead>
          <TableHead>영문명</TableHead>
          <TableHead>코드 항목 수</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }, (_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/code/code-group-table-skeleton.tsx
git commit -m "feat: add code group table skeleton component"
```

---

## Task 2: 코드 목록 페이지 — 디바운스 + 스켈레톤 + 에러 Alert

**Files:**
- Modify: `src/app/(dashboard)/codes/page.tsx`

**참고:** `src/app/(dashboard)/standards/page.tsx` 패턴과 동일하게 만든다.

변경 내용:
1. `useDebounce` import 추가, `debouncedSearch` 적용
2. `isError`, `error` 를 `useQuery`에서 추출
3. `isLoading` 시 `<CodeGroupTableSkeleton />` 렌더링
4. `isError` 시 `Alert variant="destructive"` 렌더링
5. `AlertCircle` 아이콘 import (lucide-react)

**Step 1: 코드 목록 페이지 수정**

전체 파일을 아래 내용으로 교체:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CodeGroupTable, type CodeGroup } from '@/components/code/code-group-table'
import { CodeGroupTableSkeleton } from '@/components/code/code-group-table-skeleton'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { useDebounce } from '@/hooks/use-debounce'

export default function CodesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const debouncedSearch = useDebounce(search, 300)

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (debouncedSearch) params.search = debouncedSearch
  if (status !== 'all') params.status = status

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.codes.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<CodeGroup[]>(`/api/codes?${qs}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">표준 코드</h2>
        <Button asChild>
          <Link href="/codes/new">코드 그룹 등록</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="코드 그룹명 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="DRAFT">초안</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="DEPRECATED">폐기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CodeGroupTableSkeleton />
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
          <CodeGroupTable codeGroups={data?.data ?? []} />
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
    </div>
  )
}
```

**Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/app/(dashboard)/codes/page.tsx
git commit -m "feat: add debounce search, skeleton loading, error alert to codes list page"
```

---

## Task 3: 코드 그룹 폼 — TanStack Query 캐시 무효화

**Files:**
- Modify: `src/components/code/code-group-form.tsx`

**참고:** `src/components/standard/term-form.tsx` 의 `useQueryClient` + `invalidateQueries` 패턴.

변경 내용:
1. `useQueryClient` import 추가 (`@tanstack/react-query`)
2. `queryKeys` import 추가 (`@/lib/query/keys`)
3. `onSubmit` 에서 `router.refresh()` → `queryClient.invalidateQueries({ queryKey: queryKeys.codes.all })`
4. `invalidateQueries` 를 `await`으로 호출 후 `router.push`

**Step 1: 폼 컴포넌트 수정**

`import { useRouter } from 'next/navigation'` 뒤에 추가:

```tsx
import { useQueryClient } from '@tanstack/react-query'
```

`import { apiClient } from '@/lib/api/client'` 뒤에 추가:

```tsx
import { queryKeys } from '@/lib/query/keys'
```

함수 본문에서 `const router = useRouter()` 다음 줄에 추가:

```tsx
const queryClient = useQueryClient()
```

`onSubmit` 함수의 try 블록 변경 — `router.push('/codes')` + `router.refresh()` 부분을:

```tsx
      await queryClient.invalidateQueries({ queryKey: queryKeys.codes.all })
      router.push('/codes')
```

로 교체 (router.refresh() 제거).

**Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/components/code/code-group-form.tsx
git commit -m "feat: replace router.refresh with TanStack Query cache invalidation in code form"
```

---

## Task 4: 수정 페이지 — 권한 가드 추가

**Files:**
- Modify: `src/app/(dashboard)/codes/[id]/edit/page.tsx`

**참고:** 상세 페이지(`codes/[id]/page.tsx`)가 `getSession()` + `hasAnyRole()`로 권한을 확인하는 패턴. 수정 페이지에도 동일 적용하여 ADMIN/STANDARD_MANAGER 이외 역할이 접근하면 목록으로 리다이렉트.

변경 내용:
1. `getSession`, `hasAnyRole` import
2. `RoleName` import
3. `redirect` import
4. 세션 확인 후 권한 검증 추가

**Step 1: 수정 페이지 권한 가드 추가**

전체 파일을 아래 내용으로 교체:

```tsx
import { notFound, redirect } from 'next/navigation'

import { CodeGroupForm } from '@/components/code/code-group-form'
import { prisma } from '@/lib/db/prisma'
import { getSession, hasAnyRole } from '@/lib/auth/get-session'
import { RoleName } from '@/generated/prisma/client'

export default async function EditCodeGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  if (!hasAnyRole(user, [RoleName.ADMIN, RoleName.STANDARD_MANAGER])) {
    redirect('/codes')
  }

  const codeGroup = await prisma.codeGroup.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!codeGroup) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">코드 그룹 수정</h2>
      <CodeGroupForm
        groupId={id}
        defaultValues={{
          groupName: codeGroup.groupName,
          groupEnglishName: codeGroup.groupEnglishName,
          groupDescription: codeGroup.groupDescription,
          items: codeGroup.items.map((item) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            sortOrder: item.sortOrder,
            isActive: item.isActive,
          })),
        }}
      />
    </div>
  )
}
```

**Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/app/(dashboard)/codes/[id]/edit/page.tsx
git commit -m "feat: add role-based access guard to code group edit page"
```

---

## Task 5: 빌드 검증 & 릴리스 노트

**Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 2: 프로덕션 빌드**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: 릴리스 노트 업데이트**

`docs/releases/2026-03-06-metadata-platform-v0.3.0.md` 를 v0.4.0으로 신규 작성하거나, 기존 파일에 Task 9 내용을 추가.

**Step 4: Commit**

```bash
git add docs/releases/
git commit -m "docs: add v0.4.0 release notes for codes CRUD refinement"
```
