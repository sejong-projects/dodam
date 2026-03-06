---
title: 표준 코드 CRUD 리파인먼트 설계
date: 2026-03-06
version: "1.0"
branch: feature/metadata-platform
scope: Task 9 UI 리파인먼트 — 로딩/에러 상태, 디바운스 검색, 캐시 무효화, RBAC 버그 수정
---

## 배경

Task 7(도메인)과 Task 8(표준 용어)에서 디바운스 검색, 스켈레톤 로딩, TanStack Query 캐시 무효화, 타입 안전성 등의 리파인먼트를 적용했다. Task 9(표준 코드)는 API 레이어가 완성되어 있지만 UI가 초기 구현 상태이므로, 동일한 품질 기준을 적용한다.

## 변경 범위

### 1. 코드 그룹 테이블 스켈레톤 추가

- 신규 파일: `src/components/code/code-group-table-skeleton.tsx`
- `term-table-skeleton.tsx`와 동일한 패턴 (5행, 컬럼별 너비 차등)
- 코드 테이블 컬럼 수(6개)에 맞춤: 코드그룹명, 영문명, 항목 수, 상태, 등록자, 등록일

### 2. 목록 페이지 개선 (`codes/page.tsx`)

- `useDebounce(search, 300)` 적용하여 키 입력마다 API 호출 방지
- 로딩 시 `<CodeGroupTableSkeleton />` 표시
- 에러 시 `Alert variant="destructive"` 표시
- `apiClient<CodeGroup[]>` 타입 지정으로 `as any` 방지

### 3. 테이블 컴포넌트 타입 정리 (`code-group-table.tsx`)

- 인라인 `CodeGroup` 인터페이스를 export하여 목록 페이지에서 재사용
- 또는 별도 타입 파일 분리 없이 컴포넌트에서 export (표준 용어 패턴과 동일)

### 4. 폼 캐시 무효화 (`code-group-form.tsx`)

- `router.refresh()` 제거
- `useQueryClient()` + `queryClient.invalidateQueries({ queryKey: queryKeys.codes.all })` 적용
- 표준 용어 폼(`term-form.tsx`)과 동일한 패턴

### 5. 상세 페이지 RBAC 버그 수정 (`codes/[id]/page.tsx`)

- 현재: `user.roles.includes('ADMIN' || 'STANDARD_MANAGER')` — JS 논리 연산자 우선순위로 인해 ADMIN만 체크됨
- 수정: `user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')`

### 6. 수정 페이지 권한 가드 (`codes/[id]/edit/page.tsx`)

- 현재: 권한 검증 없음
- 수정: 세션 확인 및 역할 검증 추가 (상세 페이지와 동일 패턴)

## 변경하지 않는 것

- API 라우트 (이미 완성)
- Prisma 스키마
- 유효성 검증 스키마 (`code.ts`)
- 코드 항목 에디터 (`code-item-editor.tsx`)
- 쿼리 키 (`keys.ts` — 이미 정의됨)

## 참고 패턴

- 스켈레톤: `src/components/standard/term-table-skeleton.tsx`
- 디바운스: `src/hooks/use-debounce.ts`
- 캐시 무효화: `src/components/standard/term-form.tsx`
- 에러 Alert: `src/app/(dashboard)/standards/page.tsx`
