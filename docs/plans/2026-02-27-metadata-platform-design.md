# 메타데이터 관리 플랫폼 설계 문서

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create implementation plan from this design.

**Goal:** 공공기관, 금융분야, 민간 등 범용으로 사용할 수 있는 메타데이터 관리 웹 플랫폼 구축

**Architecture:** Next.js 16.1 풀스택 모노리스 구조. App Router 기반으로 프론트엔드와 API를 하나의 프로젝트에서 관리하며, Prisma + PostgreSQL로 데이터를 저장한다. MVP는 표준 용어/도메인/코드 관리 + 승인 워크플로우에 집중하고, 이후 검증 → 범정부 연계 → AI 순으로 확장한다.

**Tech Stack:** Next.js 16.1, TypeScript 5.9, PostgreSQL 18, Prisma 7, Better Auth, shadcn/ui, Tailwind CSS 4.2, TanStack Query v5, Vitest 4, Playwright

---

## 1. 프로젝트 개요

### 1.1 배경

공공기관과 금융분야에서는 데이터 표준화가 핵심 인프라다. 각 기관은 표준용어, 표준도메인, 표준코드를 정의하고 관리해야 하며, 이를 범정부 메타데이터 관리시스템과 연계해야 한다. 현재 이를 효율적으로 관리할 수 있는 범용 웹 플랫폼이 부족하다.

### 1.2 목적

- 상용 제품으로 개발
- 범용 (공공 + 금융 + 민간) 사용자 대상
- MVP → 검증 → 연계 → AI 순으로 단계적 확장

### 1.3 MVP 범위

- 표준 용어/도메인/코드 CRUD + 검색 + 페이징
- 승인 워크플로우 (등록 → 검토 → 승인/반려)
- RBAC(Role-based Access Control) 인증/권한 관리
- 관리자 페이지 (사용자/역할 관리)

---

## 2. 기술 스택

| 기술 | 버전 | 용도 |
| --- | --- | --- |
| Next.js | 16.1 | 풀스택 프레임워크 (App Router) |
| React | 19 | UI 라이브러리 |
| TypeScript | 5.9 | 타입 안전성 |
| Prisma | 7.x | ORM (PostgreSQL), ESM 전용, 드라이버 어댑터 방식 |
| PostgreSQL | 18 | 데이터베이스 (새 I/O 서브시스템, 최대 3배 성능 향상) |
| Better Auth | latest | 인증 + 세션 관리 (Auth.js v5 후속, Prisma 어댑터 지원) |
| shadcn/ui | latest | UI 컴포넌트 라이브러리 (통합 radix-ui 패키지) |
| Tailwind CSS | 4.2 | 스타일링 |
| TanStack Query | v5 | 서버 상태 관리 (캐싱, 페이징) |
| Turbopack | built-in | 개발 서버 번들러 (Next.js 16 내장) |
| Vitest | 4.x | 단위/통합 테스트 (Browser Mode 안정화) |
| Playwright | latest | E2E 테스트 |

---

## 3. 프로젝트 구조

``` markdown
metadata-platform/
├── src/
│   ├── app/                        # Next.js 16 App Router
│   │   ├── (auth)/                 # 인증 페이지 (로그인, 회원가입)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/            # 인증 후 메인 레이아웃 (사이드바 포함)
│   │   │   ├── standards/          # 표준 용어 관리
│   │   │   ├── domains/            # 표준 도메인 관리
│   │   │   ├── codes/              # 표준 코드 관리
│   │   │   ├── workflow/           # 승인 워크플로우
│   │   │   └── admin/              # 관리자 페이지
│   │   ├── api/                    # API Routes (REST)
│   │   │   ├── auth/
│   │   │   ├── standards/
│   │   │   ├── domains/
│   │   │   ├── codes/
│   │   │   └── workflow/
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   └── page.tsx                # 랜딩 페이지
│   ├── lib/                        # 비즈니스 로직
│   │   ├── auth/                   # 인증/세션/RBAC
│   │   ├── db/                     # Prisma 클라이언트 & 쿼리
│   │   └── workflow/               # 승인 상태 머신
│   ├── components/                 # UI 컴포넌트
│   │   ├── ui/                     # 기본 (Button, Input, Table, Dialog)
│   │   ├── layout/                 # 레이아웃 (Sidebar, Header, Breadcrumb)
│   │   └── domain/                 # 도메인 특화 (표준용어 테이블, 승인 패널)
│   └── types/                      # TypeScript 타입 정의
├── prisma/
│   ├── schema.prisma               # DB 스키마
│   ├── migrations/                 # 마이그레이션 히스토리
│   └── seed.ts                     # 초기 데이터 (기본 역할, 샘플 표준용어)
├── public/
├── .env.example                    # 환경변수 템플릿
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma.config.ts                # Prisma 7 설정 (DB 연결, 마이그레이션)
└── proxy.ts                        # 라우트 보호 프록시 (Next.js 16, Node.js 런타임)
```

---

## 4. 데이터베이스 스키마

### 4.1 사용자 & 권한 (RBAC)

User

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| email | String | 고유, 로그인 ID |
| password | String | 해시된 비밀번호 |
| name | String | 사용자명 |
| department | String? | 소속 부서 |
| status | Enum | ACTIVE / INACTIVE |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

Role

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| name | String | 역할명 (ADMIN, STANDARD_MANAGER, APPROVER, VIEWER) |
| description | String | 역할 설명 |
| permissions | JSON | 권한 목록 |

**UserRole** (N:M 관계)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| userId | UUID | FK → User |
| roleId | UUID | FK → Role |
| assignedAt | DateTime | 부여일시 |

### 4.2 표준 용어 (Standard Terms)

StandardTerm

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| termName | String | 표준 용어명 (한글) |
| termEnglishName | String | 표준 용어명 (영문) |
| termDescription | String | 용어 설명 |
| termAbbreviation | String? | 약어 |
| domainId | UUID | FK → StandardDomain |
| status | Enum | DRAFT / ACTIVE / DEPRECATED |
| version | Int | 버전 번호 |
| createdBy | UUID | FK → User (등록자) |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

### 4.3 표준 도메인 (Standard Domains)

StandardDomain

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| domainName | String | 도메인명 |
| domainDescription | String | 도메인 설명 |
| dataType | String | 데이터 타입 (VARCHAR, NUMBER 등) |
| length | Int? | 길이 |
| scale | Int? | 소수점 자리수 |
| allowedValues | String? | 허용 값 (정규식 또는 값 목록) |
| status | Enum | DRAFT / ACTIVE / DEPRECATED |
| createdBy | UUID | FK → User |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

### 4.4 표준 코드 (Standard Codes)

CodeGroup

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| groupName | String | 코드 그룹명 |
| groupEnglishName | String | 코드 그룹 영문명 |
| groupDescription | String | 그룹 설명 |
| status | Enum | DRAFT / ACTIVE / DEPRECATED |
| createdBy | UUID | FK → User |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

CodeItem

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| groupId | UUID | FK → CodeGroup |
| itemCode | String | 코드값 |
| itemName | String | 코드명 |
| itemDescription | String? | 코드 설명 |
| sortOrder | Int | 정렬 순서 |
| isActive | Boolean | 활성 여부 |
| createdAt | DateTime | 생성일시 |

### 4.5 승인 워크플로우

ApprovalRequest

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| targetType | Enum | TERM / DOMAIN / CODE_GROUP |
| targetId | UUID | 대상 데이터 ID |
| requestType | Enum | CREATE / UPDATE / DELETE |
| requesterId | UUID | FK → User (요청자) |
| approverId | UUID? | FK → User (승인자) |
| status | Enum | PENDING / REVIEWING / APPROVED / REJECTED |
| requestComment | String? | 요청 사유 |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

ApprovalHistory

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID | PK |
| requestId | UUID | FK → ApprovalRequest |
| action | Enum | SUBMITTED / APPROVED / REJECTED / CANCELLED |
| comment | String? | 코멘트 (반려 사유 등) |
| actorId | UUID | FK → User (행위자) |
| createdAt | DateTime | 행위 일시 |

워크플로우 상태 흐름:

``` markdown
등록 요청(PENDING) → 검토 중(REVIEWING) → 승인(APPROVED) → 표준 데이터 status → ACTIVE
                                        → 반려(REJECTED) → 담당자에게 반려 사유 표시
```

---

## 5. API 설계

### 5.1 표준 용어 API

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/standards` | 목록 (검색, 페이징, 필터) | 전체 |
| GET | `/api/standards/:id` | 상세 | 전체 |
| POST | `/api/standards` | 등록 요청 | STANDARD_MANAGER |
| PUT | `/api/standards/:id` | 수정 요청 | STANDARD_MANAGER |
| DELETE | `/api/standards/:id` | 삭제 요청 | STANDARD_MANAGER |

### 5.2 표준 도메인 API

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/domains` | 목록 | 전체 |
| GET | `/api/domains/:id` | 상세 | 전체 |
| POST | `/api/domains` | 등록 요청 | STANDARD_MANAGER |
| PUT | `/api/domains/:id` | 수정 요청 | STANDARD_MANAGER |
| DELETE | `/api/domains/:id` | 삭제 요청 | STANDARD_MANAGER |

### 5.3 표준 코드 API

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/codes` | 코드 그룹 목록 | 전체 |
| GET | `/api/codes/:id` | 코드 그룹 상세 (하위 코드 포함) | 전체 |
| POST | `/api/codes` | 코드 그룹 등록 요청 | STANDARD_MANAGER |
| PUT | `/api/codes/:id` | 코드 그룹 수정 요청 | STANDARD_MANAGER |
| DELETE | `/api/codes/:id` | 코드 그룹 삭제 요청 | STANDARD_MANAGER |

### 5.4 승인 워크플로우 API

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/workflow` | 승인 요청 목록 | STANDARD_MANAGER, APPROVER |
| GET | `/api/workflow/:id` | 승인 요청 상세 + 이력 | STANDARD_MANAGER, APPROVER |
| POST | `/api/workflow/:id/approve` | 승인 | APPROVER |
| POST | `/api/workflow/:id/reject` | 반려 (사유 필수) | APPROVER |

### 5.5 인증/사용자 API

> Better Auth는 `/api/auth/[...all]` 라우트를 통해 인증 엔드포인트를 자동 생성한다.

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/api/auth/sign-in/email` | 이메일 로그인 (Better Auth 내장) | 공개 |
| POST | `/api/auth/sign-up/email` | 이메일 회원가입 (Better Auth 내장) | 공개 |
| POST | `/api/auth/sign-out` | 로그아웃 (Better Auth 내장) | 인증됨 |
| GET | `/api/auth/get-session` | 세션 조회 (Better Auth 내장) | 인증됨 |
| GET | `/api/admin/users` | 사용자 목록 | ADMIN |
| PUT | `/api/admin/users/:id/role` | 역할 변경 | ADMIN |

### 5.6 API 공통 패턴

- 목록 조회: `?page=1&size=20&search=검색어&status=ACTIVE`
- 성공 응답: `{ data, pagination: { page, size, total } }`
- 에러 응답: `{ error: { code, message } }`

---

## 6. 페이지 & 사용자 흐름

### 6.1 페이지 구성

``` markdown
로그인 (/login)
회원가입 (/signup)
  │
  ▼ (인증 후)
대시보드 레이아웃 ── Sidebar + Header
  ├── 표준 용어 (/standards)
  │   ├── 목록 (테이블 + 검색 + 필터)
  │   ├── 상세 (/standards/:id)
  │   └── 등록·수정 폼 (/standards/new, /standards/:id/edit)
  ├── 표준 도메인 (/domains)
  │   ├── 목록
  │   ├── 상세
  │   └── 등록·수정 폼
  ├── 표준 코드 (/codes)
  │   ├── 목록 (코드 그룹)
  │   ├── 상세 (그룹 + 하위 코드 목록)
  │   └── 등록·수정 폼
  ├── 승인 관리 (/workflow)
  │   ├── 내 요청 목록
  │   └── 승인 대기 목록 (APPROVER만)
  └── 관리자 (/admin)         ← ADMIN만 접근
      └── 사용자·역할 관리
```

### 6.2 핵심 사용자 시나리오

표준 용어 등록 흐름:
``` markdown
표준담당자: 용어 등록 폼 작성 → [등록 요청]
  → ApprovalRequest 생성 (status: PENDING)
  → StandardTerm 생성 (status: DRAFT)

승인자: 승인 대기 목록에서 확인 → 내용 검토
  → [승인] → StandardTerm status → ACTIVE
  → [반려] → 사유 입력 → 담당자에게 반려 표시
```

---

## 7. 테스트 전략

| 레벨 | 도구 | 대상 | 목표 |
| --- | --- | --- | --- |
| 단위 테스트 | Vitest | 비즈니스 로직 (lib/), 유틸 함수 | 핵심 로직 검증 |
| 통합 테스트 | Vitest + Prisma (테스트 DB) | API Routes + DB 쿼리 | API 동작 검증 |
| E2E 테스트 | Playwright | 주요 사용자 시나리오 | 전체 흐름 검증 |

MVP 필수 테스트 시나리오:
- 표준 용어 CRUD (등록/조회/수정/삭제 요청)
- 승인 워크플로우 (등록 → 승인 → ACTIVE 전환)
- 승인 워크플로우 (등록 → 반려 → 사유 확인)
- RBAC 권한 검증 (VIEWER가 등록 시도 → 403)
- 로그인/로그아웃

---

## 8. 확장 로드맵

``` markdown
Phase 1 (MVP) ← 현재 범위
├── 표준 용어/도메인/코드 관리
├── 승인 워크플로우
├── RBAC 인증/권한
└── 검색 + 페이징

Phase 2: 표준 검증
├── 기관 데이터 업로드 (CSV/Excel)
├── 표준 대비 적합성 검증
├── 검증 결과 리포트
└── 불일치 항목 매핑 제안

Phase 3: 범정부 시스템 연계
├── 범정부 메타데이터 관리시스템 API 연동
├── 표준 데이터 동기화 (가져오기/내보내기)
└── 연계 이력 관리

Phase 4: AI 기반 확장
├── AI 표준용어 추천 (유사 용어 자동 매핑)
├── 자연어 검색 (의미 기반 표준 검색)
├── 자동 분류 (업로드된 데이터의 표준 자동 분류)
└── 데이터 품질 분석 리포트
```

---

## 설계 결정 근거

| 결정 | 이유 |
| --- | --- |
| Next.js 풀스택 모노리스 | MVP 속도 우선. 나중에 백엔드 분리 가능 |
| Prisma 7 ORM | 타입 안전 쿼리, ESM 네이티브, 드라이버 어댑터로 유연한 DB 연결 |
| PostgreSQL 18 | 새 I/O 서브시스템으로 최대 3배 성능 향상, 메이저 업그레이드 가속화 |
| Better Auth | Auth.js v5가 stable 미출시 상태에서 Better Auth로 합류. Prisma 어댑터 공식 지원, 활발한 유지보수 |
| proxy.ts (Next.js 16) | middleware.ts에서 이름 변경. Node.js 런타임으로 전환, CVE-2025-29927 보안 대응 |
| shadcn/ui | 커스터마이징 가능한 UI 컴포넌트, 통합 radix-ui 패키지 지원 |
| 다형적 승인 테이블 | 용어/도메인/코드에 대해 하나의 승인 시스템으로 처리 |
| RBAC (역할 기반 권한) | 공공/금융권 표준 권한 모델 |
| 새 리포지토리 | dodam은 문서 저장소로 유지, 플랫폼은 독립 프로젝트 |
