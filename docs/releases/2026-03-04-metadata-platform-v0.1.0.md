---
title: 메타데이터 관리 플랫폼 v0.1.0 — 프로젝트 초기 구축
version: 0.1.0
date: 2026-03-04
branch: feature/metadata-platform
scope: Task 1 ~ Task 5 (구현 계획 v2 기준)
design_doc: docs/plans/2026-03-04-metadata-platform-impl-v2.md
---

## 개요

메타데이터 관리 플랫폼의 기반 인프라를 구축했습니다. 프로젝트 초기 설정부터 데이터베이스 스키마, 인증 시스템, 로그인/회원가입 UI, TanStack Query 인프라까지 — 이후 CRUD 기능 개발을 위한 토대가 완성되었습니다.

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| 언어 | TypeScript | 5.9 |
| 데이터베이스 | PostgreSQL | 18 |
| ORM | Prisma (Driver Adapter) | 7.4.2 |
| 인증 | Better Auth | 1.5.2 |
| UI | shadcn/ui + Tailwind CSS | 4.x |
| 상태 관리 | TanStack Query | v5 |
| 테스트 | Vitest | 4.x |
| 런타임 | Node.js | 24.x |

---

## 구현 내역

### Task 1: 프로젝트 초기 설정

**커밋:** `1f24a84`

- Next.js 16.1 프로젝트 생성 (App Router, Turbopack, `src/` 디렉토리)
- shadcn/ui 초기화 및 핵심 컴포넌트 18종 설치
  - button, input, label, card, table, dialog, dropdown-menu, select, badge, separator, toast, tabs, form, textarea, breadcrumb, sidebar, sheet, avatar, alert
- Vitest 4 테스트 환경 구성 (`vitest.config.ts`, `src/test/setup.ts`)
- 개발 스크립트 설정 (dev, build, test, db 명령어)
- 환경 변수 템플릿 (`.env.example`)

### Task 2: Prisma 스키마 & 데이터베이스 설정

**커밋:** `81e008f`

**데이터 모델 (13 모델, 8 enum):**

```
사용자/권한 (RBAC)
├── User          — 사용자 (email, password, name, department, status)
├── Role          — 역할 (ADMIN, STANDARD_MANAGER, APPROVER, VIEWER)
├── UserRole      — 사용자-역할 매핑 (복합 PK)
├── Session       — Better Auth 세션
├── Account       — Better Auth 계정 (소셜 로그인 확장용)
└── Verification  — 이메일 인증

표준 데이터
├── StandardDomain — 표준 도메인 (dataType, length, scale, allowedValues)
├── StandardTerm   — 표준 용어 (버전 관리, 도메인 연관)
├── CodeGroup      — 코드 그룹
└── CodeItem       — 코드 항목 (그룹 내 정렬, 활성 상태)

승인 워크플로우
├── ApprovalRequest — 승인 요청 (TERM/DOMAIN/CODE_GROUP 대상)
└── ApprovalHistory — 승인 이력 (SUBMITTED/APPROVED/REJECTED/CANCELLED)
```

**시드 데이터:**
| 구분 | 이메일 | 비밀번호 | 역할 |
|------|--------|----------|------|
| 관리자 | admin@example.com | admin1234 | ADMIN |
| 표준 담당자 | manager@example.com | manager1234 | STANDARD_MANAGER |
| 승인자 | approver@example.com | approver1234 | APPROVER |

- 샘플 도메인: `한글명` (VARCHAR, 100자, ACTIVE)

**인프라:**
- Prisma 7 Driver Adapter 패턴 (`PrismaPg`)
- 싱글톤 클라이언트 (`src/lib/db/prisma.ts`) — hot reload 대응
- Docker PostgreSQL 18 (port 5433, 로컬 PostgreSQL 5432 충돌 회피)

### Task 3: 인증 시스템 (Better Auth)

**커밋:** `2a2ca81`

- **서버:** Better Auth + Prisma adapter 연동, 이메일/비밀번호 인증 활성화
- **클라이언트:** `better-auth/react`의 `createAuthClient`로 React 통합
- **API:** `/api/auth/[...all]` catch-all 라우트 핸들러
- **라우트 보호:** `proxy.ts` (Next.js 16 패턴)
  - 보호 경로: `/standards`, `/domains`, `/codes`, `/workflow`, `/admin`
  - 미인증 시 `/login`으로 리다이렉트
  - 인증 상태에서 `/login`, `/signup` 접근 시 `/standards`로 리다이렉트
- **RBAC 헬퍼:** `assignDefaultRole()`, `getUserRoles()` 서버 액션
- **타입:** `SessionUser` (id, email, name, roles)

### Task 4: 로그인/회원가입 UI

**커밋:** `f3444e7`

- **루트 페이지:** `/` → `/login` 리다이렉트
- **인증 레이아웃:** 중앙 정렬 카드 디자인 (`(auth)/layout.tsx`)
- **로그인 페이지:** 이메일/비밀번호 입력, 에러 표시, 로딩 상태
- **회원가입 페이지:** 이름, 이메일, 비밀번호, 부서(선택) 입력
  - 가입 시 자동으로 VIEWER 역할 부여

### Task 5: TanStack Query 설정 & API 클라이언트

**커밋:** `311e0f1`

- **API 클라이언트** (`src/lib/api/client.ts`): fetch 래퍼 — 공통 `Content-Type` 헤더, JSON 에러 파싱
- **Query Key Factory** (`src/lib/query/keys.ts`): 4개 엔티티(domains, standards, codes, workflow)별 `all` / `list` / `detail` 키 구조
- **QueryProvider** (`src/lib/query/provider.tsx`): `'use client'` 컴포넌트, `staleTime: 60s`, `retry: 1` 기본 설정, ReactQueryDevtools 포함
- **Root Layout 연동** (`src/app/layout.tsx`): `<QueryProvider>`로 `{children}` 감싸기

---

## 구현 중 발견된 이슈 및 해결

### 1. Prisma 7 import 경로 변경
- **문제:** Prisma 7은 `@prisma/client` 대신 `src/generated/prisma/`에 코드를 생성하며, `index.ts`가 없어 디렉토리 import 불가
- **해결:** `@/generated/prisma/client`로 개별 파일 직접 import

### 2. Docker PostgreSQL 포트 충돌
- **문제:** 로컬 PostgreSQL이 5432에서 실행 중이어서 Docker 컨테이너 연결 실패 (`P1000: Authentication failed`)
- **해결:** Docker 컨테이너를 `-p 5433:5432`로 매핑하여 포트 분리

### 3. Prisma 7 prisma.config.ts
- **문제:** Prisma 7은 `prisma.config.ts`에서 datasource URL을 설정하며, `dotenv/config` import 필요
- **해결:** `dotenv` dev dependency 추가

---

## 남은 작업

| Task | 설명 | 상태 |
|------|------|------|
| Task 5 | TanStack Query 설정 & API 클라이언트 | 완료 |
| Task 6 | 대시보드 레이아웃 (Sidebar + Header) | 대기 |
| Task 7 | 표준 도메인 CRUD (API + UI) | 대기 |
| Task 8 | 표준 용어 CRUD (API + UI) | 대기 |
| Task 9 | 표준 코드 CRUD (API + UI) | 대기 |
| Task 10 | 승인 워크플로우 (API + UI) | 대기 |
| Task 11 | 관리자 페이지 (사용자/역할 관리) | 대기 |
| Task 12 | E2E 테스트 (Playwright) | 대기 |

---

## 프로젝트 구조 (현재)

```
metadata-platform/
├── prisma/
│   ├── migrations/         # DB 마이그레이션 이력
│   ├── schema.prisma       # 데이터 모델 정의
│   └── seed.ts             # 초기 데이터
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # 인증 레이아웃
│   │   │   ├── login/page.tsx      # 로그인
│   │   │   └── signup/page.tsx     # 회원가입
│   │   ├── api/auth/[...all]/
│   │   │   └── route.ts            # Better Auth API
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   └── page.tsx                # / → /login 리다이렉트
│   ├── components/ui/              # shadcn/ui 컴포넌트 (18종)
│   ├── generated/prisma/           # Prisma 생성 코드 (.gitignore)
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts           # fetch 래퍼 (API 클라이언트)
│   │   ├── auth/
│   │   │   ├── index.ts            # Better Auth 서버 설정
│   │   │   ├── client.ts           # Better Auth 클라이언트
│   │   │   └── actions.ts          # RBAC 서버 액션
│   │   ├── db/
│   │   │   └── prisma.ts           # Prisma 싱글톤 클라이언트
│   │   ├── query/
│   │   │   ├── keys.ts             # Query Key Factory
│   │   │   └── provider.tsx        # QueryProvider (TanStack Query)
│   │   └── utils.ts                # cn() 유틸리티
│   ├── proxy.ts                    # 라우트 보호 (Next.js 16)
│   ├── test/setup.ts               # Vitest 설정
│   └── types/auth.ts               # SessionUser 타입
├── .env.example
├── prisma.config.ts                # Prisma 7 설정
├── vitest.config.ts
└── package.json
```
