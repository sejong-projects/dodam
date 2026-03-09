---
title: 관리자 페이지 설계 — 사용자 목록 및 역할 관리
date: 2026-03-09
version: "1.0"
branch: feature/metadata-platform
scope: ADMIN 전용 사용자 목록 조회, 역할 변경, 상태 관리
---

## 목표

ADMIN 역할 사용자가 전체 사용자 목록을 조회하고 역할을 관리할 수 있는 관리자 페이지를 구현한다. 사이드바에 이미 "사용자 관리" 링크(`/admin/users`)가 존재하며 ADMIN에게만 노출된다.

## 설계 결정

### 접근 제어

- 서버 컴포넌트에서 `getSession()` + ADMIN 역할 확인 → 비ADMIN은 `/standards`로 redirect
- API 라우트에서 `requireRole([RoleName.ADMIN])` 가드

### 역할 변경 방식

**선택: 인라인 역할 편집 (Dialog)**
- 사용자 행의 "역할 변경" 버튼 클릭 → Dialog에 체크박스 목록 표시
- 저장 시 `PUT /api/admin/users/:id/role` 호출 (기존 역할 삭제 → 새 역할 일괄 부여)
- 대안으로 고려한 드롭다운 멀티셀렉트는 4개 역할에 비해 과도한 UI 복잡도

### 상태 표시

- `UserStatus` (ACTIVE/INACTIVE) 표시만 — 상태 변경은 v1 범위 외

## 데이터 흐름

```
AdminUsersPage (server) → getSession() ADMIN 확인
  → AdminUsersClient (client)
    → useQuery GET /api/admin/users?page=1&size=20&search=
    → UserTable (역할 배지, 역할 변경 버튼)
    → RoleEditDialog → useMutation PUT /api/admin/users/:id/role
      → invalidateQueries → 목록 자동 갱신
```

## API 설계

### GET /api/admin/users

- Auth: `requireRole([ADMIN])`
- Query: `page`, `size`, `search` (이름/이메일 OR 검색)
- Response: `{ data: User[], pagination }` — User에 `roles: { name }[]` 포함
- 정렬: `createdAt desc`

### PUT /api/admin/users/[id]/role

- Auth: `requireRole([ADMIN])`
- Body: `{ roles: RoleName[] }` — Zod 검증
- Logic: `$transaction` — 기존 UserRole 전체 삭제 → 새 역할 일괄 생성
- 자기 자신의 ADMIN 역할 제거 방지 (lockout 방지)
- Response: `{ data: updatedUser }`

## 컴포넌트 구조

| 컴포넌트 | 유형 | 역할 |
|---------|------|------|
| `admin/users/page.tsx` | Server | 세션 확인, ADMIN 가드, 클라이언트 래퍼 |
| `admin-users-client.tsx` | Client | 검색 + 페이지네이션 + useQuery |
| `user-table.tsx` | Client | 사용자 테이블 렌더링 |
| `user-table-skeleton.tsx` | Server | 로딩 스켈레톤 |
| `role-edit-dialog.tsx` | Client | 역할 체크박스 Dialog + useMutation |
| `user-status-badge.tsx` | Server | ACTIVE/INACTIVE 배지 |

## 파일 매니페스트

**신규 (8 files):**
- `src/lib/validations/admin.ts` — 역할 변경 Zod 스키마
- `src/app/api/admin/users/route.ts` — 사용자 목록 API
- `src/app/api/admin/users/[id]/role/route.ts` — 역할 변경 API
- `src/components/admin/admin-users-client.tsx`
- `src/components/admin/user-table.tsx`
- `src/components/admin/user-table-skeleton.tsx`
- `src/components/admin/role-edit-dialog.tsx`
- `src/components/admin/user-status-badge.tsx`

**수정 (1 file):**
- `src/app/(dashboard)/admin/users/page.tsx` — 서버 컴포넌트로 리팩토링

## 재사용 유틸리티

- `queryKeys.users` — 추가 필요 (`src/lib/query/keys.ts`)
- `DataTablePagination`, `useDebounce`, `apiClient`, `getSession`, `requireRole`
- shadcn: Dialog, Checkbox, Table, Badge, Skeleton, Alert, Button, Input
