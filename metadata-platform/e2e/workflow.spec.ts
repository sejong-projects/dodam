import { test, expect } from '@playwright/test'
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
