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
