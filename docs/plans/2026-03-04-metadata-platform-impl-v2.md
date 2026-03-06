# 메타데이터 관리 플랫폼 MVP 구현 계획 (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **워크플로우 규칙:**
>
> 1. **매 Task 시작 전** — 반드시 `superpowers:brainstorming` 스킬을 먼저 실행하여 구현 방향을 점검한다.
> 2. **매 Task 완료 후** — `docs/releases/` 디렉토리에 릴리스 노트를 작성한다. 기존 릴리스 노트가 있으면 해당 파일에 신규 Task 내용을 추가하고, 없으면 새로 생성한다. YAML frontmatter의 `scope` 필드를 업데이트할 것.

**Goal:** 표준 용어/도메인/코드를 관리하고 승인 워크플로우를 지원하는 메타데이터 관리 웹 플랫폼 MVP 구축

**Architecture:** Next.js 16.1 풀스택 모노리스. App Router 기반 프론트엔드 + API Routes 백엔드, Prisma 7 ORM + PostgreSQL 18 데이터 레이어 (드라이버 어댑터 방식), Better Auth 인증 + RBAC 권한 관리. shadcn/ui + Tailwind CSS 4.2 UI 스타일링. proxy.ts로 라우트 보호 (Next.js 16).

**Tech Stack:** Next.js 16.1, TypeScript 5.9, PostgreSQL 18, Prisma 7, Better Auth, shadcn/ui, Tailwind CSS 4.2, TanStack Query v5, Vitest 4, Playwright

**설계 문서:** `docs/plans/2026-02-27-metadata-platform-design.md` 참조

변경 이력:

- v1 (2026-02-27): 초기 구현 계획 (Prisma 6, Auth.js v5)
- v2 (2026-03-04): 기술 스택 최신화 (Prisma 7, Better Auth, proxy.ts, PostgreSQL 18, Vitest 4)

---

## Task 1: 프로젝트 초기 설정

Files:

- Create: `metadata-platform/package.json`
- Create: `metadata-platform/tsconfig.json`
- Create: `metadata-platform/next.config.ts`
- Create: `metadata-platform/.env.example`
- Create: `metadata-platform/.env`
- Create: `metadata-platform/.gitignore`
- Create: `metadata-platform/vitest.config.ts`
- Create: `metadata-platform/src/test/setup.ts`

Step 1: Next.js 프로젝트 생성

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

Step 2: 핵심 의존성 설치

```bash
cd C:/Users/jhkim/Desktop/metadata-platform
npm install prisma @prisma/client @prisma/adapter-pg pg
npm install better-auth
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zod react-hook-form @hookform/resolvers
npm install bcryptjs lucide-react
npm install -D @types/bcryptjs @types/pg vitest@4 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Step 3: shadcn/ui 초기화

```bash
npx shadcn@latest init
```

프롬프트 응답:

- Style: Default
- Base color: Slate
- CSS variables: Yes

shadcn/ui 컴포넌트 설치:

```bash
npx shadcn@latest add button input label card table dialog dropdown-menu select badge separator toast tabs form textarea breadcrumb sidebar sheet avatar alert
```

Step 4: 환경 변수 템플릿 생성

`.env.example`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/metadata_platform"

# Auth
BETTER_AUTH_SECRET="generate-a-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="메타데이터 관리 플랫폼"
```

`.env` (로컬 개발용, .gitignore에 포함):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/metadata_platform"
BETTER_AUTH_SECRET="dev-secret-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="메타데이터 관리 플랫폼"
```

Step 5: Vitest 설정

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

Step 6: package.json 스크립트 추가

`package.json`에 아래 스크립트 추가/수정:

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

Step 7: 개발 서버 실행 확인

Run: `npm run dev`
Expected: 브라우저에서 `http://localhost:3000`에 Next.js 기본 페이지 표시

Step 8: Git 초기화 및 커밋

```bash
cd C:/Users/jhkim/Desktop/metadata-platform
git init
git add -A
git commit -m "chore: initial project setup with Next.js 16.1, Tailwind CSS 4.2, shadcn/ui, Vitest 4"
```

---

## Task 2: Prisma 스키마 & 데이터베이스 설정

Files:

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db/prisma.ts`

Step 1: PostgreSQL 데이터베이스 생성

Docker를 사용하는 경우:

```bash
docker run --name metadata-pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=metadata_platform -p 5432:5432 -d postgres:18
```

로컬 PostgreSQL을 사용하는 경우:

```bash
psql -U postgres -c "CREATE DATABASE metadata_platform;"
```

Step 2: Prisma 초기화 및 스키마 작성

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

  // Better Auth 세션 관리
  sessions          Session[]
  accounts          Account[]

  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                    String    @id @default(uuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

model Verification {
  id         String   @id @default(uuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
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

> **Note:** Better Auth는 Session, Account, Verification 모델을 필요로 한다. 위 스키마에 포함됨.

Step 3: Prisma 클라이언트 싱글톤 생성

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

Step 4: 마이그레이션 실행

```bash
npx prisma migrate dev --name init
```

Expected: `migrations/` 폴더에 마이그레이션 파일 생성, DB 테이블 생성

Step 5: 시드 데이터 작성

`prisma/seed.ts`:

```typescript
import { PrismaClient, RoleName } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 역할 생성
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: '시스템 관리자 - 전체 권한' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.STANDARD_MANAGER },
      update: {},
      create: { name: RoleName.STANDARD_MANAGER, description: '표준 담당자 - 표준 데이터 등록/수정' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.APPROVER },
      update: {},
      create: { name: RoleName.APPROVER, description: '승인자 - 표준 데이터 승인/반려' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.VIEWER },
      update: {},
      create: { name: RoleName.VIEWER, description: '조회자 - 읽기 전용' },
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

  // 테스트용 표준 담당자 계정
  const managerPassword = await bcrypt.hash('manager1234', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      name: '표준 담당자',
      department: '데이터관리부',
      status: 'ACTIVE',
    },
  })

  const managerRole = roles.find((r) => r.name === RoleName.STANDARD_MANAGER)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: managerRole.id } },
    update: {},
    create: { userId: manager.id, roleId: managerRole.id },
  })

  // 테스트용 승인자 계정
  const approverPassword = await bcrypt.hash('approver1234', 12)
  const approver = await prisma.user.upsert({
    where: { email: 'approver@example.com' },
    update: {},
    create: {
      email: 'approver@example.com',
      password: approverPassword,
      name: '승인 담당자',
      department: '데이터관리부',
      status: 'ACTIVE',
    },
  })

  const approverRole = roles.find((r) => r.name === RoleName.APPROVER)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: approver.id, roleId: approverRole.id } },
    update: {},
    create: { userId: approver.id, roleId: approverRole.id },
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

  console.log('Seed completed:', {
    roles: roles.length,
    admin: admin.email,
    manager: manager.email,
    approver: approver.email,
    domain: domain.domainName,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

Step 6: 시드 실행

Run: `npx tsx prisma/seed.ts`
Expected: `Seed completed: { roles: 4, admin: 'admin@example.com', manager: 'manager@example.com', approver: 'approver@example.com', domain: '한글명' }`

Step 7: 커밋

```bash
git add -A
git commit -m "feat: add Prisma 7 schema with RBAC, standard data models, approval workflow, and seed data"
```

---

## Task 3: 인증 시스템 (Better Auth)

Files:

- Create: `src/lib/auth/index.ts`
- Create: `src/lib/auth/client.ts`
- Create: `src/lib/auth/actions.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/proxy.ts`
- Create: `src/types/auth.ts`

Step 1: Auth 타입 정의

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

Step 2: Better Auth 서버 설정

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
})
```

Step 3: Better Auth 클라이언트

`src/lib/auth/client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})
```

Step 4: 서버 액션 (RBAC 헬퍼)

`src/lib/auth/actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db/prisma'
import { RoleName } from '@prisma/client'

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

export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  })
  return userRoles.map((ur) => ur.role.name)
}
```

Step 5: Auth API 라우트

`src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

Step 6: 라우트 보호 프록시 (Next.js 16)

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

Step 7: 확인

Run: `npm run dev`

- `http://localhost:3000/api/auth/ok` → Better Auth가 응답하는지 확인
- 보호된 경로 접근 → `/login`으로 리다이렉트

Step 8: 커밋

```bash
git add -A
git commit -m "feat: add Better Auth with Prisma adapter, proxy.ts route protection, RBAC helpers"
```

---

## Task 4: 로그인/회원가입 UI

Files:

- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/page.tsx`

Step 1: 루트 페이지 (리다이렉트)

`src/app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

Step 2: 인증 레이아웃

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

Step 3: 로그인 페이지

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

Step 4: 회원가입 페이지

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

Step 5: 확인

Run: `npm run dev`

- `http://localhost:3000/login` → 로그인 폼 표시
- `http://localhost:3000/signup` → 회원가입 폼 표시
- 시드 계정(`admin@example.com` / `admin1234`)으로 로그인 확인

Step 6: 커밋

```bash
git add -A
git commit -m "feat: add login and signup pages with Better Auth client"
```

---

## Task 5: TanStack Query 설정 & API 클라이언트

> **Note:** CRUD 페이지에서 사용하므로 대시보드 레이아웃보다 먼저 설정한다.

Files:

- Create: `src/lib/query/provider.tsx`
- Create: `src/lib/query/keys.ts`
- Create: `src/lib/api/client.ts`

Step 1: API 클라이언트

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

Step 2: Query Keys 정의

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

Step 3: Query Provider

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

Step 4: 커밋

```bash
git add -A
git commit -m "feat: add TanStack Query provider, API client, and query key factory"
```

---

## Task 6: 대시보드 레이아웃 (Sidebar + Header)

Files:

- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-header.tsx`
- Create: `src/components/layout/user-nav.tsx`
- Create: `src/lib/auth/get-session.ts`

Step 1: 세션 헬퍼

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

Step 2: 사이드바

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

Step 3: 헤더 + 사용자 네비게이션

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

Step 4: 대시보드 레이아웃

`src/app/(dashboard)/layout.tsx`:

```typescript
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { QueryProvider } from '@/lib/query/provider'
import { getSession } from '@/lib/auth/get-session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <QueryProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar userRoles={user.roles} />
          <div className="flex flex-1 flex-col">
            <AppHeader userName={user.name} userEmail={user.email} />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </QueryProvider>
  )
}
```

Step 5: 확인

Run: `npm run dev`

- 로그인 후 사이드바와 헤더가 표시되는지 확인
- 사이드바에 메뉴 항목 (표준 용어, 도메인, 코드, 승인 관리) 표시
- 우측 상단 아바타 클릭 시 로그아웃 드롭다운 표시

Step 6: 커밋

```bash
git add -A
git commit -m "feat: add dashboard layout with sidebar navigation, header, and user menu"
```

---

## Task 7: 표준 도메인 CRUD (API + UI) — 레퍼런스 구현

> **Note:** 이 Task가 CRUD 패턴의 레퍼런스 구현이다. Task 8, 9는 이 패턴을 기반으로 차이점만 명시한다.

Files:

- Create: `src/lib/validations/domain.ts`
- Create: `src/app/api/domains/route.ts`
- Create: `src/app/api/domains/[id]/route.ts`
- Create: `src/components/domain/domain-table.tsx`
- Create: `src/components/domain/domain-form.tsx`
- Create: `src/components/shared/data-table-pagination.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/app/(dashboard)/domains/page.tsx`
- Create: `src/app/(dashboard)/domains/new/page.tsx`
- Create: `src/app/(dashboard)/domains/[id]/page.tsx`
- Create: `src/app/(dashboard)/domains/[id]/edit/page.tsx`

Step 1: Zod 유효성 검증 스키마

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

Step 2: API 인증 헬퍼

`src/lib/auth/require-role.ts`:

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { RoleName } from '@prisma/client'
import { getUserRoles } from './actions'

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 }) }
  }
  return { session, user: session.user }
}

export async function requireRole(requiredRoles: RoleName[]) {
  const result = await requireAuth()
  if ('error' in result) return result

  const roles = await getUserRoles(result.user.id)
  const hasAccess = requiredRoles.some((role) => roles.includes(role))

  if (!hasAccess) {
    return { error: NextResponse.json({ error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 }) }
  }

  return { session: result.session, user: result.user, roles }
}
```

Step 3: 도메인 API Routes (목록 + 생성)

`src/app/api/domains/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { domainCreateSchema } from '@/lib/validations/domain'
import { RoleName } from '@prisma/client'

// GET /api/domains - 목록 조회
export async function GET(request: NextRequest) {
  const authResult = await requireAuth()
  if ('error' in authResult) return authResult.error

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
  const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
  if ('error' in authResult) return authResult.error

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
      createdBy: authResult.user.id,
    },
  })

  return NextResponse.json({ data: domain }, { status: 201 })
}
```

Step 4: 도메인 API Routes (상세 + 수정 + 삭제)

`src/app/api/domains/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { domainUpdateSchema } from '@/lib/validations/domain'
import { RoleName } from '@prisma/client'

// GET /api/domains/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth()
  if ('error' in authResult) return authResult.error

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

// PUT /api/domains/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
  if ('error' in authResult) return authResult.error

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

// DELETE /api/domains/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
  if ('error' in authResult) return authResult.error

  const { id } = await params

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

Step 5: 공통 UI 컴포넌트

`src/components/shared/status-badge.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'

const statusConfig = {
  DRAFT: { label: '초안', variant: 'secondary' as const },
  ACTIVE: { label: '활성', variant: 'default' as const },
  DEPRECATED: { label: '폐기', variant: 'destructive' as const },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
```

`src/components/shared/data-table-pagination.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
}

export function DataTablePagination({ page, size, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / size)

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-muted-foreground">
        총 {total}건 중 {(page - 1) * size + 1}-{Math.min(page * size, total)}건
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          이전
        </Button>
        <span className="flex items-center text-sm">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          다음
        </Button>
      </div>
    </div>
  )
}
```

Step 6: 도메인 테이블 컴포넌트

`src/components/domain/domain-table.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'

interface Domain {
  id: string
  domainName: string
  dataType: string
  length: number | null
  status: string
  creator: { name: string }
  createdAt: string
}

export function DomainTable({ domains }: { domains: Domain[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>도메인명</TableHead>
          <TableHead>데이터타입</TableHead>
          <TableHead>길이</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {domains.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              등록된 도메인이 없습니다
            </TableCell>
          </TableRow>
        ) : (
          domains.map((domain) => (
            <TableRow
              key={domain.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/domains/${domain.id}`)}
            >
              <TableCell className="font-medium">{domain.domainName}</TableCell>
              <TableCell>{domain.dataType}</TableCell>
              <TableCell>{domain.length ?? '-'}</TableCell>
              <TableCell><StatusBadge status={domain.status} /></TableCell>
              <TableCell>{domain.creator.name}</TableCell>
              <TableCell>{new Date(domain.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

Step 7: 도메인 폼 컴포넌트

`src/components/domain/domain-form.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/api/client'
import { domainCreateSchema, type DomainCreateInput } from '@/lib/validations/domain'
import { useState } from 'react'

const dataTypes = ['VARCHAR', 'NUMBER', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'TEXT', 'INTEGER', 'DECIMAL']

interface DomainFormProps {
  defaultValues?: Partial<DomainCreateInput>
  domainId?: string
}

export function DomainForm({ defaultValues, domainId }: DomainFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const isEditing = !!domainId

  const form = useForm<DomainCreateInput>({
    resolver: zodResolver(domainCreateSchema),
    defaultValues: {
      domainName: '',
      domainDescription: '',
      dataType: '',
      length: null,
      scale: null,
      allowedValues: null,
      ...defaultValues,
    },
  })

  async function onSubmit(data: DomainCreateInput) {
    try {
      if (isEditing) {
        await apiClient(`/api/domains/${domainId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await apiClient('/api/domains', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      router.push('/domains')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="domainName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 한글명" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인 설명 *</FormLabel>
              <FormControl>
                <Textarea placeholder="도메인에 대한 설명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>데이터 타입 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="데이터 타입을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>길이</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>소수점 자리수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allowedValues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>허용 값</FormLabel>
              <FormControl>
                <Input placeholder="정규식 또는 값 목록" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '저장 중...' : isEditing ? '수정' : '등록'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

Step 8: 도메인 목록 페이지

`src/app/(dashboard)/domains/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DomainTable } from '@/components/domain/domain-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'

export default function DomainsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (search) params.search = search
  if (status !== 'all') params.status = status

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.domains.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient(`/api/domains?${qs}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">표준 도메인</h2>
        <Button asChild>
          <Link href="/domains/new">도메인 등록</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="도메인명 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="DRAFT">초안</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="DEPRECATED">폐기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <>
          <DomainTable domains={(data as any)?.data || []} />
          {(data as any)?.pagination && (
            <DataTablePagination
              page={(data as any).pagination.page}
              size={(data as any).pagination.size}
              total={(data as any).pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
```

Step 9: 도메인 등록 페이지

`src/app/(dashboard)/domains/new/page.tsx`:

```typescript
import { DomainForm } from '@/components/domain/domain-form'

export default function NewDomainPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 도메인 등록</h2>
      <DomainForm />
    </div>
  )
}
```

Step 10: 도메인 상세 페이지

`src/app/(dashboard)/domains/[id]/page.tsx`:

```typescript
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { getSession } from '@/lib/auth/get-session'

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  const domain = await prisma.standardDomain.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      terms: { select: { id: true, termName: true, status: true } },
    },
  })

  if (!domain) notFound()

  const canEdit = user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{domain.domainName}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/domains/${id}/edit`}>수정</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/domains">목록</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>도메인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">도메인명</p>
              <p className="font-medium">{domain.domainName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusBadge status={domain.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">데이터 타입</p>
              <p className="font-medium">{domain.dataType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">길이</p>
              <p className="font-medium">{domain.length ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">소수점 자리수</p>
              <p className="font-medium">{domain.scale ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">허용 값</p>
              <p className="font-medium">{domain.allowedValues || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">설명</p>
            <p className="font-medium">{domain.domainDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">등록자</p>
              <p className="font-medium">{domain.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">{new Date(domain.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {domain.terms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>연결된 표준 용어 ({domain.terms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {domain.terms.map((term) => (
                <li key={term.id} className="flex items-center justify-between">
                  <Link href={`/standards/${term.id}`} className="text-blue-600 hover:underline">
                    {term.termName}
                  </Link>
                  <StatusBadge status={term.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

Step 11: 도메인 수정 페이지

`src/app/(dashboard)/domains/[id]/edit/page.tsx`:

```typescript
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { DomainForm } from '@/components/domain/domain-form'

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const domain = await prisma.standardDomain.findUnique({ where: { id } })

  if (!domain) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 도메인 수정</h2>
      <DomainForm
        domainId={id}
        defaultValues={{
          domainName: domain.domainName,
          domainDescription: domain.domainDescription,
          dataType: domain.dataType,
          length: domain.length,
          scale: domain.scale,
          allowedValues: domain.allowedValues,
        }}
      />
    </div>
  )
}
```

Step 12: 확인

Run: `npm run dev`

- `http://localhost:3000/domains` → 도메인 목록 표시 (시드 데이터 포함)
- 도메인 등록 → 새 도메인 생성 (status: DRAFT)
- 상세 페이지 → 도메인 정보 표시
- 수정/삭제 동작 확인

Step 13: 커밋

```bash
git add -A
git commit -m "feat: add standard domain CRUD - API routes, validation, list/detail/form pages"
```

---

## Task 8: 표준 용어 CRUD (API + UI)

> **Pattern:** Task 7(도메인 CRUD)과 동일한 패턴. 차이점만 명시.

Files:

- Create: `src/lib/validations/standard.ts`
- Create: `src/app/api/standards/route.ts`
- Create: `src/app/api/standards/[id]/route.ts`
- Create: `src/components/standard/term-table.tsx`
- Create: `src/components/standard/term-form.tsx`
- Create: `src/app/(dashboard)/standards/page.tsx`
- Create: `src/app/(dashboard)/standards/new/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/page.tsx`
- Create: `src/app/(dashboard)/standards/[id]/edit/page.tsx`

차이점 (vs. 도메인):

1. **Zod 스키마** (`src/lib/validations/standard.ts`):

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

1. **폼에 도메인 선택 드롭다운 추가**: 등록/수정 폼에서 `GET /api/domains?size=100`으로 도메인 목록을 조회하여 Select 컴포넌트로 표시
2. **테이블 컬럼**: 용어명, 영문명, 약어, 도메인, 상태, 등록자, 등록일
3. **상세 페이지**: 연결된 도메인 정보 표시, 버전 번호 표시
4. **API 검색**: `termName`, `termEnglishName`, `termDescription`에서 검색

구현 순서:

1. Zod 스키마 작성
2. API Routes (`GET/POST /api/standards`, `GET/PUT/DELETE /api/standards/:id`) — 도메인 API와 동일한 패턴, 모델명과 필드만 변경
3. `term-table.tsx` — 도메인 테이블과 동일 패턴, 컬럼 변경
4. `term-form.tsx` — 도메인 폼과 동일 패턴, 도메인 선택 드롭다운 추가
5. 목록/상세/등록/수정 페이지 — 도메인 페이지와 동일 패턴

커밋:

```bash
git add -A
git commit -m "feat: add standard term CRUD - API routes, list/detail/form pages with domain selection"
```

---

## Task 9: 표준 코드 CRUD (API + UI)

> **Pattern:** Task 7(도메인 CRUD)과 동일한 CRUD 패턴. 코드 그룹 + 코드 아이템 2단 구조가 차이점.

Files:

- Create: `src/lib/validations/code.ts`
- Create: `src/app/api/codes/route.ts`
- Create: `src/app/api/codes/[id]/route.ts`
- Create: `src/components/code/code-group-table.tsx`
- Create: `src/components/code/code-group-form.tsx`
- Create: `src/components/code/code-item-editor.tsx`
- Create: `src/app/(dashboard)/codes/page.tsx`
- Create: `src/app/(dashboard)/codes/new/page.tsx`
- Create: `src/app/(dashboard)/codes/[id]/page.tsx`
- Create: `src/app/(dashboard)/codes/[id]/edit/page.tsx`

차이점 (vs. 도메인):

1. **Zod 스키마** (`src/lib/validations/code.ts`):

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

export type CodeItemInput = z.infer<typeof codeItemSchema>
export type CodeGroupCreateInput = z.infer<typeof codeGroupCreateSchema>
export type CodeGroupUpdateInput = z.infer<typeof codeGroupUpdateSchema>
```

1. **코드 아이템 인라인 편집기** (`src/components/code/code-item-editor.tsx`): 상세 페이지에서 하위 코드 아이템을 추가/삭제/순서 변경하는 인라인 테이블. `itemCode`, `itemName`, `itemDescription`, `sortOrder`, `isActive` 편집 가능.
2. **API**: POST 시 `items` 배열을 함께 받아 트랜잭션으로 생성. PUT 시 기존 아이템 삭제 후 새 아이템 일괄 생성.
3. **상세 페이지**: 코드 그룹 정보 + 하위 코드 아이템 테이블

구현 순서:

1. Zod 스키마 작성
2. API Routes — 코드 그룹 CRUD + 하위 아이템 일괄 관리
3. `code-group-table.tsx` — 그룹 목록
4. `code-group-form.tsx` — 그룹 등록/수정 폼
5. `code-item-editor.tsx` — 인라인 아이템 편집기
6. 목록/상세/등록/수정 페이지

커밋:

```bash
git add -A
git commit -m "feat: add code group/item CRUD - API routes, list/detail/form pages with inline item editing"
```

---

## Task 10: 승인 워크플로우 (API + UI)

Files:

- Create: `src/lib/workflow/approval-service.ts`
- Create: `src/app/api/workflow/route.ts`
- Create: `src/app/api/workflow/[id]/route.ts`
- Create: `src/app/api/workflow/[id]/approve/route.ts`
- Create: `src/app/api/workflow/[id]/reject/route.ts`
- Create: `src/app/(dashboard)/workflow/page.tsx`
- Create: `src/app/(dashboard)/workflow/[id]/page.tsx`
- Modify: `src/app/api/domains/route.ts` (POST에 승인 요청 추가)
- Modify: `src/app/api/standards/route.ts` (POST에 승인 요청 추가)
- Modify: `src/app/api/codes/route.ts` (POST에 승인 요청 추가)

Step 1: 승인 서비스 로직

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
      data: { status: ApprovalStatus.APPROVED, approverId },
    })

    await tx.approvalHistory.create({
      data: {
        requestId: request.id,
        action: ApprovalAction.APPROVED,
        actorId: approverId,
        comment,
      },
    })

    await activateTarget(tx, request.targetType, request.targetId)
    return request
  })
}

export async function rejectRequest(requestId: string, approverId: string, comment: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.update({
      where: { id: requestId },
      data: { status: ApprovalStatus.REJECTED, approverId },
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

async function activateTarget(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  targetType: TargetType,
  targetId: string,
) {
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

Step 2: 워크플로우 API Routes

- `GET /api/workflow` — 요청 목록 (역할별 필터: STANDARD_MANAGER는 자기 요청, APPROVER는 승인 대기)
- `GET /api/workflow/:id` — 요청 상세 + 이력
- `POST /api/workflow/:id/approve` — 승인 (APPROVER/ADMIN 권한)
- `POST /api/workflow/:id/reject` — 반려 (APPROVER/ADMIN 권한, `comment` 필수)

Step 3: Task 7~9의 등록 API에 승인 워크플로우 연결

도메인 등록 예시 (`src/app/api/domains/route.ts` POST 수정):

```typescript
// 기존 domain create 코드 아래에 추가
import { createApprovalRequest } from '@/lib/workflow/approval-service'

// POST handler 내부 — domain 생성 후
await createApprovalRequest({
  targetType: 'DOMAIN',
  targetId: domain.id,
  requestType: 'CREATE',
  requesterId: authResult.user.id,
})
```

표준 용어, 코드 그룹도 동일한 패턴으로 연결.

Step 4: 승인 관리 UI

`src/app/(dashboard)/workflow/page.tsx`:

- 탭 2개: "내 요청" / "승인 대기" (APPROVER/ADMIN만)
- 요청 테이블: 대상 타입, 대상명, 요청 유형, 요청자, 상태, 요청일
- 행 클릭 시 상세 페이지 이동

`src/app/(dashboard)/workflow/[id]/page.tsx`:

- 요청 상세 정보 + 대상 데이터 미리보기
- 승인 이력 타임라인
- 승인/반려 버튼 (APPROVER/ADMIN만, 반려 시 사유 입력 필수)

Step 5: 확인

- 표준 담당자로 도메인 등록 → 승인 요청 자동 생성
- 승인자로 로그인 → 승인 대기 목록에 표시
- 승인 → 도메인 status가 ACTIVE로 변경
- 반려 → 사유 입력 필수, 도메인 status 유지 (DRAFT)

Step 6: 커밋

```bash
git add -A
git commit -m "feat: add approval workflow - service layer, API routes, workflow pages, integration with CRUD"
```

---

## Task 11: 관리자 페이지 (사용자/역할 관리)

Files:

- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/role/route.ts`
- Create: `src/app/(dashboard)/admin/users/page.tsx`

Step 1: 관리자 API

`GET /api/admin/users`:

- ADMIN 권한만 접근
- 사용자 목록 (이름, 이메일, 부서, 역할, 상태)
- 검색, 페이지네이션

`PUT /api/admin/users/:id/role`:

- ADMIN 권한만 접근
- 요청 body: `{ roles: ['ADMIN', 'STANDARD_MANAGER'] }`
- 기존 역할 삭제 후 새 역할 일괄 부여

Step 2: 관리자 UI

`src/app/(dashboard)/admin/users/page.tsx`:

- 사용자 테이블: 이름, 이메일, 부서, 역할 뱃지, 상태
- 역할 변경: 각 사용자 행에 역할 멀티셀렉트 드롭다운
- ADMIN 역할이 아닌 경우 접근 시 리다이렉트 (`getSession()`으로 확인)

Step 3: 커밋

```bash
git add -A
git commit -m "feat: add admin page - user list with role management"
```

---

## Task 12: E2E 테스트 (Playwright)

Files:

- Create: `playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Create: `e2e/domains.spec.ts`

Step 1: Playwright 설치 및 설정

```bash
npm install -D @playwright/test
npx playwright install chromium
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

Step 2: 인증 E2E 테스트

`e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('인증', () => {
  test('로그인 페이지가 표시된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  })

  test('시드 계정으로 로그인할 수 있다', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin1234')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/standards/)
  })

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('wrong')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('올바르지 않습니다')).toBeVisible()
  })

  test('보호된 경로는 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/domains')
    await expect(page).toHaveURL(/\/login/)
  })
})
```

Step 3: 도메인 CRUD E2E 테스트

`e2e/domains.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('표준 도메인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin1234')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/standards/)
  })

  test('도메인 목록 페이지가 표시된다', async ({ page }) => {
    await page.goto('/domains')
    await expect(page.getByRole('heading', { name: '표준 도메인' })).toBeVisible()
  })

  test('새 도메인을 등록할 수 있다', async ({ page }) => {
    await page.goto('/domains/new')
    await page.getByLabel('도메인명').fill('테스트도메인')
    await page.getByLabel('도메인 설명').fill('E2E 테스트용 도메인')
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByText('VARCHAR').click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/domains/)
  })
})
```

Step 4: 테스트 실행

Run: `npx playwright test`

Step 5: 커밋

```bash
git add -A
git commit -m "test: add Playwright E2E tests for auth flow and domain CRUD"
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
