# 표준 용어 CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** StandardTerm 엔터티에 대한 CRUD API + UI 구현 (도메인 CRUD 패턴 클론)

**Architecture:** Next.js App Router API Routes (GET/POST/PUT/DELETE) + client/server component pages. TanStack Query for data fetching on list page, direct Prisma on detail/edit pages. react-hook-form + Zod validation on forms.

**Tech Stack:** Next.js 16.1, TypeScript, Prisma 7, TanStack Query v5, react-hook-form, Zod, shadcn/ui

**Design doc:** `docs/plans/2026-03-05-standard-terms-crud-design.md`

**Working directory:** `.worktrees/metadata-platform/metadata-platform/`

**Existing assets (no changes needed):**
- `src/lib/validations/standard.ts` — Zod schemas (`termCreateSchema`, `termUpdateSchema`)
- `src/lib/query/keys.ts` — `queryKeys.standards` already registered

---

## Task 1: API Routes — List & Create

**Files:**
- Create: `src/app/api/standards/route.ts`

**Step 1: Create the API route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { termCreateSchema } from '@/lib/validations/standard'
import { RoleName } from '@/generated/prisma/client'

// GET /api/standards - 표준 용어 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || undefined

    const where = {
      ...(search && {
        OR: [
          { termName: { contains: search, mode: 'insensitive' as const } },
          { termEnglishName: { contains: search, mode: 'insensitive' as const } },
          { termDescription: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'DEPRECATED' }),
    }

    const [data, total] = await Promise.all([
      prisma.standardTerm.findMany({
        where,
        include: {
          domain: { select: { id: true, domainName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.standardTerm.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: { page, size, total },
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// POST /api/standards - 표준 용어 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const body = await request.json()
    const parsed = termCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const existing = await prisma.standardTerm.findFirst({
      where: { termName: parsed.data.termName, version: 1 },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: '이미 존재하는 용어명입니다' } },
        { status: 409 },
      )
    }

    const term = await prisma.standardTerm.create({
      data: {
        ...parsed.data,
        createdBy: authResult.user.id,
      },
    })

    return NextResponse.json({ data: term }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 등록에 실패했습니다' } },
      { status: 500 },
    )
  }
}
```

**Step 2: Verify types compile**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors related to `src/app/api/standards/route.ts`

**Step 3: Commit**

```bash
git add src/app/api/standards/route.ts
git commit -m "feat: add standard term list and create API routes"
```

---

## Task 2: API Routes — Detail, Update, Delete

**Files:**
- Create: `src/app/api/standards/[id]/route.ts`

**Step 1: Create the detail/update/delete API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { termUpdateSchema } from '@/lib/validations/standard'
import { RoleName } from '@/generated/prisma/client'

// GET /api/standards/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const term = await prisma.standardTerm.findUnique({
      where: { id },
      include: {
        domain: { select: { id: true, domainName: true, dataType: true } },
        creator: { select: { id: true, name: true } },
      },
    })

    if (!term) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '표준 용어를 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: term })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// PUT /api/standards/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const body = await request.json()
    const parsed = termUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const term = await prisma.standardTerm.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ data: term })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 수정에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// DELETE /api/standards/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    await prisma.standardTerm.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 삭제에 실패했습니다' } },
      { status: 500 },
    )
  }
}
```

**Step 2: Verify types compile**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/standards/[id]/route.ts
git commit -m "feat: add standard term detail, update, delete API routes"
```

---

## Task 3: Term Table Component

**Files:**
- Create: `src/components/standard/term-table.tsx`

**Step 1: Create the table component**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'

interface Term {
  id: string
  termName: string
  termEnglishName: string
  termAbbreviation: string | null
  domain: { domainName: string }
  status: string
  creator: { name: string }
  createdAt: string
}

export function TermTable({ terms }: { terms: Term[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>용어명</TableHead>
          <TableHead>영문명</TableHead>
          <TableHead>약어</TableHead>
          <TableHead>도메인</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {terms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              등록된 표준 용어가 없습니다
            </TableCell>
          </TableRow>
        ) : (
          terms.map((term) => (
            <TableRow
              key={term.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/standards/${term.id}`)}
            >
              <TableCell className="font-medium">{term.termName}</TableCell>
              <TableCell>{term.termEnglishName}</TableCell>
              <TableCell>{term.termAbbreviation ?? '-'}</TableCell>
              <TableCell>{term.domain.domainName}</TableCell>
              <TableCell><StatusBadge status={term.status} /></TableCell>
              <TableCell>{term.creator.name}</TableCell>
              <TableCell>{new Date(term.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Verify types compile**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/standard/term-table.tsx
git commit -m "feat: add standard term table component"
```

---

## Task 4: Term Form Component

**Files:**
- Create: `src/components/standard/term-form.tsx`

**Step 1: Create the form component with domain dropdown**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { termCreateSchema, type TermCreateInput } from '@/lib/validations/standard'

interface TermFormProps {
  defaultValues?: Partial<TermCreateInput>
  termId?: string
}

export function TermForm({ defaultValues, termId }: TermFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const isEditing = !!termId

  const { data: domainsData } = useQuery({
    queryKey: queryKeys.domains.list({ size: '100' }),
    queryFn: () => apiClient('/api/domains?size=100'),
  })

  const domains = (domainsData as any)?.data || []

  const form = useForm<TermCreateInput>({
    resolver: zodResolver(termCreateSchema),
    defaultValues: {
      termName: '',
      termEnglishName: '',
      termDescription: '',
      termAbbreviation: null,
      domainId: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: TermCreateInput) {
    try {
      if (isEditing) {
        await apiClient(`/api/standards/${termId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await apiClient('/api/standards', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      router.push('/standards')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="termName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>용어명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 고객명" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termEnglishName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>영문 용어명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: Customer Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>용어 설명 *</FormLabel>
              <FormControl>
                <Textarea placeholder="용어에 대한 설명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termAbbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>약어</FormLabel>
              <FormControl>
                <Input placeholder="예: CUST_NM" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="도메인을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {domains.map((domain: { id: string; domainName: string }) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '저장 중...' : isEditing ? '수정' : '등록'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Step 2: Verify types compile**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/standard/term-form.tsx
git commit -m "feat: add standard term form component with domain dropdown"
```

---

## Task 5: List Page

**Files:**
- Create: `src/app/(dashboard)/standards/page.tsx`

**Step 1: Create the list page**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TermTable } from '@/components/standard/term-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'

export default function StandardsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (search) params.search = search
  if (status !== 'all') params.status = status

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.standards.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient(`/api/standards?${qs}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">표준 용어</h2>
        <Button asChild>
          <Link href="/standards/new">용어 등록</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="용어명 검색..."
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
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <>
          <TermTable terms={(data as any)?.data || []} />
          {(data as any)?.pagination && (
            <DataTablePagination
              page={(data as any).pagination.page}
              size={(data as any).pagination.size}
              total={(data as any).pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/standards/page.tsx
git commit -m "feat: add standard term list page"
```

---

## Task 6: Create, Detail, Edit Pages

**Files:**
- Create: `src/app/(dashboard)/standards/new/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/edit/page.tsx`

**Step 1: Create new term page**

`src/app/(dashboard)/standards/new/page.tsx`:

```tsx
import { TermForm } from '@/components/standard/term-form'

export default function NewStandardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 용어 등록</h2>
      <TermForm />
    </div>
  )
}
```

**Step 2: Create detail page**

`src/app/(dashboard)/standards/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/get-session'

export default async function StandardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  const term = await prisma.standardTerm.findUnique({
    where: { id },
    include: {
      domain: { select: { id: true, domainName: true, dataType: true } },
      creator: { select: { name: true } },
    },
  })

  if (!term) notFound()

  const canEdit = user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{term.termName}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/standards/${id}/edit`}>수정</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/standards">목록</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>용어 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">용어명</p>
              <p className="font-medium">{term.termName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">영문 용어명</p>
              <p className="font-medium">{term.termEnglishName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">약어</p>
              <p className="font-medium">{term.termAbbreviation ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusBadge status={term.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">도메인</p>
              <Link href={`/domains/${term.domain.id}`} className="text-blue-600 hover:underline font-medium">
                {term.domain.domainName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">버전</p>
              <p className="font-medium">{term.version}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">용어 설명</p>
            <p className="font-medium">{term.termDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">등록자</p>
              <p className="font-medium">{term.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">{new Date(term.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Create edit page**

`src/app/(dashboard)/standards/[id]/edit/page.tsx`:

```tsx
import { notFound } from 'next/navigation'

import { TermForm } from '@/components/standard/term-form'
import { prisma } from '@/lib/db/prisma'

export default async function EditStandardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const term = await prisma.standardTerm.findUnique({ where: { id } })

  if (!term) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 용어 수정</h2>
      <TermForm
        termId={id}
        defaultValues={{
          termName: term.termName,
          termEnglishName: term.termEnglishName,
          termDescription: term.termDescription,
          termAbbreviation: term.termAbbreviation,
          domainId: term.domainId,
        }}
      />
    </div>
  )
}
```

**Step 4: Verify types compile**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/standards/
git commit -m "feat: add standard term detail, create, edit pages"
```

---

## Task 7: Build Verification & Final Commit

**Step 1: Type check**

Run: `cd .worktrees/metadata-platform/metadata-platform && npx tsc --noEmit`
Expected: No errors

**Step 2: Build check**

Run: `cd .worktrees/metadata-platform/metadata-platform && npm run build`
Expected: Build succeeds

**Step 3: Run tests**

Run: `cd .worktrees/metadata-platform/metadata-platform && npm run test:run`
Expected: All existing tests pass (no regressions)
