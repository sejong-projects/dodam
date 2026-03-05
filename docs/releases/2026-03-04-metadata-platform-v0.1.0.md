---
title: 메타데이터 관리 플랫폼 v0.1.0 — 프로젝트 초기 구축
version: 0.1.0
date: 2026-03-04
branch: feature/metadata-platform
scope: Task 1 ~ Task 8 (구현 계획 v2 기준)
design_doc: docs/plans/2026-03-04-metadata-platform-impl-v2.md
---

## 개요

메타데이터 관리 플랫폼의 기반 인프라를 구축하고, 표준 도메인과 표준 용어 CRUD를 구현했습니다. 프로젝트 초기 설정부터 데이터베이스 스키마, 인증 시스템, 로그인/회원가입 UI, TanStack Query 인프라, 대시보드 레이아웃, 표준 도메인 CRUD, 표준 용어 CRUD(API + UI)까지 완성되었습니다.

---

## 기술 스택

| 영역 | 기술 | 버전 |
| ------ | ------ | ------ |
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

데이터 모델 (13 모델, 8 enum):

```txt
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

시드 데이터:

| 구분 | 이메일 | 비밀번호 | 역할 |
| ------ | -------- | ---------- | ------ |
| 관리자 | <admin@example.com> | admin1234 | ADMIN |
| 표준 담당자 | <manager@example.com> | manager1234 | STANDARD_MANAGER |
| 승인자 | <approver@example.com> | approver1234 | APPROVER |

- 샘플 도메인: `한글명` (VARCHAR, 100자, ACTIVE)

인프라:

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

### Task 6: 대시보드 레이아웃 (Sidebar + Header)

**커밋:** `bb49ae1` ~ `d1444c2` (6 commits)

- **세션 헬퍼** (`src/lib/auth/get-session.ts`): 서버 사이드 세션 조회 + 역할 유틸리티 (`getSession()`, `hasRole()`, `hasAnyRole()`)
- **사이드바** (`src/components/layout/app-sidebar.tsx`): shadcn/ui Sidebar 기반
  - 메타데이터 관리 그룹: 표준 용어, 표준 도메인, 표준 코드, 승인 관리
  - 관리자 그룹 (ADMIN 역할만 표시): 사용자 관리
  - `usePathname()` 기반 활성 메뉴 하이라이트
- **헤더** (`src/components/layout/app-header.tsx`): SidebarTrigger + 앱 타이틀 + 사용자 메뉴
- **사용자 네비게이션** (`src/components/layout/user-nav.tsx`): 아바타 이니셜 + 드롭다운 (이름, 이메일, 로그아웃)
- **대시보드 레이아웃** (`src/app/(dashboard)/layout.tsx`): 서버 컴포넌트에서 세션 조회 → 사이드바/헤더에 props 전달
- **플레이스홀더 페이지** 5개: `/standards`, `/domains`, `/codes`, `/workflow`, `/admin/users`

### 인증 버그 수정

**커밋:** `db6c463`

- **Better Auth 패스워드 해싱 불일치**: 시드에서 bcrypt 사용 → Better Auth는 scrypt 사용. `better-auth/crypto`의 `hashPassword`로 교체
- **User.password 필수 → 선택**: Better Auth는 users 테이블에 password를 저장하지 않고 accounts 테이블 사용. `String` → `String?`로 변경
- **emailVerified 필드 누락**: Better Auth가 사용자 생성 시 요구하는 필드 추가
- **accounts 테이블 시드 누락**: Better Auth credential 인증용 account 레코드 시드에 추가
- `bcryptjs` 의존성 제거, `better-auth/crypto` 사용으로 통일

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

### 4. Better Auth 패스워드 해싱 불일치

- **문제:** 시드에서 `bcryptjs`로 해싱한 비밀번호를 Better Auth가 인식하지 못함 (`Invalid password hash`). Better Auth는 내부적으로 scrypt (`@noble/hashes`)를 사용하며, 해시 형식이 `hexSalt:hexKey`로 bcrypt의 `$2a$...` 형식과 호환되지 않음
- **해결:** `bcryptjs` 제거, `better-auth/crypto`의 `hashPassword`로 시드 해싱 통일

### 5. Better Auth 스키마 호환성

- **문제:** Better Auth가 사용자 생성 시 `emailVerified` 필드와 `accounts` 테이블을 요구하지만, 초기 스키마에 누락
- **해결:** User 모델에 `emailVerified Boolean @default(false)` 추가, `password` 필드를 `String?`로 변경, 시드에 credential account 레코드 추가

---

### Task 7: 표준 도메인 CRUD (API + UI) — 레퍼런스 구현

Task 8(용어), Task 9(코드)의 CRUD 패턴 기준이 되는 레퍼런스 구현.

검증 레이어:

- Zod 스키마 (`src/lib/validations/domain.ts`): `domainCreateSchema`, `domainUpdateSchema` (`.partial()` 패턴)
- API 인증 헬퍼 (`src/lib/auth/require-role.ts`): `requireAuth()`, `requireRole()` — discriminated union 패턴

API Routes:

- `GET /api/domains` — 목록 조회 (검색, 상태 필터, 페이지네이션)
- `POST /api/domains` — 등록 (ADMIN, STANDARD_MANAGER 역할 필요, 중복 검사)
- `GET /api/domains/:id` — 상세 조회 (연결된 표준 용어 포함)
- `PUT /api/domains/:id` — 수정
- `DELETE /api/domains/:id` — 삭제 (연결된 용어가 있으면 거부)

공통 UI 컴포넌트 (Task 8, 9에서 재사용):

- `StatusBadge` (`src/components/shared/status-badge.tsx`): DRAFT/ACTIVE/DEPRECATED 상태 표시
- `DataTablePagination` (`src/components/shared/data-table-pagination.tsx`): 이전/다음 페이지 이동

도메인 UI:

- `DomainTable` (`src/components/domain/domain-table.tsx`): 목록 테이블, 행 클릭 시 상세 이동
- `DomainForm` (`src/components/domain/domain-form.tsx`): 생성/수정 겸용 폼 (react-hook-form + Zod)

페이지:

- `/domains` — 목록 (클라이언트 컴포넌트, TanStack Query)
- `/domains/new` — 등록
- `/domains/[id]` — 상세 (서버 컴포넌트, Prisma 직접 호출)
- `/domains/[id]/edit` — 수정 (서버 컴포넌트에서 데이터 fetch → 클라이언트 폼으로 전달)

계획서 대비 수정 사항:

- `@prisma/client` → `@/generated/prisma/client` (Prisma 7 호환)
- `parsed.error.errors` → `parsed.error.issues` (Zod 4 API 변경)
- 모든 API 핸들러에 try-catch 추가 (CLAUDE.md 규칙)

---

### Task 8: 표준 용어 CRUD (API + UI)

Task 7 패턴을 재사용한 두 번째 CRUD 구현.

Task 7 대비 차이점:

- Zod 스키마: `domainId`(UUID FK) 필드 추가, 도메인 연관
- 폼: 도메인 선택 드롭다운 (`GET /api/domains?size=100`으로 목록 fetch)
- 테이블: 용어명, 영문명, 약어, 도메인명, 상태, 등록자, 등록일
- 상세 페이지: 연결된 도메인 정보 링크 + 버전 번호(v1) 표시
- 검색: termName, termEnglishName, termDescription 3개 필드
- DELETE: 의존성 체크 없음 (leaf entity)

**파일:** `src/lib/validations/standard.ts`, `src/app/api/standards/route.ts`, `src/app/api/standards/[id]/route.ts`, `src/components/standard/term-table.tsx`, `src/components/standard/term-form.tsx`, 4개 페이지

---

## 남은 작업

| Task | 설명 | 상태 |
| ------ | ------ | ------ |
| Task 6 | 대시보드 레이아웃 (Sidebar + Header) | 완료 |
| Task 7 | 표준 도메인 CRUD (API + UI) | 대기 |
| Task 8 | 표준 용어 CRUD (API + UI) | 대기 |
| Task 9 | 표준 코드 CRUD (API + UI) | 대기 |
| Task 10 | 승인 워크플로우 (API + UI) | 대기 |
| Task 11 | 관리자 페이지 (사용자/역할 관리) | 대기 |
| Task 12 | E2E 테스트 (Playwright) | 대기 |

---

## 프로젝트 구조 (현재)

```txt
metadata-platform/
├── prisma/
│   ├── migrations/         # DB 마이그레이션 이력
│   ├── schema.prisma       # 데이터 모델 정의
│   └── seed.ts             # 초기 데이터 (better-auth/crypto 해싱)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # 인증 레이아웃
│   │   │   ├── login/page.tsx      # 로그인
│   │   │   └── signup/page.tsx     # 회원가입
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # 대시보드 레이아웃 (Sidebar + Header)
│   │   │   ├── domains/
│   │   │   │   ├── page.tsx        # 표준 도메인 목록 (TanStack Query)
│   │   │   │   ├── new/page.tsx    # 도메인 등록
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    # 도메인 상세 (서버 컴포넌트)
│   │   │   │       └── edit/page.tsx # 도메인 수정
│   │   │   ├── standards/
│   │   │   │   ├── page.tsx        # 표준 용어 목록 (TanStack Query)
│   │   │   │   ├── new/page.tsx    # 용어 등록
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    # 용어 상세 (서버 컴포넌트)
│   │   │   │       └── edit/page.tsx # 용어 수정
│   │   │   ├── codes/page.tsx      # 표준 코드 (플레이스홀더)
│   │   │   ├── workflow/page.tsx   # 승인 관리 (플레이스홀더)
│   │   │   └── admin/users/page.tsx # 사용자 관리 (플레이스홀더)
│   │   ├── api/
│   │   │   ├── auth/[...all]/
│   │   │   │   └── route.ts        # Better Auth API
│   │   │   └── domains/
│   │   │       ├── route.ts        # GET 목록 + POST 생성
│   │   │       └── [id]/route.ts   # GET 상세 + PUT 수정 + DELETE 삭제
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   └── page.tsx                # / → /login 리다이렉트
│   ├── components/
│   │   ├── domain/
│   │   │   ├── domain-table.tsx    # 도메인 목록 테이블
│   │   │   └── domain-form.tsx     # 도메인 생성/수정 폼
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx     # 사이드바 (역할 기반 메뉴)
│   │   │   ├── app-header.tsx      # 헤더 (트리거 + 타이틀 + 사용자 메뉴)
│   │   │   └── user-nav.tsx        # 사용자 아바타 드롭다운
│   │   ├── shared/
│   │   │   ├── status-badge.tsx    # 상태 배지 (DRAFT/ACTIVE/DEPRECATED)
│   │   │   └── data-table-pagination.tsx # 페이지네이션
│   │   └── ui/                     # shadcn/ui 컴포넌트 (21종)
│   ├── generated/prisma/           # Prisma 생성 코드 (.gitignore)
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts           # fetch 래퍼 (API 클라이언트)
│   │   ├── auth/
│   │   │   ├── index.ts            # Better Auth 서버 설정
│   │   │   ├── client.ts           # Better Auth 클라이언트
│   │   │   ├── actions.ts          # RBAC 서버 액션
│   │   │   ├── get-session.ts      # 서버 사이드 세션 헬퍼
│   │   │   └── require-role.ts     # API 인증/인가 헬퍼
│   │   ├── db/
│   │   │   └── prisma.ts           # Prisma 싱글톤 클라이언트
│   │   ├── query/
│   │   │   ├── keys.ts             # Query Key Factory
│   │   │   └── provider.tsx        # QueryProvider (TanStack Query)
│   │   ├── validations/
│   │   │   └── domain.ts           # Zod 검증 스키마 (도메인)
│   │   └── utils.ts                # cn() 유틸리티
│   ├── hooks/
│   │   └── use-mobile.ts           # 모바일 감지 훅 (shadcn sidebar용)
│   ├── proxy.ts                    # 라우트 보호 (Next.js 16)
│   ├── test/setup.ts               # Vitest 설정
│   └── types/auth.ts               # SessionUser 타입
├── .env.example
├── prisma.config.ts                # Prisma 7 설정
├── vitest.config.ts
└── package.json
```
