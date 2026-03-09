---
title: 메타데이터 관리 플랫폼 v0.6.0 - 승인 워크플로우
version: 0.6.0
date: 2026-03-09
branch: feature/metadata-platform
scope: 승인 워크플로우 서비스, API, CRUD 통합, UI 페이지
---

## 개요

엔티티(도메인, 표준 용어, 코드 그룹) 등록 시 자동으로 승인 요청이 생성되는 거버넌스 워크플로우를 추가했습니다. APPROVER/ADMIN 역할의 사용자가 승인하면 엔티티가 DRAFT에서 ACTIVE 상태로 전환됩니다.

## 변경 사항

- 엔티티 등록(POST) 시 `ApprovalRequest`(PENDING) + `ApprovalHistory`(SUBMITTED) 레코드를 자동 생성합니다.
- 승인(`/api/workflow/[id]/approve`) 처리 시 `$transaction`으로 요청 상태 변경 + 이력 기록 + 대상 엔티티 ACTIVE 전환을 원자적으로 수행합니다.
- 반려(`/api/workflow/[id]/reject`) 시 필수 사유 입력과 함께 요청이 REJECTED 상태로 전환됩니다.
- `/workflow` 페이지에 "내 요청" / "승인 대기" 탭을 추가했습니다. "승인 대기" 탭은 APPROVER/ADMIN 역할에만 표시됩니다.
- `/workflow/[id]` 상세 페이지에서 요청 정보, 대상 엔티티 미리보기, 처리 이력 타임라인을 확인할 수 있습니다.

## 신규 파일

- `src/lib/validations/workflow.ts` — 승인/반려 Zod 스키마
- `src/lib/workflow/approval-service.ts` — 승인 요청 생성, 승인, 반려 서비스
- `src/app/api/workflow/route.ts` — 승인 요청 목록 API
- `src/app/api/workflow/[id]/route.ts` — 승인 요청 상세 API
- `src/app/api/workflow/[id]/approve/route.ts` — 승인 API
- `src/app/api/workflow/[id]/reject/route.ts` — 반려 API
- `src/components/workflow/approval-status-badge.tsx` — 승인 상태 배지
- `src/components/workflow/workflow-request-table.tsx` — 승인 요청 테이블
- `src/components/workflow/workflow-table-skeleton.tsx` — 테이블 스켈레톤
- `src/components/workflow/approval-timeline.tsx` — 처리 이력 타임라인
- `src/components/workflow/workflow-detail-actions.tsx` — 승인/반려 액션 버튼
- `src/components/workflow/workflow-list-client.tsx` — 워크플로우 목록 클라이언트 컴포넌트
- `src/app/(dashboard)/workflow/[id]/page.tsx` — 승인 요청 상세 페이지

## 수정된 파일

- `src/app/(dashboard)/workflow/page.tsx` — 서버 컴포넌트로 리팩토링, 세션 전달
- `src/app/api/domains/route.ts` — POST에 승인 요청 자동 생성 추가
- `src/app/api/standards/route.ts` — POST에 승인 요청 자동 생성 추가
- `src/app/api/codes/route.ts` — POST에 승인 요청 자동 생성 추가

## 검증

- `npx tsc --noEmit` — 통과
- `npm run build` — 통과
