# E2E Tests (Playwright) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Playwright E2E test suite covering auth, 3 CRUD entities, approval workflow, and admin — the final quality gate for the `feature/metadata-platform` branch.

**Architecture:** Playwright with project-based auth setup (storageState per role), global DB reset+seed, 6 spec files. Workflow tests run serially after all others. Chromium only.

**Tech Stack:** @playwright/test, Playwright Chromium, Next.js 16.1 dev server

**Design doc:** `docs/plans/2026-03-12-e2e-tests-design.md`

**Working directory:** `.worktrees/metadata-platform/metadata-platform/` (all commands run from here)

---

## Chunk 1: Infrastructure & Auth

### Task 1: Install Playwright and create configuration

**Files:**
- Modify: `.gitignore`
- Create: `playwright.config.ts`
- Create: `e2e/global-setup.ts`
- Create: `e2e/fixtures/test-data.ts`

- [ ] **Step 1: Install @playwright/test**

```bash
npm install -D @playwright/test
```

- [ ] **Step 2: Install Chromium browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Add `e2e/.auth/` to `.gitignore`**

Append to `.gitignore`:

```
# Playwright
e2e/.auth/
```

- [ ] **Step 4: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /workflow\.spec\.ts/,
    },
    {
      name: 'workflow',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/manager.json',
      },
      dependencies: ['chromium'],
      testMatch: /workflow\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npx next dev --webpack',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 5: Create `e2e/global-setup.ts`**

```typescript
import { execSync } from 'child_process'
import path from 'path'

export default function globalSetup() {
  const cwd = path.resolve(__dirname, '..')

  console.log('[global-setup] Resetting database...')
  execSync('npx prisma db push --force-reset --accept-data-loss', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  })

  console.log('[global-setup] Seeding database...')
  execSync('npm run db:seed', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  })
}
```

- [ ] **Step 6: Create `e2e/fixtures/test-data.ts`**

```typescript
export const USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin1234',
    name: '시스템 관리자',
  },
  manager: {
    email: 'manager@example.com',
    password: 'manager1234',
    name: '표준 담당자',
  },
  approver: {
    email: 'approver@example.com',
    password: 'approver1234',
    name: '승인 담당자',
  },
} as const

export function testDomain() {
  const ts = Date.now()
  return {
    name: `E2E-도메인-${ts}`,
    description: `E2E 테스트용 도메인 ${ts}`,
    dataType: 'VARCHAR',
  }
}

export function testTerm() {
  const ts = Date.now()
  return {
    termName: `E2E-용어-${ts}`,
    termEnglishName: `E2E-Term-${ts}`,
    termDescription: `E2E 테스트용 용어 ${ts}`,
  }
}

export function testCodeGroup() {
  const ts = Date.now()
  return {
    groupName: `E2E-코드그룹-${ts}`,
    groupEnglishName: `E2E_CODE_GROUP_${ts}`,
    groupDescription: `E2E 테스트용 코드 그룹 ${ts}`,
    items: [
      { code: 'A', name: '항목A', description: '첫 번째 항목' },
      { code: 'B', name: '항목B', description: '두 번째 항목' },
    ],
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e/global-setup.ts e2e/fixtures/test-data.ts .gitignore package.json package-lock.json
git commit -m "test: add Playwright config, global setup, and test data fixtures"
```

---

### Task 2: Auth setup (storageState per role)

**Files:**
- Create: `e2e/setup/auth.setup.ts`

- [ ] **Step 1: Create `e2e/setup/auth.setup.ts`**

```typescript
import { test as setup, expect } from '@playwright/test'
import { USERS } from '../fixtures/test-data'

const authDir = 'e2e/.auth'

async function loginAndSave(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  outputPath: string,
) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL(/\/standards/)
  await page.context().storageState({ path: outputPath })
}

setup('authenticate as admin', async ({ page }) => {
  await loginAndSave(page, USERS.admin.email, USERS.admin.password, `${authDir}/admin.json`)
})

setup('authenticate as manager', async ({ page }) => {
  await loginAndSave(page, USERS.manager.email, USERS.manager.password, `${authDir}/manager.json`)
})

setup('authenticate as approver', async ({ page }) => {
  await loginAndSave(page, USERS.approver.email, USERS.approver.password, `${authDir}/approver.json`)
})
```

- [ ] **Step 2: Verify setup runs (requires dev server + DB)**

```bash
npx playwright test --project=setup
```

Expected: 3 tests pass, `e2e/.auth/admin.json`, `manager.json`, `approver.json` created.

- [ ] **Step 3: Commit**

```bash
git add e2e/setup/auth.setup.ts
git commit -m "test: add Playwright auth setup with storageState per role"
```

---

### Task 3: Auth spec

**Files:**
- Create: `e2e/auth.spec.ts`

- [ ] **Step 1: Create `e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { USERS } from './fixtures/test-data'

// Auth tests run without pre-authenticated state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('인증', () => {
  test('로그인 페이지가 표시된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
    await expect(page.getByText('메타데이터 관리 플랫폼에 로그인하세요')).toBeVisible()
  })

  test('시드 계정으로 로그인할 수 있다', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USERS.admin.email)
    await page.getByLabel('비밀번호').fill(USERS.admin.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/standards/)
  })

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USERS.admin.email)
    await page.getByLabel('비밀번호').fill('wrongpassword')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('올바르지 않습니다')).toBeVisible()
  })

  test('보호된 경로는 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/domains')
    await expect(page).toHaveURL(/\/login/)
  })

  test('회원가입 페이지가 표시된다', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible()
    await expect(page.getByText('새 계정을 만들어 시작하세요')).toBeVisible()
  })

  test('로그아웃하면 로그인 페이지로 이동한다', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USERS.admin.email)
    await page.getByLabel('비밀번호').fill(USERS.admin.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/standards/)

    // Open user menu and logout
    await page.locator('button.rounded-full').click()
    await page.getByText('로그아웃').click()
    await expect(page).toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 2: Run auth spec**

```bash
npx playwright test auth.spec.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/auth.spec.ts
git commit -m "test: add auth E2E tests (login, signup, logout, route protection)"
```

---

## Chunk 2: CRUD Entity Specs

### Task 4: Domains spec

**Files:**
- Create: `e2e/domains.spec.ts`

- [ ] **Step 1: Create `e2e/domains.spec.ts`**

Uses admin storageState (default from chromium project config).

```typescript
import { test, expect } from '@playwright/test'
import { testDomain } from './fixtures/test-data'

test.describe('표준 도메인', () => {
  test('도메인 목록이 표시된다', async ({ page }) => {
    await page.goto('/domains')
    await expect(page.getByRole('heading', { name: '표준 도메인' })).toBeVisible()
    // Seed domain "한글명" should be in the table
    await expect(page.getByText('한글명')).toBeVisible()
  })

  test('새 도메인을 등록할 수 있다', async ({ page }) => {
    const domain = testDomain()

    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)

    // Select data type
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()

    await page.getByRole('button', { name: '등록' }).click()

    // Should redirect to list and show the new domain
    await expect(page).toHaveURL(/\/domains$/)
    await expect(page.getByText(domain.name)).toBeVisible()
  })

  test('도메인 상세를 조회할 수 있다', async ({ page }) => {
    await page.goto('/domains')

    // Click seed domain row
    await page.getByText('한글명').click()
    await expect(page).toHaveURL(/\/domains\/[a-z0-9-]+$/)

    // Detail page should show domain info
    await expect(page.getByText('한글명')).toBeVisible()
    await expect(page.getByText('VARCHAR')).toBeVisible()
  })

  test('도메인을 수정할 수 있다', async ({ page }) => {
    // First create a domain to edit
    const domain = testDomain()
    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/domains$/)

    // Navigate to detail, then edit
    await page.getByText(domain.name).click()
    await expect(page).toHaveURL(/\/domains\/[a-z0-9-]+$/)
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    // Change description
    const newDescription = '수정된 설명 ' + Date.now()
    await page.getByLabel('도메인 설명 *').clear()
    await page.getByLabel('도메인 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/domains$/)
  })

  test('도메인을 검색할 수 있다', async ({ page }) => {
    await page.goto('/domains')

    // Search for seed domain
    await page.getByPlaceholder('도메인명 검색...').fill('한글명')

    // Wait for debounce (300ms) + network
    await expect(page.getByText('한글명')).toBeVisible()

    // Search for non-existent domain
    await page.getByPlaceholder('도메인명 검색...').clear()
    await page.getByPlaceholder('도메인명 검색...').fill('존재하지않는도메인xyz')

    await expect(page.getByText('등록된 도메인이 없습니다')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run domains spec**

```bash
npx playwright test domains.spec.ts --project=chromium
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/domains.spec.ts
git commit -m "test: add domain CRUD E2E tests"
```

---

### Task 5: Standards spec

**Files:**
- Create: `e2e/standards.spec.ts`

- [ ] **Step 1: Create `e2e/standards.spec.ts`**

Uses manager storageState.

```typescript
import { test, expect } from '@playwright/test'
import { testTerm } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/manager.json' })

test.describe('표준 용어', () => {
  test('용어 목록이 표시된다', async ({ page }) => {
    await page.goto('/standards')
    await expect(page.getByRole('heading', { name: '표준 용어' })).toBeVisible()
  })

  test('새 용어를 등록할 수 있다', async ({ page }) => {
    const term = testTerm()

    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)

    // Select domain (seed domain "한글명" should be available)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page).toHaveURL(/\/standards$/)
    await expect(page.getByText(term.termName)).toBeVisible()
  })

  test('용어 상세를 조회할 수 있다', async ({ page }) => {
    // Create a term first
    const term = testTerm()
    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/standards$/)

    // Click to view detail
    await page.getByText(term.termName).click()
    await expect(page).toHaveURL(/\/standards\/[a-z0-9-]+$/)
    await expect(page.getByText(term.termName)).toBeVisible()
    await expect(page.getByText(term.termEnglishName)).toBeVisible()
  })

  test('용어를 수정할 수 있다', async ({ page }) => {
    // Create a term first
    const term = testTerm()
    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/standards$/)

    // Navigate to detail, then edit
    await page.getByText(term.termName).click()
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    const newDescription = '수정된 용어 설명 ' + Date.now()
    await page.getByLabel('용어 설명 *').clear()
    await page.getByLabel('용어 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/standards$/)
  })
})
```

- [ ] **Step 2: Run standards spec**

```bash
npx playwright test standards.spec.ts --project=chromium
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/standards.spec.ts
git commit -m "test: add standard term CRUD E2E tests"
```

---

### Task 6: Codes spec

**Files:**
- Create: `e2e/codes.spec.ts`

- [ ] **Step 1: Create `e2e/codes.spec.ts`**

Uses manager storageState.

```typescript
import { test, expect } from '@playwright/test'
import { testCodeGroup } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/manager.json' })

test.describe('표준 코드', () => {
  test('코드 목록이 표시된다', async ({ page }) => {
    await page.goto('/codes')
    await expect(page.getByRole('heading', { name: '표준 코드' })).toBeVisible()
  })

  test('코드 그룹을 등록할 수 있다', async ({ page }) => {
    const codeGroup = testCodeGroup()

    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)

    // Add code items
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const rows = page.locator('table tbody tr')
      const lastRow = rows.last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page).toHaveURL(/\/codes$/)
    await expect(page.getByText(codeGroup.groupName)).toBeVisible()
  })

  test('코드 그룹 상세를 조회할 수 있다', async ({ page }) => {
    // Create a code group first
    const codeGroup = testCodeGroup()
    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const lastRow = page.locator('table tbody tr').last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/codes$/)

    // Click to view detail
    await page.getByText(codeGroup.groupName).click()
    await expect(page).toHaveURL(/\/codes\/[a-z0-9-]+$/)
    await expect(page.getByText(codeGroup.groupName)).toBeVisible()
    await expect(page.getByText(codeGroup.groupEnglishName)).toBeVisible()
    // Verify code items are shown
    await expect(page.getByText('항목A')).toBeVisible()
    await expect(page.getByText('항목B')).toBeVisible()
  })

  test('코드 그룹을 수정할 수 있다', async ({ page }) => {
    // Create a code group first
    const codeGroup = testCodeGroup()
    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const lastRow = page.locator('table tbody tr').last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/codes$/)

    // Navigate to detail, then edit
    await page.getByText(codeGroup.groupName).click()
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    const newDescription = '수정된 코드 그룹 설명 ' + Date.now()
    await page.getByLabel('코드 그룹 설명 *').clear()
    await page.getByLabel('코드 그룹 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/codes$/)
  })
})
```

- [ ] **Step 2: Run codes spec**

```bash
npx playwright test codes.spec.ts --project=chromium
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/codes.spec.ts
git commit -m "test: add code group CRUD E2E tests"
```

---

## Chunk 3: Workflow, Admin & Final Verification

### Task 7: Workflow spec

**Files:**
- Create: `e2e/workflow.spec.ts`

- [ ] **Step 1: Create `e2e/workflow.spec.ts`**

Uses manager storageState by default (from workflow project config). Tests run serially because they share state.

```typescript
import { test, expect, type BrowserContext } from '@playwright/test'
import { testDomain } from './fixtures/test-data'

// Force serial execution — tests depend on each other
test.describe.configure({ mode: 'serial' })

test.describe('승인 워크플로우', () => {
  let createdDomainName: string

  test('등록 시 승인 요청이 자동 생성된다', async ({ page }) => {
    // Manager creates a new domain
    const domain = testDomain()
    createdDomainName = domain.name

    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/domains$/)

    // Check workflow page — "내 요청" tab should show PENDING request
    await page.goto('/workflow')
    await expect(page.getByRole('heading', { name: '승인 관리' })).toBeVisible()

    // "내 요청" tab is default
    await expect(page.getByText(createdDomainName)).toBeVisible()
    await expect(page.getByText('대기')).toBeVisible()
  })

  test('승인자가 승인 대기 목록을 확인할 수 있다', async ({ browser }) => {
    // Switch to approver context
    const approverContext = await browser.newContext({
      storageState: 'e2e/.auth/approver.json',
    })
    const page = await approverContext.newPage()

    await page.goto('/workflow')

    // Click "승인 대기" tab
    await page.getByRole('tab', { name: '승인 대기' }).click()
    await expect(page.getByText(createdDomainName)).toBeVisible()

    await approverContext.close()
  })

  test('승인자가 요청을 승인할 수 있다', async ({ browser }) => {
    const approverContext = await browser.newContext({
      storageState: 'e2e/.auth/approver.json',
    })
    const page = await approverContext.newPage()

    await page.goto('/workflow')
    await page.getByRole('tab', { name: '승인 대기' }).click()
    await page.getByText(createdDomainName).click()
    await expect(page).toHaveURL(/\/workflow\/[a-z0-9-]+$/)

    // Approve
    await page.getByRole('button', { name: '승인' }).click()

    // Status should change to "승인"
    await expect(page.getByText('승인')).toBeVisible()

    await approverContext.close()
  })

  test('승인자가 요청을 반려할 수 있다', async ({ page, browser }) => {
    // Manager creates another domain
    const domain = testDomain()

    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/domains$/)

    // Switch to approver
    const approverContext = await browser.newContext({
      storageState: 'e2e/.auth/approver.json',
    })
    const approverPage = await approverContext.newPage()

    await approverPage.goto('/workflow')
    await approverPage.getByRole('tab', { name: '승인 대기' }).click()
    await approverPage.getByText(domain.name).click()

    // Reject
    await approverPage.getByRole('button', { name: '반려' }).click()

    // Fill reject reason in dialog
    await expect(approverPage.getByText('반려 사유 입력')).toBeVisible()
    await approverPage.getByPlaceholder('반려 사유를 입력하세요...').fill('E2E 테스트 반려 사유')
    await approverPage.getByRole('button', { name: '반려 확인' }).click()

    // Status should change to "반려"
    await expect(approverPage.getByText('반려')).toBeVisible()

    await approverContext.close()
  })
})
```

- [ ] **Step 2: Run workflow spec**

```bash
npx playwright test workflow.spec.ts --project=workflow
```

Expected: 4 tests pass (serial).

- [ ] **Step 3: Commit**

```bash
git add e2e/workflow.spec.ts
git commit -m "test: add approval workflow E2E tests (approve and reject flows)"
```

---

### Task 8: Admin spec

**Files:**
- Create: `e2e/admin.spec.ts`

- [ ] **Step 1: Create `e2e/admin.spec.ts`**

Uses admin storageState (default from chromium project config).

```typescript
import { test, expect } from '@playwright/test'

test.describe('관리자 사용자 관리', () => {
  test('사용자 목록이 표시된다', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: '사용자 관리' })).toBeVisible()

    // Seeded users should be in the table
    await expect(page.getByText('시스템 관리자')).toBeVisible()
    await expect(page.getByText('표준 담당자')).toBeVisible()
    await expect(page.getByText('승인 담당자')).toBeVisible()
  })

  test('사용자를 검색할 수 있다', async ({ page }) => {
    await page.goto('/admin/users')

    await page.getByPlaceholder('이름 또는 이메일 검색...').fill('표준')
    await expect(page.getByText('표준 담당자')).toBeVisible()

    // Other users should not be visible
    await expect(page.getByText('시스템 관리자')).not.toBeVisible()
  })

  test('사용자 역할을 변경할 수 있다', async ({ page }) => {
    await page.goto('/admin/users')

    // Find the approver row and click edit
    const approverRow = page.getByRole('row').filter({ hasText: '승인 담당자' })
    await approverRow.getByTitle('역할 변경').click()

    // Dialog should open
    await expect(page.getByRole('heading', { name: '역할 변경' })).toBeVisible()

    // Toggle VIEWER role on (add it)
    await page.getByText('조회자').click()

    await page.getByRole('button', { name: '저장' }).click()

    // Dialog should close
    await expect(page.getByRole('heading', { name: '역할 변경' })).not.toBeVisible()

    // Revert: remove VIEWER role
    await approverRow.getByTitle('역할 변경').click()
    await page.getByText('조회자').click()
    await page.getByRole('button', { name: '저장' }).click()
  })

  test('비관리자는 관리자 페이지에 접근할 수 없다', async ({ browser }) => {
    // Use manager storageState (non-admin)
    const managerContext = await browser.newContext({
      storageState: 'e2e/.auth/manager.json',
    })
    const page = await managerContext.newPage()

    await page.goto('/admin/users')

    // Should be redirected to /standards (server-side RBAC guard)
    await expect(page).toHaveURL(/\/standards/)

    await managerContext.close()
  })
})
```

- [ ] **Step 2: Run admin spec**

```bash
npx playwright test admin.spec.ts --project=chromium
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/admin.spec.ts
git commit -m "test: add admin user management E2E tests"
```

---

### Task 9: Full test run and verification

- [ ] **Step 1: Run full test suite**

```bash
npx playwright test
```

Expected: All ~27 tests pass across 3 projects (setup → chromium → workflow).

- [ ] **Step 2: Fix any failures**

If tests fail, debug with:

```bash
npx playwright test --ui
```

Or run specific failing test with trace:

```bash
npx playwright test <spec-file> --trace on
```

- [ ] **Step 3: Verify build still passes**

```bash
npx tsc --noEmit && npm run build
```

Expected: Both pass (Playwright files are not part of the Next.js build).

- [ ] **Step 4: Add npm script for E2E tests**

Add to `package.json` scripts:

```json
"test:e2e": "npx playwright test"
```

- [ ] **Step 5: Final commit**

```bash
git add package.json
git commit -m "chore: add test:e2e script"
```
