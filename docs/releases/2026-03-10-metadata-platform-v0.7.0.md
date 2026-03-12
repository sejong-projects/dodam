---
title: 메타데이터 관리 플랫폼 v0.7.0 - 관리자 사용자 관리
version: 0.7.0
date: 2026-03-10
branch: feature/metadata-platform
scope: 관리자 사용자 목록, 역할 변경, Elevated UI
---

## 개요

ADMIN 역할 사용자가 전체 사용자 목록을 조회하고 역할을 관리할 수 있는 관리자 페이지를 추가했습니다. 기존 앱과 일관된 구조를 유지하면서 색상 코딩된 역할 배지, 상태 도트 인디케이터, 검색 아이콘 등 시각적 완성도를 높인 Elevated UI를 적용했습니다.

## 변경 사항

- `GET /api/admin/users` — ADMIN 전용 사용자 목록 API (검색, 페이지네이션, 역할 포함)
- `PUT /api/admin/users/[id]/role` — 역할 변경 API (자기 자신 ADMIN 역할 제거 방지, 트랜잭션 처리)
- `/admin/users` 페이지 — 서버 컴포넌트에서 ADMIN 가드 적용, 비ADMIN은 `/standards`로 리다이렉트
- 사용자 테이블 — 이름, 이메일, 부서, 역할, 상태, 가입일 표시
- 역할 편집 다이얼로그 — 체크박스 + 역할 설명, 변경 감지, 로딩 스피너
- 디바운스 검색 — 검색 아이콘 + 클리어 버튼 포함

## Elevated UI 개선

- **색상 코딩 역할 배지**: ADMIN(빨강), 표준담당자(파랑), 승인자(황색), 조회자(회색) + 다크모드 지원
- **상태 도트 인디케이터**: ACTIVE(초록 도트), INACTIVE(회색 도트)
- **검색 입력**: 검색 아이콘 프리픽스 + X 클리어 버튼
- **빈 상태**: Users 아이콘 + 메시지
- **스켈레톤 로딩**: 행마다 다른 너비로 자연스러운 로딩 효과
- **역할 편집 다이얼로그**: 카드형 체크박스 + 역할별 설명문

## 신규 파일

- `src/lib/validations/admin.ts` — 역할 변경 Zod 스키마
- `src/app/api/admin/users/route.ts` — 사용자 목록 API
- `src/app/api/admin/users/[id]/role/route.ts` — 역할 변경 API
- `src/components/admin/user-status-badge.tsx` — 사용자 상태 배지 (도트)
- `src/components/admin/user-table.tsx` — 사용자 테이블
- `src/components/admin/user-table-skeleton.tsx` — 테이블 스켈레톤
- `src/components/admin/role-edit-dialog.tsx` — 역할 편집 다이얼로그
- `src/components/admin/admin-users-client.tsx` — 사용자 관리 클라이언트

## 수정된 파일

- `src/lib/query/keys.ts` — users 쿼리 키 팩토리 추가
- `src/app/(dashboard)/admin/users/page.tsx` — 서버 컴포넌트로 리팩토링

## 검증

- `npx tsc --noEmit` — 통과
- `npm run build` — 통과 (32 routes, /admin/users 동적 렌더링)
