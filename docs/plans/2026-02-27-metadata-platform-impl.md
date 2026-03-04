# 메타데이터 관리 플랫폼 MVP 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 표준 용어/도메인/코드를 관리하고 승인 워크플로우를 지원하는 메타데이터 관리 웹 플랫폼 MVP 구축

**Architecture:** Next.js 16.1 풀스택 모노리스. App Router 기반 프론트엔드 + API Routes 백엔드, Prisma 7 ORM + PostgreSQL 18 데이터 레이어 (드라이버 어댑터 방식), Better Auth 인증 + RBAC 권한 관리. shadcn/ui + Tailwind CSS 4.2 UI 스타일링. proxy.ts로 라우트 보호 (Next.js 16).

**Tech Stack:** Next.js 16.1, TypeScript 5.9, PostgreSQL 18, Prisma 7, Better Auth, shadcn/ui, Tailwind CSS 4.2, TanStack Query v5, Vitest 4, Playwright

**설계 문서:** `docs/plans/2026-02-27-metadata-platform-design.md` 참조

---

## Task 1: 프로젝트 초기 설정

**Files:**
- Create: `metadata-platform/` (새 리포지토리 루트)
- Create: `metadata-platform/package.json`
- Create: `metadata-platform/tsconfig.json`
- Create: `metadata-platform/next.config.ts`
- Create: `metadata-platform/.env.example`
- Create: `metadata-platform/.gitignore`

**Step 1: Next.js 프로젝트 생성**

```bash
cd C:/Users/jhkim/Desktop
npx create-next-app@latest metadata-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

프롬프트 응답:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Turbopack: Yes
- Import alias: `@/*`

**Step 2: 핵심 의존성 설치**

```bash
cd C:/Users/jhkim/Desktop/metadata-platform
npm install prisma @prisma/client @prisma/adapter-pg pg
npm install better-auth
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zod react-hook-form @hookform/resolvers
npm install bcryptjs
npm install -D @types/bcryptjs @types/pg vitest@4 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

프롬프트 응답:
- Style: Default
- Base color: Slate
- CSS variables: Yes

shadcn/ui 기본 컴포넌트 설치:

```bash
npx shadcn@latest add button input label card table dialog dropdown-menu select badge separator toast tabs form textarea breadcrumb sidebar sheet avatar
```

**Step 4: 환경 변수 템플릿 생성**

`.env.example`:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/metadata_platform"

# Auth
AUTH_SECRET="generate-a-secret-here"
AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_NAME="메타데이터 관리 플랫폼"
```

`.env` (로컬 개발용, .gitignore에 포함):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/metadata_platform"
AUTH_SECRET="dev-secret-change-in-production"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="메타데이터 관리 플랫폼"
```

**Step 5: Vitest 설정**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

`package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "npx tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

**Step 6: 개발 서버 실행 확인**

Run: `npm run dev`
Expected: 브라우저에서 `http://localhost:3000`에 Next.js 기본 페이지 표시

**Step 7: 커밋**

```bash
git add -A
git commit -m "chore: initial project setup with Next.js 16.1, Tailwind CSS 4.2, shadcn/ui, Prisma 7, Better Auth"
```

---

## Task 2: Prisma 스키마 & 데이터베이스 설정

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db/prisma.ts`

**Step 1: PostgreSQL 데이터베이스 생성**

```bash
psql -U postgres -c "CREATE DATABASE metadata_platform;"
```

또는 Docker를 사용하는 경우:
```bash
docker run --name metadata-pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=metadata_platform -p 5432:5432 -d postgres:18
```

**Step 2: Prisma 초기화 및 스키마 작성**

```bash
npx prisma init
```

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ============================================
// 사용자 & 권한 (RBAC)
// ============================================

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum RoleName {
  ADMIN
  STANDARD_MANAGER
  APPROVER
  VIEWER
}

model User {
  id         String     @id @default(uuid())
  email      String     @unique
  password   String
  name       String
  department String?
  status     UserStatus @default(ACTIVE)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  roles             UserRole[]
  createdTerms      StandardTerm[]     @relation("TermCreator")
  createdDomains    StandardDomain[]   @relation("DomainCreator")
  createdCodeGroups CodeGroup[]        @relation("CodeGroupCreator")
  approvalRequests  ApprovalRequest[]  @relation("Requester")
  approvalAssigned  ApprovalRequest[]  @relation("Approver")
  approvalActions   ApprovalHistory[]

  @@map("users")
}

model Role {
  id          String   @id @default(uuid())
  name        RoleName @unique
  description String
  createdAt   DateTime @default(now())

  users UserRole[]

  @@map("roles")
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

// ============================================
// 표준 데이터 공통 상태
// ============================================

enum StandardStatus {
  DRAFT
  ACTIVE
  DEPRECATED
}

// ============================================
// 표준 도메인
// ============================================

model StandardDomain {
  id                String         @id @default(uuid())
  domainName        String         @unique
  domainDescription String
  dataType          String
  length            Int?
  scale             Int?
  allowedValues     String?
  status            StandardStatus @default(DRAFT)
  createdBy         String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  creator User           @relation("DomainCreator", fields: [createdBy], references: [id])
  terms   StandardTerm[]

  @@map("standard_domains")
}

// ============================================
// 표준 용어
// ============================================

model StandardTerm {
  id               String         @id @default(uuid())
  termName         String
  termEnglishName  String
  termDescription  String
  termAbbreviation String?
  domainId         String
  status           StandardStatus @default(DRAFT)
  version          Int            @default(1)
  createdBy        String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  domain  StandardDomain @relation(fields: [domainId], references: [id])
  creator User           @relation("TermCreator", fields: [createdBy], references: [id])

  @@unique([termName, version])
  @@map("standard_terms")
}

// ============================================
// 표준 코드
// ============================================

model CodeGroup {
  id               String         @id @default(uuid())
  groupName        String         @unique
  groupEnglishName String
  groupDescription String
  status           StandardStatus @default(DRAFT)
  createdBy        String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  creator User       @relation("CodeGroupCreator", fields: [createdBy], references: [id])
  items   CodeItem[]

  @@map("code_groups")
}

model CodeItem {
  id              String   @id @default(uuid())
  groupId         String
  itemCode        String
  itemName        String
  itemDescription String?
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  group CodeGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([groupId, itemCode])
  @@map("code_items")
}

// ============================================
// 승인 워크플로우
// ============================================

enum TargetType {
  TERM
  DOMAIN
  CODE_GROUP
}

enum RequestType {
  CREATE
  UPDATE
  DELETE
}

enum ApprovalStatus {
  PENDING
  REVIEWING
  APPROVED
  REJECTED
}

enum ApprovalAction {
  SUBMITTED
  APPROVED
  REJECTED
  CANCELLED
}

model ApprovalRequest {
  id             String         @id @default(uuid())
  targetType     TargetType
  targetId       String
  requestType    RequestType
  requesterId    String
  approverId     String?
  status         ApprovalStatus @default(PENDING)
  requestComment String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  requester User              @relation("Requester", fields: [requesterId], references: [id])
  approver  User?             @relation("Approver", fields: [approverId], references: [id])
  history   ApprovalHistory[]

  @@map("approval_requests")
}

model ApprovalHistory {
  id        String         @id @default(uuid())
  requestId String
  action    ApprovalAction
  comment   String?
  actorId   String
  createdAt DateTime       @default(now())

  request ApprovalRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  actor   User            @relation(fields: [actorId], references: [id])

  @@map("approval_history")
}
```

**Step 3: Prisma 클라이언트 싱글톤 생성**

`src/lib/db/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: 마이그레이션 실행**

```bash
npx prisma migrate dev --name init
```

Expected: `migrations/` 폴더에 마이그레이션 파일 생성, DB 테이블 생성

**Step 5: 시드 데이터 작성**

`prisma/seed.ts`:
```typescript
import { PrismaClient, RoleName } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 역할 생성
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        description: '시스템 관리자 - 전체 권한',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.STANDARD_MANAGER },
      update: {},
      create: {
        name: RoleName.STANDARD_MANAGER,
        description: '표준 담당자 - 표준 데이터 등록/수정',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.APPROVER },
      update: {},
      create: {
        name: RoleName.APPROVER,
        description: '승인자 - 표준 데이터 승인/반려',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.VIEWER },
      update: {},
      create: {
        name: RoleName.VIEWER,
        description: '조회자 - 읽기 전용',
      },
    }),
  ])

  // 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin1234', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '시스템 관리자',
      department: '정보기술부',
      status: 'ACTIVE',
    },
  })

  // 관리자 역할 부여
  const adminRole = roles.find((r) => r.name === RoleName.ADMIN)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  })

  // 샘플 표준 도메인 생성
  const domain = await prisma.standardDomain.upsert({
    where: { domainName: '한글명' },
    update: {},
    create: {
      domainName: '한글명',
      domainDescription: '한글로 된 이름을 저장하는 도메인',
      dataType: 'VARCHAR',
      length: 100,
      status: 'ACTIVE',
      createdBy: admin.id,
    },
  })

  console.log('Seed completed:', { roles: roles.length, admin: admin.email, domain: domain.domainName })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

**Step 6: 시드 실행**

```bash
npx tsx prisma/seed.ts
```

Expected: `Seed completed: { roles: 4, admin: 'admin@example.com', domain: '한글명' }`

**Step 7: Prisma Studio로 확인**

```bash
npx prisma studio
```

Expected: 브라우저에서 DB 테이블과 시드 데이터 확인 가능

**Step 8: 커밋**

```bash
git add -A
git commit -m "feat: add Prisma 7 schema with User, Role, StandardTerm, StandardDomain, CodeGroup, ApprovalRequest models and seed data"
```

---

## Task 3: 인증 시스템 (Better Auth)

**Files:**
- Create: `src/lib/auth/index.ts` (Better Auth 서버 설정)
- Create: `src/lib/auth/client.ts` (Better Auth 클라이언트)
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/proxy.ts` (라우트 보호, Next.js 16)
- Create: `src/lib/auth/actions.ts` (서버 액션: 로그인, 회원가입)
- Create: `src/types/auth.ts`

**Step 1: Auth 타입 정의**

`src/types/auth.ts`:
```typescript
import { RoleName } from '@prisma/client'

export type SessionUser = {
  id: string
  email: string
  name: string
  roles: RoleName[]
}
```

**Step 2: Better Auth 서버 설정**

`src/lib/auth/index.ts`:
```typescript
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/db/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    strategy: 'jwt',
  },
  user: {
    additionalFields: {
      department: { type: 'string', required: false },
    },
  },
})
```

**Step 3: Better Auth 클라이언트**

`src/lib/auth/client.ts`:
```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})
```

**Step 4: Auth API 라우트**

`src/app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

**Step 5: 라우트 보호 프록시 (Next.js 16)**

`src/proxy.ts`:
```typescript
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/standards', '/domains', '/codes', '/workflow', '/admin']
const authPaths = ['/login', '/signup']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth.api.getSession({ headers: request.headers })
  const isLoggedIn = !!session?.user

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isAuthPage = authPaths.some((path) => pathname === path)
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/standards', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 6: 서버 액션 (로그인/회원가입)**

> Better Auth는 클라이언트 측에서 `authClient.signIn.email()`, `authClient.signUp.email()`을 직접 호출할 수 있으므로, 서버 액션은 RBAC 역할 부여 등 추가 로직이 필요한 경우에만 사용한다.

`src/lib/auth/actions.ts`:
```typescript
'use server'

import { prisma } from '@/lib/db/prisma'
import { RoleName } from '@prisma/client'

// 회원가입 후 기본 역할(VIEWER) 부여를 위한 서버 액션
export async function assignDefaultRole(userId: string) {
  const viewerRole = await prisma.role.findUnique({
    where: { name: RoleName.VIEWER },
  })

  if (viewerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: viewerRole.id } },
      update: {},
      create: { userId, roleId: viewerRole.id },
    })
  }
}

// 사용자 역할 조회
export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  })
  return userRoles.map((ur) => ur.role.name)
}
```

**Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add Better Auth authentication with Prisma adapter, proxy.ts route protection, and RBAC actions"
```

---

## Task 4: 로그인/회원가입 UI

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`

**Step 1: 인증 레이아웃**

`src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

**Step 2: 로그인 페이지**

`src/app/(auth)/login/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const { error } = await authClient.signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setIsPending(false)
    } else {
      router.push('/standards')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>메타데이터 관리 플랫폼에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
          <p className="text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: 회원가입 페이지**

`src/app/(auth)/signup/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'
import { assignDefaultRole } from '@/lib/auth/actions'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const { data, error } = await authClient.signUp.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    })

    if (error) {
      setError(error.message || '회원가입에 실패했습니다')
      setIsPending(false)
      return
    }

    // 기본 역할 부여 (VIEWER)
    if (data?.user?.id) {
      await assignDefaultRole(data.user.id)
    }

    router.push('/standards')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>새 계정을 만들어 시작하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" placeholder="홍길동" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" placeholder="8자 이상" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">소속 부서 (선택)</Label>
            <Input id="department" name="department" placeholder="정보기술부" />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '가입 중...' : '회원가입'}
          </Button>
          <p className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 4: 확인**

Run: `npm run dev`
- `http://localhost:3000/login` → 로그인 폼 표시
- `http://localhost:3000/signup` → 회원가입 폼 표시
- 회원가입 후 자동 로그인 → `/standards`로 리다이렉트 (아직 404)

**Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add login and signup pages with server actions"
```

---

## Task 5: 대시보드 레이아웃 (Sidebar + Header)

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-header.tsx`
- Create: `src/components/layout/user-nav.tsx`
- Create: `src/lib/auth/get-session.ts`

**Step 1: 세션 헬퍼**

`src/lib/auth/get-session.ts`:
```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SessionUser } from '@/types/auth'
import { RoleName } from '@prisma/client'
import { getUserRoles } from './actions'

export async function getSession(): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const roles = await getUserRoles(session.user.id)
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles,
  }
}

export function hasRole(user: SessionUser, role: RoleName): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: SessionUser, roles: RoleName[]): boolean {
  return roles.some((role) => user.roles.includes(role))
}
```

**Step 2: 사이드바**

`src/components/layout/app-sidebar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { BookOpen, Layers, Code, CheckSquare, Settings } from 'lucide-react'

const menuItems = [
  { title: '표준 용어', href: '/standards', icon: BookOpen },
  { title: '표준 도메인', href: '/domains', icon: Layers },
  { title: '표준 코드', href: '/codes', icon: Code },
  { title: '승인 관리', href: '/workflow', icon: CheckSquare },
]

const adminItems = [
  { title: '사용자 관리', href: '/admin/users', icon: Settings },
]

interface AppSidebarProps {
  userRoles: string[]
}

export function AppSidebar({ userRoles }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRoles.includes('ADMIN')

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메타데이터 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>관리자</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
```

**Step 3: 헤더 + 사용자 네비게이션**

`src/components/layout/user-nav.tsx`:
```typescript
'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

interface UserNavProps {
  userName: string
  userEmail: string
}

export function UserNav({ userName, userEmail }: UserNavProps) {
  const router = useRouter()
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut()
            router.push('/login')
          }}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

`src/components/layout/app-header.tsx`:
```typescript
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserNav } from './user-nav'

interface AppHeaderProps {
  userName: string
  userEmail: string
}

export function AppHeader({ userName, userEmail }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-sm font-semibold">메타데이터 관리 플랫폼</h1>
      </div>
      <UserNav userName={userName} userEmail={userEmail} />
    </header>
  )
}
```

**Step 4: 대시보드 레이아웃**

`src/app/(dashboard)/layout.tsx`:
```typescript
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { getSession } from '@/lib/auth/get-session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRoles={user.roles} />
        <div className="flex flex-1 flex-col">
          <AppHeader userName={user.name} userEmail={user.email} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
```

**Step 5: 확인**

Run: `npm run dev`
- 로그인 후 사이드바와 헤더가 표시되는지 확인
- 사이드바에 메뉴 항목 (표준 용어, 도메인, 코드, 승인 관리) 표시
- 우측 상단 아바타 클릭 시 로그아웃 드롭다운 표시

**Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add dashboard layout with sidebar navigation and user menu"
```

---

## Task 6: 표준 도메인 CRUD (API + UI)

> 표준 용어가 도메인에 의존하므로, 도메인을 먼저 구현한다.

**Files:**
- Create: `src/app/api/domains/route.ts` (목록, 생성)
- Create: `src/app/api/domains/[id]/route.ts` (상세, 수정, 삭제)
- Create: `src/lib/validations/domain.ts` (Zod 스키마)
- Create: `src/app/(dashboard)/domains/page.tsx` (목록)
- Create: `src/app/(dashboard)/domains/new/page.tsx` (등록 폼)
- Create: `src/app/(dashboard)/domains/[id]/page.tsx` (상세)
- Create: `src/app/(dashboard)/domains/[id]/edit/page.tsx` (수정 폼)
- Create: `src/components/domain/domain-form.tsx`
- Create: `src/components/domain/domain-table.tsx`
- Test: `src/__tests__/api/domains.test.ts`

**Step 1: Zod 유효성 검증 스키마**

`src/lib/validations/domain.ts`:
```typescript
import { z } from 'zod'

export const domainCreateSchema = z.object({
  domainName: z.string().min(1, '도메인명을 입력하세요'),
  domainDescription: z.string().min(1, '도메인 설명을 입력하세요'),
  dataType: z.string().min(1, '데이터 타입을 선택하세요'),
  length: z.number().int().positive().optional().nullable(),
  scale: z.number().int().min(0).optional().nullable(),
  allowedValues: z.string().optional().nullable(),
})

export const domainUpdateSchema = domainCreateSchema.partial()

export type DomainCreateInput = z.infer<typeof domainCreateSchema>
export type DomainUpdateInput = z.infer<typeof domainUpdateSchema>
```

**Step 2: API Routes**

`src/app/api/domains/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { domainCreateSchema } from '@/lib/validations/domain'

// GET /api/domains - 목록 조회
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const size = parseInt(searchParams.get('size') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || undefined

  const where = {
    ...(search && {
      OR: [
        { domainName: { contains: search, mode: 'insensitive' as const } },
        { domainDescription: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'DEPRECATED' }),
  }

  const [data, total] = await Promise.all([
    prisma.standardDomain.findMany({
      where,
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.standardDomain.count({ where }),
  ])

  return NextResponse.json({
    data,
    pagination: { page, size, total },
  })
}

// POST /api/domains - 등록
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 })
  }

  const { getUserRoles } = await import('@/lib/auth/actions')
  const roles = await getUserRoles(session.user.id)
  if (!roles.includes('ADMIN') && !roles.includes('STANDARD_MANAGER')) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '표준 담당자 이상의 권한이 필요합니다' } }, { status: 403 })
  }

  const body = await request.json()
  const parsed = domainCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, { status: 400 })
  }

  const existing = await prisma.standardDomain.findUnique({
    where: { domainName: parsed.data.domainName },
  })

  if (existing) {
    return NextResponse.json({ error: { code: 'DUPLICATE', message: '이미 존재하는 도메인명입니다' } }, { status: 409 })
  }

  const domain = await prisma.standardDomain.create({
    data: {
      ...parsed.data,
      createdBy: session.user.id!,
    },
  })

  return NextResponse.json({ data: domain }, { status: 201 })
}
```

`src/app/api/domains/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { domainUpdateSchema } from '@/lib/validations/domain'

// GET /api/domains/:id - 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 })
  }

  const { id } = await params

  const domain = await prisma.standardDomain.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      terms: { select: { id: true, termName: true, status: true } },
    },
  })

  if (!domain) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: '도메인을 찾을 수 없습니다' } }, { status: 404 })
  }

  return NextResponse.json({ data: domain })
}

// PUT /api/domains/:id - 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 })
  }

  const { getUserRoles } = await import('@/lib/auth/actions')
  const roles = await getUserRoles(session.user.id)
  if (!roles.includes('ADMIN') && !roles.includes('STANDARD_MANAGER')) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '표준 담당자 이상의 권한이 필요합니다' } }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = domainUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, { status: 400 })
  }

  const domain = await prisma.standardDomain.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ data: domain })
}

// DELETE /api/domains/:id - 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 })
  }

  const { getUserRoles } = await import('@/lib/auth/actions')
  const roles = await getUserRoles(session.user.id)
  if (!roles.includes('ADMIN') && !roles.includes('STANDARD_MANAGER')) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '표준 담당자 이상의 권한이 필요합니다' } }, { status: 403 })
  }

  const { id } = await params

  // 연결된 용어가 있는지 확인
  const termCount = await prisma.standardTerm.count({ where: { domainId: id } })
  if (termCount > 0) {
    return NextResponse.json(
      { error: { code: 'HAS_DEPENDENCIES', message: `이 도메인에 연결된 표준 용어가 ${termCount}개 있습니다. 먼저 용어를 제거해주세요.` } },
      { status: 409 },
    )
  }

  await prisma.standardDomain.delete({ where: { id } })

  return NextResponse.json({ data: { success: true } })
}
```

**Step 3: UI 컴포넌트 (테이블, 폼) 및 페이지**

> UI 컴포넌트와 페이지는 표준 패턴을 따르므로, 구현 시 서브에이전트가 shadcn/ui의 Table, Form, Input, Select, Button 컴포넌트를 활용하여 작성한다.

도메인 목록 페이지 핵심 구조:
- 검색바 + 상태 필터 + 등록 버튼
- 테이블: 도메인명, 데이터타입, 길이, 상태, 등록자, 등록일
- 페이지네이션
- 행 클릭 시 상세 페이지 이동

도메인 등록/수정 폼 핵심 구조:
- 도메인명, 설명, 데이터타입(선택), 길이, 소수점, 허용값
- 유효성 검증 (react-hook-form + zod)
- 등록/취소 버튼

**Step 4: 확인**

- `http://localhost:3000/domains` → 도메인 목록 표시 (시드 데이터 포함)
- 등록 → 새 도메인 생성 (status: DRAFT)
- 수정/삭제 동작 확인

**Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add standard domain CRUD - API routes, list/detail/form pages"
```

---

## Task 7: 표준 용어 CRUD (API + UI)

**Files:**
- Create: `src/app/api/standards/route.ts`
- Create: `src/app/api/standards/[id]/route.ts`
- Create: `src/lib/validations/standard.ts`
- Create: `src/app/(dashboard)/standards/page.tsx`
- Create: `src/app/(dashboard)/standards/new/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/edit/page.tsx`

**구현 패턴:** Task 6(표준 도메인)과 동일한 패턴. 차이점:
- 도메인 선택 드롭다운 추가 (등록/수정 폼에서 도메인 목록을 조회하여 선택)
- `termName`, `termEnglishName`, `termDescription`, `termAbbreviation` 필드
- 용어명 + 버전 unique 제약 조건

`src/lib/validations/standard.ts`:
```typescript
import { z } from 'zod'

export const termCreateSchema = z.object({
  termName: z.string().min(1, '용어명을 입력하세요'),
  termEnglishName: z.string().min(1, '영문 용어명을 입력하세요'),
  termDescription: z.string().min(1, '용어 설명을 입력하세요'),
  termAbbreviation: z.string().optional().nullable(),
  domainId: z.string().uuid('도메인을 선택하세요'),
})

export const termUpdateSchema = termCreateSchema.partial()

export type TermCreateInput = z.infer<typeof termCreateSchema>
export type TermUpdateInput = z.infer<typeof termUpdateSchema>
```

API Routes, UI 페이지는 Task 6의 패턴을 따라 구현한다.

**커밋:**

```bash
git add -A
git commit -m "feat: add standard term CRUD - API routes, list/detail/form pages with domain selection"
```

---

## Task 8: 표준 코드 CRUD (API + UI)

**Files:**
- Create: `src/app/api/codes/route.ts`
- Create: `src/app/api/codes/[id]/route.ts`
- Create: `src/lib/validations/code.ts`
- Create: `src/app/(dashboard)/codes/page.tsx`
- Create: `src/app/(dashboard)/codes/new/page.tsx`
- Create: `src/app/(dashboard)/codes/[id]/page.tsx`
- Create: `src/app/(dashboard)/codes/[id]/edit/page.tsx`

**구현 패턴:** Task 6과 동일한 CRUD 패턴. 차이점:
- CodeGroup + CodeItem 2단 구조
- 코드 그룹 상세 페이지에서 하위 코드 아이템을 인라인 편집 (추가/삭제/순서 변경)
- 코드 아이템: `itemCode`, `itemName`, `itemDescription`, `sortOrder`, `isActive`

`src/lib/validations/code.ts`:
```typescript
import { z } from 'zod'

export const codeItemSchema = z.object({
  itemCode: z.string().min(1, '코드값을 입력하세요'),
  itemName: z.string().min(1, '코드명을 입력하세요'),
  itemDescription: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const codeGroupCreateSchema = z.object({
  groupName: z.string().min(1, '코드 그룹명을 입력하세요'),
  groupEnglishName: z.string().min(1, '영문 그룹명을 입력하세요'),
  groupDescription: z.string().min(1, '그룹 설명을 입력하세요'),
  items: z.array(codeItemSchema).optional().default([]),
})

export const codeGroupUpdateSchema = codeGroupCreateSchema.partial()

export type CodeGroupCreateInput = z.infer<typeof codeGroupCreateSchema>
export type CodeGroupUpdateInput = z.infer<typeof codeGroupUpdateSchema>
```

API Routes, UI 페이지는 Task 6의 패턴을 따라 구현한다. 코드 그룹 상세 페이지에서 코드 아이템을 관리하는 인라인 테이블 포함.

**커밋:**

```bash
git add -A
git commit -m "feat: add code group/item CRUD - API routes, list/detail/form pages with inline item editing"
```

---

## Task 9: 승인 워크플로우 (API + UI)

**Files:**
- Create: `src/app/api/workflow/route.ts`
- Create: `src/app/api/workflow/[id]/route.ts`
- Create: `src/app/api/workflow/[id]/approve/route.ts`
- Create: `src/app/api/workflow/[id]/reject/route.ts`
- Create: `src/lib/workflow/approval-service.ts`
- Create: `src/app/(dashboard)/workflow/page.tsx`
- Create: `src/app/(dashboard)/workflow/[id]/page.tsx`

**Step 1: 승인 서비스 로직**

`src/lib/workflow/approval-service.ts`:
```typescript
import { prisma } from '@/lib/db/prisma'
import { TargetType, RequestType, ApprovalStatus, ApprovalAction, StandardStatus } from '@prisma/client'

export async function createApprovalRequest(params: {
  targetType: TargetType
  targetId: string
  requestType: RequestType
  requesterId: string
  comment?: string
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.create({
      data: {
        targetType: params.targetType,
        targetId: params.targetId,
        requestType: params.requestType,
        requesterId: params.requesterId,
        requestComment: params.comment,
        status: ApprovalStatus.PENDING,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId: request.id,
        action: ApprovalAction.SUBMITTED,
        actorId: params.requesterId,
        comment: params.comment,
      },
    })

    return request
  })
}

export async function approveRequest(requestId: string, approverId: string, comment?: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.APPROVED,
        approverId,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId: request.id,
        action: ApprovalAction.APPROVED,
        actorId: approverId,
        comment,
      },
    })

    // 대상 데이터를 ACTIVE로 변경
    await activateTarget(tx, request.targetType, request.targetId)

    return request
  })
}

export async function rejectRequest(requestId: string, approverId: string, comment: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.REJECTED,
        approverId,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId: request.id,
        action: ApprovalAction.REJECTED,
        actorId: approverId,
        comment,
      },
    })

    return request
  })
}

async function activateTarget(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], targetType: TargetType, targetId: string) {
  const data = { status: StandardStatus.ACTIVE }

  switch (targetType) {
    case TargetType.TERM:
      await tx.standardTerm.update({ where: { id: targetId }, data })
      break
    case TargetType.DOMAIN:
      await tx.standardDomain.update({ where: { id: targetId }, data })
      break
    case TargetType.CODE_GROUP:
      await tx.codeGroup.update({ where: { id: targetId }, data })
      break
  }
}
```

**Step 2: API Routes**

승인 워크플로우 API는 `approval-service.ts`를 호출하여 처리한다.

- `GET /api/workflow` — 내 요청 또는 승인 대기 목록 (역할에 따라 필터)
- `GET /api/workflow/:id` — 요청 상세 + 이력
- `POST /api/workflow/:id/approve` — 승인 (APPROVER 권한 필요)
- `POST /api/workflow/:id/reject` — 반려 (APPROVER 권한 필요, `comment` 필수)

**Step 3: Task 6~8의 등록 API에 승인 워크플로우 연결**

표준 데이터 등록 시 `createApprovalRequest()`를 호출하여 승인 요청을 자동 생성한다.

예시 (표준 도메인 등록 API 수정):
```typescript
// POST /api/domains - 기존 코드에 추가
const domain = await prisma.standardDomain.create({
  data: { ...parsed.data, createdBy: session.user.id!, status: 'DRAFT' },
})

// 승인 요청 생성
await createApprovalRequest({
  targetType: 'DOMAIN',
  targetId: domain.id,
  requestType: 'CREATE',
  requesterId: session.user.id!,
})
```

**Step 4: 승인 관리 UI**

승인 관리 페이지:
- 탭 2개: "내 요청" / "승인 대기" (APPROVER만)
- 요청 목록: 대상 타입, 대상명, 요청 유형, 요청자, 상태, 요청일
- 상세 페이지: 요청 정보 + 대상 데이터 미리보기 + 승인 이력 + 승인/반려 버튼

**Step 5: 확인**

- 표준 담당자로 도메인 등록 → 승인 요청 자동 생성
- 승인자로 로그인 → 승인 대기 목록에 표시
- 승인 → 도메인 status가 ACTIVE로 변경
- 반려 → 사유 입력 필수, 도메인 status 유지 (DRAFT)

**Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add approval workflow - service layer, API routes, workflow management pages, integration with standard data registration"
```

---

## Task 10: 관리자 페이지 (사용자/역할 관리)

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/role/route.ts`
- Create: `src/app/(dashboard)/admin/users/page.tsx`
- Create: `src/lib/auth/require-role.ts`

**Step 1: 역할 검증 헬퍼**

`src/lib/auth/require-role.ts`:
```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { RoleName } from '@prisma/client'

export async function requireRole(requiredRoles: RoleName[]) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 }) }
  }

  const { getUserRoles } = await import('@/lib/auth/actions')
  const roles = await getUserRoles(session.user.id)
  const hasAccess = requiredRoles.some((role) => roles.includes(role))

  if (!hasAccess) {
    return { error: NextResponse.json({ error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 }) }
  }

  return { session }
}
```

**Step 2: 관리자 API**

- `GET /api/admin/users` — 사용자 목록 (이름, 이메일, 부서, 역할, 상태)
- `PUT /api/admin/users/:id/role` — 역할 변경 (역할 추가/제거)

ADMIN 역할만 접근 가능.

**Step 3: 관리자 UI**

사용자 관리 페이지:
- 사용자 테이블: 이름, 이메일, 부서, 역할 뱃지, 상태
- 역할 변경: 드롭다운 체크박스로 역할 토글
- ADMIN 역할이 아닌 경우 /admin 접근 시 403 또는 리다이렉트

**Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add admin page - user list with role management"
```

---

## Task 11: TanStack Query 설정 & 클라이언트 상태 관리

**Files:**
- Create: `src/lib/query/provider.tsx`
- Create: `src/lib/query/keys.ts`
- Create: `src/lib/api/client.ts`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: API 클라이언트**

`src/lib/api/client.ts`:
```typescript
type ApiResponse<T> = {
  data: T
  pagination?: { page: number; size: number; total: number }
}

type ApiError = {
  error: { code: string; message: string }
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error.message)
  }

  return response.json()
}
```

**Step 2: Query Keys 정의**

`src/lib/query/keys.ts`:
```typescript
export const queryKeys = {
  domains: {
    all: ['domains'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.domains.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.domains.all, 'detail', id] as const,
  },
  standards: {
    all: ['standards'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.standards.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.standards.all, 'detail', id] as const,
  },
  codes: {
    all: ['codes'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.codes.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.codes.all, 'detail', id] as const,
  },
  workflow: {
    all: ['workflow'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.workflow.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.workflow.all, 'detail', id] as const,
  },
}
```

**Step 3: Query Provider**

`src/lib/query/provider.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

대시보드 레이아웃에 `<QueryProvider>`로 감싼다.

**Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add TanStack Query provider, API client, and query key factory"
```

---

## Task 12: E2E 테스트 (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Create: `e2e/standards.spec.ts`

**Step 1: Playwright 설치 및 설정**

```bash
npm install -D @playwright/test
npx playwright install
```

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 2: 핵심 E2E 테스트 작성**

- 로그인/로그아웃 흐름
- 회원가입 흐름
- 표준 도메인 등록 → 목록 표시 확인
- 승인 워크플로우 (등록 → 승인 → ACTIVE)
- 권한 없는 페이지 접근 시 리다이렉트

**Step 3: 테스트 실행**

```bash
npx playwright test
```

**Step 4: 커밋**

```bash
git add -A
git commit -m "test: add Playwright E2E tests for auth flow, domain CRUD, and approval workflow"
```

---

## 완료 후 확인 사항

- [ ] 모든 페이지 정상 렌더링
- [ ] 로그인/회원가입/로그아웃 동작
- [ ] RBAC 권한 검증 (VIEWER → 등록 불가, APPROVER → 승인 가능)
- [ ] 표준 용어/도메인/코드 CRUD 동작
- [ ] 승인 워크플로우 전체 흐름 (등록 → 승인/반려)
- [ ] 관리자 페이지에서 역할 변경
- [ ] E2E 테스트 통과
- [ ] `npm run build` 성공
