---
title: 메타데이터 관리 플랫폼 v0.3.0 - 표준 용어 목록 안정화
version: 0.3.0
date: 2026-03-06
branch: feature/metadata-platform
scope: 표준 용어 목록 UX 개선, 캐시 일관성 보강, 오프라인 빌드 안정화
design_doc: docs/plans/2026-03-04-metadata-platform-impl-v2.md
---

## 개요

표준 용어 목록 페이지의 검색, 로딩, 오류 처리 흐름을 정리하고 저장 이후 캐시를 일관되게 갱신하도록 보완했습니다. 함께, 루트 레이아웃의 `next/font/google` 의존성을 제거하고 Prisma 생성 클라이언트와 충돌하던 Turbopack 프로덕션 빌드를 Webpack으로 우회해 빌드 안정성을 확보했습니다.

## 변경 사항

- `/standards` 검색 입력에 300ms debounce를 적용해 키 입력마다 API를 호출하던 동작을 완화했습니다.
- 목록 로딩 중 텍스트 대신 테이블 스켈레톤을 표시하고, 조회 실패 시 파괴적 `Alert`로 오류 메시지를 노출합니다.
- `apiClient<Term[]>()`와 `Term` 타입 export를 통해 표준 용어 목록 화면의 `as any` 캐스트를 제거했습니다.
- 결과가 0건일 때 페이지네이션이 `1-0건`으로 보이던 문제를 `총 0건`으로 수정했습니다.
- 표준 용어 생성/수정 후 `router.refresh()` 대신 TanStack Query `invalidateQueries`를 사용해 목록 캐시를 갱신합니다.
- 루트 레이아웃에서 Google Fonts fetch를 제거하고 CSS 변수 기반 시스템 폰트 fallback으로 전환했습니다.
- `next.config.ts`에 `turbopack.root`를 지정해 잘못된 워크스페이스 루트 추론 경고를 줄였습니다.
- `npm run build`를 `next build --webpack`으로 전환해 Prisma 생성 클라이언트가 Turbopack 프로덕션 빌드에서 실패하던 문제를 우회했습니다.

## 신규 파일

- `src/hooks/use-debounce.ts`
- `src/components/standard/term-table-skeleton.tsx`

## 검증

- `npx tsc --noEmit`
- `npm run build`
