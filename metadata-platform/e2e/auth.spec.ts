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
