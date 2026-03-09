---
title: 메타데이터 관리 플랫폼 v0.4.0 - 표준 코드 CRUD 리파인먼트
version: 0.4.0
date: 2026-03-09
branch: feature/metadata-platform
scope: 표준 코드 목록 UX 개선, 캐시 일관성 보강, 수정 페이지 권한 가드
design_doc: docs/plans/2026-03-06-codes-crud-refinement-design.md
impl_plan: docs/plans/2026-03-06-codes-crud-refinement-impl.md
---

## 개요

표준 코드(codes) CRUD 페이지를 v0.3.0에서 표준 용어에 적용한 UX 개선 패턴과 동일한 수준으로 리파인했습니다. 디바운스 검색, 스켈레톤 로딩, 에러 Alert, TanStack Query 캐시 무효화, 수정 페이지 RBAC 가드를 적용했습니다.

## 변경 사항

- `/codes` 목록 검색 입력에 300ms debounce를 적용했습니다.
- 코드 그룹 목록 로딩 중 6컬럼 테이블 스켈레톤을 표시합니다.
- 목록 조회 실패 시 destructive `Alert`로 오류 메시지를 노출합니다.
- 코드 그룹 생성/수정 후 `router.refresh()` 대신 TanStack Query `invalidateQueries`로 목록 캐시를 갱신합니다.
- 코드 그룹 수정 페이지(`/codes/[id]/edit`)에 RBAC 가드를 추가하여 ADMIN, STANDARD_MANAGER 역할만 접근 가능하도록 했습니다.

## 신규 파일

- `src/components/code/code-group-table-skeleton.tsx`

## 수정된 파일

- `src/app/(dashboard)/codes/page.tsx` — 디바운스 검색, 스켈레톤, 에러 Alert
- `src/components/code/code-group-form.tsx` — TanStack Query 캐시 무효화
- `src/app/(dashboard)/codes/[id]/edit/page.tsx` — RBAC 가드

## 검증

- `npx tsc --noEmit` — 통과
- `npm run build` — 통과
