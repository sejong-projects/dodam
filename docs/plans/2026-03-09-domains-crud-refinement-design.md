---
title: 표준 도메인 CRUD 리파인먼트 설계
date: 2026-03-09
version: "1.0"
branch: feature/metadata-platform
scope: 도메인 목록 UX 개선, 캐시 일관성 보강, 수정 페이지 권한 가드
---

## 목표

Standards(v0.3.0), Codes(v0.4.0)에 적용된 UX 개선 패턴을 Domains에 동일하게 적용하여 세 엔티티의 UX 일관성을 확보한다.

## 변경 범위

### 1. 목록 페이지 — 디바운스 검색 + 스켈레톤 + 에러 Alert

- 검색 입력에 300ms `useDebounce` 적용
- `isLoading` 시 6컬럼 테이블 스켈레톤 렌더링
- `isError` 시 destructive `Alert` + `AlertCircle` 아이콘

### 2. 폼 컴포넌트 — TanStack Query 캐시 무효화

- `router.refresh()` 제거
- `useQueryClient` + `invalidateQueries({ queryKey: queryKeys.domains.all })` 로 교체

### 3. 수정 페이지 — RBAC 가드

- `getSession()` + `hasAnyRole([ADMIN, STANDARD_MANAGER])` 검증
- 권한 없으면 `/domains`로 redirect

## 파일 변경

| 파일 | 유형 |
|------|------|
| `src/components/domain/domain-table-skeleton.tsx` | 신규 |
| `src/app/(dashboard)/domains/page.tsx` | 수정 |
| `src/components/domain/domain-form.tsx` | 수정 |
| `src/app/(dashboard)/domains/[id]/edit/page.tsx` | 수정 |

## 참조 구현

- 스켈레톤: `src/components/code/code-group-table-skeleton.tsx`
- 목록 페이지: `src/app/(dashboard)/codes/page.tsx`
- 캐시 무효화: `src/components/code/code-group-form.tsx`
- RBAC 가드: `src/app/(dashboard)/codes/[id]/edit/page.tsx`
