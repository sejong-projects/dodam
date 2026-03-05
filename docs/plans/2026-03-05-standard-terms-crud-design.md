---
title: "표준 용어 CRUD 설계"
date: 2026-03-05
version: "1.0"
branch: feature/metadata-platform
task: "Task 8 from metadata-platform-impl-v2"
---

# 표준 용어 CRUD 설계

## Overview

표준 용어(StandardTerm) 엔터티에 대한 CRUD 기능 구현. 도메인 CRUD(Task 7)의 레퍼런스 구현 패턴을 그대로 따르며, 차이점만 반영한다.

## Approach

**Pure Clone & Adapt** — 도메인 CRUD와 동일한 파일 구조, 동일한 패턴. 모델명과 필드명만 변경하고, 도메인 선택 드롭다운을 폼에 추가.

## API Routes

### `GET /api/standards`

- 인증 필요 (`requireAuth`)
- Query params: `page`, `size`, `search`, `status`
- 검색 대상: `termName`, `termEnglishName`, `termDescription` (insensitive)
- Include: `domain` (name), `creator` (id, name)
- 응답: `{ data, pagination: { page, size, total } }`

### `POST /api/standards`

- 역할: `ADMIN` or `STANDARD_MANAGER`
- Validation: `termCreateSchema` (Zod)
- 중복 체크: `termName` + `version: 1` unique 확인 → 409 DUPLICATE
- `createdBy`는 세션 사용자 ID

### `GET /api/standards/:id`

- 인증 필요
- Include: `domain` (full info), `creator`

### `PUT /api/standards/:id`

- 역할: `ADMIN` or `STANDARD_MANAGER`
- Validation: `termUpdateSchema` (partial)

### `DELETE /api/standards/:id`

- 역할: `ADMIN` or `STANDARD_MANAGER`
- 의존성 체크 불필요 (용어는 leaf entity)

## UI Components

### `term-table.tsx`

- 컬럼: 용어명, 영문명, 약어, 도메인, 상태, 등록자, 등록일
- Row click → `/standards/${id}`

### `term-form.tsx`

- 필드: 용어명*, 영문 용어명*, 용어 설명*(Textarea), 약어(optional), 도메인*(Select)
- 도메인 드롭다운: `GET /api/domains?size=100` via TanStack Query
- Create/Edit 모드: `termId` prop 유무로 결정
- Zod: `termCreateSchema` from `src/lib/validations/standard.ts`

## Pages

### `/(dashboard)/standards/page.tsx` — 목록

- Client component, TanStack Query
- 검색 input + 상태 필터 + "용어 등록" 버튼
- `queryKeys.standards.list(params)`
- `TermTable` + `DataTablePagination`

### `/(dashboard)/standards/new/page.tsx` — 등록

- "표준 용어 등록" 타이틀 + `<TermForm />`

### `/(dashboard)/standards/[id]/page.tsx` — 상세

- Server component, direct Prisma query
- 표시: 용어명, 영문명, 약어, 설명, 도메인(link), 상태, 버전, 등록자, 등록일
- Edit 버튼 (role-gated), 목록 버튼

### `/(dashboard)/standards/[id]/edit/page.tsx` — 수정

- Fetch term → `<TermForm defaultValues={...} termId={id} />`

## Files

- `src/app/api/standards/route.ts` (new)
- `src/app/api/standards/[id]/route.ts` (new)
- `src/components/standard/term-table.tsx` (new)
- `src/components/standard/term-form.tsx` (new)
- `src/app/(dashboard)/standards/page.tsx` (new)
- `src/app/(dashboard)/standards/new/page.tsx` (new)
- `src/app/(dashboard)/standards/[id]/page.tsx` (new)
- `src/app/(dashboard)/standards/[id]/edit/page.tsx` (new)

## Existing Assets (no changes needed)

- `src/lib/validations/standard.ts` — Zod schemas already exist
- `src/lib/query/keys.ts` — `queryKeys.standards` already registered
